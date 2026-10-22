import '@angular/compiler';
import { createEnvironmentInjector, runInInjectionContext, type EnvironmentInjector } from '@angular/core';
import { test, expect } from '@playwright/test';
import { ApiService } from '../src/app/core/api.service';
import { SessionService } from '../src/app/core/session.service';
import { NoticeService } from '../src/app/core/notice.service';
import { TrainingComponent } from '../src/app/pages/training.component';
import type { Me, Stats } from '../src/app/core/models';

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}

const stats: Stats = {
  strength: 10, defense: 10, speed: 10, dexterity: 10,
  energy: 72, maxEnergy: 72, nextEnergyAt: null,
  money: 1000, level: 1, health: 100, maxHealth: 100,
};
const player = (id: number): Me => ({
  id, displayName: `Player${id}`, email: `player${id}@tron.local`,
  description: '', createdAt: '2026-10-22T00:00:00Z', stats: { ...stats },
});

test('a late training response cannot replace the next signed-in account stats', async () => {
  const trainingReply = deferred<Stats>();
  let nextPlayer = player(1);
  const api = {
    refreshCsrf: async () => undefined,
    mutate: async (_method: string, path: string) => path === '/api/game/train' ? trainingReply.promise : nextPlayer,
  };
  const environment = createEnvironmentInjector([
    { provide: ApiService, useValue: api },
    { provide: SessionService, useFactory: () => new SessionService() },
    { provide: NoticeService, useValue: { show: () => undefined } },
  ], null as unknown as EnvironmentInjector);
  const session = environment.get(SessionService);
  try {
    await session.signIn('player1@tron.local', 'test');
    const training = runInInjectionContext(environment, () => new TrainingComponent());
    const pending = training.train('strength');
    // Another tab changes the shared browser account before the first response arrives.
    nextPlayer = player(2);
    await session.signIn('player2@tron.local', 'test');
    trainingReply.resolve({ ...stats, strength: 91, energy: 1, money: 777 });
    await pending;
    expect(session.user()!.id).toBe(2);
    expect(session.user()!.stats).toEqual(player(2).stats);
  } finally {
    (session as unknown as { channel: BroadcastChannel | null }).channel?.close();
    environment.destroy();
  }
});

test('an older CSRF fetch cannot overwrite the token from a newer session refresh', async () => {
  const originalFetch = globalThis.fetch;
  const oldReply = deferred<Response>();
  const newReply = deferred<Response>();
  let csrfFetches = 0;
  let submittedToken: string | null = null;
  globalThis.fetch = async (_path, options) => {
    if (!options?.method) return ++csrfFetches === 1 ? oldReply.promise : newReply.promise;
    submittedToken = new Headers(options.headers).get('X-CSRF-TOKEN');
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const api = new ApiService();
    const oldRefresh = api.refreshCsrf();
    // Login/account-change triggers a new token request while the old response is delayed.
    const newRefresh = api.refreshCsrf();
    newReply.resolve(Response.json({ token: 'current-session-token' }));
    await newRefresh;
    oldReply.resolve(Response.json({ token: 'previous-session-token' }));
    await oldRefresh;
    await api.mutate('POST', '/api/game/train', { stat: 'strength', amount: 1 });
    expect(submittedToken).toBe('current-session-token');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('an account change cancels a mutation waiting for its old CSRF token without replaying it', async () => {
  const originalFetch = globalThis.fetch;
  const oldReply = deferred<Response>();
  const newReply = deferred<Response>();
  let csrfFetches = 0;
  let mutations = 0;
  globalThis.fetch = async (_path, options) => {
    if (!options?.method) return ++csrfFetches === 1 ? oldReply.promise : newReply.promise;
    mutations++;
    return Response.json({});
  };
  try {
    const api = new ApiService();
    const pending = api.mutate('POST', '/api/game/train', { stat: 'strength', amount: 1 });
    const changedSession = api.refreshCsrf();
    newReply.resolve(Response.json({ token: 'new-account-token' }));
    await changedSession;
    oldReply.resolve(Response.json({ token: 'old-account-token' }));
    await expect(pending).rejects.toMatchObject({ status: 409 });
    expect(mutations).toBe(0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
