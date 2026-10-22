import { test, expect, json, assertNoCredentials, type Me } from './api-helpers';

test('independent cookie sessions keep identity and expose only public profile fields', async ({ api }) => {
  const alice = await api.user('Alice');
  const bob = await api.user('Bob');
  expect(alice.account.id).not.toBe(bob.account.id);
  for (const session of [alice, bob, alice, bob]) {
    const me = await session.me();
    expect(me.id).toBe(session.account.id);
    expect(me.email).toBe(session.account.email);
    assertNoCredentials(me);
  }

  const profile = await json<Record<string, unknown>>(await alice.context.get(`/api/players/${bob.account.id}`));
  expect(profile.id).toBe(bob.account.id);
  expect(Object.keys(profile).sort()).toEqual(['createdAt', 'description', 'displayName', 'id', 'level'].sort());
  assertNoCredentials(profile);
  const search = await json<Array<Record<string, unknown>>>(await alice.context.get(`/api/players?search=${bob.account.displayName}`));
  expect(search.some((player) => player.id === bob.account.id)).toBeTruthy();
  for (const player of search) {
    expect(player).not.toHaveProperty('email');
    expect(player).not.toHaveProperty('stats');
    assertNoCredentials(player);
  }
});

test('profile edits derive the owner from the session', async ({ api }) => {
  const alice = await api.user('Owner');
  const bob = await api.user('Other');
  const before = await bob.me();
  const description = 'Only my own profile should change.';
  const result = await alice.mutate('PUT', '/api/players/me', {
    id: bob.account.id,
    email: bob.account.email,
    displayName: alice.account.displayName,
    description,
  });
  if (result.ok()) {
    const updated = await json<Me>(result);
    expect(updated.id).toBe(alice.account.id);
    expect(updated.email).toBe(alice.account.email);
    expect(updated.description).toBe(description);
  } else {
    expect([400, 422]).toContain(result.status());
    await json(await alice.mutate('PUT', '/api/players/me', { displayName: alice.account.displayName, description }));
  }
  expect((await bob.me()).description).toBe(before.description);
  expect((await bob.me()).displayName).toBe(before.displayName);
  expect((await alice.me()).description).toBe(description);
  const otherRoute = await alice.mutate('PUT', `/api/players/${bob.account.id}`, { displayName: 'Stolen', description: 'Stolen' });
  expect([403, 404, 405]).toContain(otherRoute.status());
  expect((await bob.me()).displayName).toBe(before.displayName);
});

test('anonymous callers with a valid CSRF token cannot read private state or mutate it', async ({ api }) => {
  const guest = await api.anonymous();
  for (const path of ['/api/auth/me', '/api/inventory', '/api/chat/messages']) {
    expect((await guest.context.get(path)).status(), path).toBe(401);
  }
  const attempts: Array<[string, string, unknown]> = [
    ['PUT', '/api/players/me', { displayName: 'Anonymous', description: 'No' }],
    ['POST', '/api/game/train', { stat: 'strength', amount: 1 }],
    ['POST', '/api/inventory/buy', { definitionId: 3, quantity: 1 }],
    ['POST', '/api/inventory/consume', { definitionId: 3, quantity: 1 }],
    ['POST', '/api/inventory/sell', { definitionId: 3, quantity: 1 }],
    ['POST', '/api/chat/messages', { content: 'No', clientMessageId: 'f9891447-6077-4c90-979c-5370c1a54b73' }],
  ];
  for (const [method, path, body] of attempts) {
    expect((await guest.mutate(method, path, body)).status(), path).toBe(401);
  }
});

test('mutations reject missing, forged, and another account CSRF tokens without changing state', async ({ api }) => {
  const alice = await api.user('Csrf');
  const bob = await api.user('Token');
  const before = await alice.me();
  for (const token of [null, 'forged-csrf-token', bob.csrf]) {
    const response = await alice.context.post('/api/game/train', {
      data: { stat: 'strength', amount: 1 },
      headers: token === null ? {} : { 'X-CSRF-TOKEN': token },
    });
    expect([400, 403]).toContain(response.status());
  }
  const after = await alice.me();
  expect(after.stats.energy).toBe(before.stats.energy);
  expect(after.stats.strength).toBe(before.stats.strength);
  const valid = await alice.mutate('POST', '/api/game/train', { stat: 'strength', amount: 1 });
  expect(valid.ok()).toBeTruthy();
});

test('logout ends one session and login requires the correct password', async ({ api }) => {
  const alice = await api.user('Logout');
  const bob = await api.user('Stay');
  const capturedCookie = (await alice.context.storageState()).cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
  expect((await alice.mutate('POST', '/api/auth/logout')).status()).toBe(204);
  expect((await alice.context.get('/api/auth/me')).status()).toBe(401);
  expect((await alice.context.get('/api/auth/me', { headers: { Cookie: capturedCookie } })).status()).toBe(401);
  expect((await bob.me()).id).toBe(bob.account.id);
  await alice.refreshCsrf();
  const wrong = await alice.mutate('POST', '/api/auth/login', { email: alice.account.email, password: 'WrongPassword!2026' });
  expect(wrong.status()).toBe(401);
  expect((await alice.context.get('/api/auth/me')).status()).toBe(401);
  const restored = await json<Me>(await alice.mutate('POST', '/api/auth/login', { email: alice.account.email, password: alice.password }));
  expect(restored.id).toBe(alice.account.id);
  assertNoCredentials(restored);
  await alice.refreshCsrf();
  expect((await alice.me()).id).toBe(alice.account.id);
});
