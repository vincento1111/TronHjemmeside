import { randomUUID } from 'node:crypto';
import {
  test as base,
  expect,
  type APIRequest,
  type APIRequestContext,
  type APIResponse,
} from '@playwright/test';

export { expect, randomUUID };

export interface Stats {
  strength: number;
  defense: number;
  speed: number;
  dexterity: number;
  energy: number;
  maxEnergy: number;
  nextEnergyAt: string | null;
  money: number;
  level: number;
  health: number;
  maxHealth: number;
}
export interface Me {
  id: number;
  displayName: string;
  email: string;
  description: string;
  createdAt: string;
  stats: Stats;
}
export interface Definition {
  id: number;
  name: string;
  kind: 'weapon' | 'consumable';
  tracking: 'instance' | 'stack';
  price: number;
  basePower: number;
  energyRestore: number;
}
export interface Inventory {
  instances: Array<{ id: number; definitionId: number; name: string; definitionName: string; power: number; equipped: boolean }>;
  stacks: Array<{ definitionId: number; name: string; quantity: number; energyRestore: number }>;
}
export interface Message {
  id: number;
  senderId: number;
  senderName: string;
  recipientId: number | null;
  content: string;
  createdAt: string;
  clientMessageId: string;
}
export interface History {
  messages: Message[];
  cursor: number;
  hasMore: boolean;
}

export async function json<T>(response: APIResponse): Promise<T> {
  expect(response.ok(), `${response.status()} ${await response.text()}`).toBeTruthy();
  return response.json() as Promise<T>;
}

export function assertNoCredentials(value: unknown): void {
  const walk = (item: unknown): void => {
    if (!item || typeof item !== 'object') return;
    for (const [key, child] of Object.entries(item)) {
      expect(key, 'API data must not expose credential material').not.toMatch(/password|passwordHash|securityStamp|salt/i);
      walk(child);
    }
  };
  walk(value);
  expect(JSON.stringify(value)).not.toContain('TronTests!2026');
}

export class Session {
  csrf = '';
  account!: Me;
  readonly password = 'TronTests!2026';

  constructor(readonly context: APIRequestContext) {}

  async refreshCsrf(): Promise<void> {
    this.csrf = (await json<{ token: string }>(await this.context.get('/api/csrf'))).token;
    expect(this.csrf).toBeTruthy();
  }

  mutate(method: string, path: string, data: unknown = {}): Promise<APIResponse> {
    return this.context.fetch(path, { method, data, headers: { 'X-CSRF-TOKEN': this.csrf } });
  }

  async me(): Promise<Me> {
    return json<Me>(await this.context.get('/api/auth/me'));
  }

  async inventory(): Promise<Inventory> {
    return json<Inventory>(await this.context.get('/api/inventory'));
  }

  async definitions(): Promise<Definition[]> {
    return json<Definition[]>(await this.context.get('/api/items'));
  }

  async send(content: string, recipientId: number | null = null, clientMessageId = randomUUID()): Promise<Message> {
    return json<Message>(await this.mutate('POST', '/api/chat/messages', { content, recipientId, clientMessageId }));
  }

  async history(query = ''): Promise<History> {
    return json<History>(await this.context.get(`/api/chat/messages${query ? `?${query}` : ''}`));
  }
}

class ApiFactory {
  private readonly contexts: APIRequestContext[] = [];
  readonly cleanup: Array<() => Promise<unknown>> = [];

  constructor(private readonly request: APIRequest, readonly baseURL: string) {}

  async anonymous(): Promise<Session> {
    const context = await this.request.newContext({ baseURL: this.baseURL });
    this.contexts.push(context);
    const session = new Session(context);
    await session.refreshCsrf();
    return session;
  }

  async user(label = 'Player'): Promise<Session> {
    const session = await this.anonymous();
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    session.account = await json<Me>(await session.mutate('POST', '/api/auth/register', {
      email: `test-${suffix}@tron.local`,
      password: session.password,
      displayName: `${label}${suffix}`,
    }));
    await session.refreshCsrf();
    return session;
  }

  async demo(email: string): Promise<Session> {
    const session = await this.anonymous();
    session.account = await json<Me>(await session.mutate('POST', '/api/auth/login', {
      email,
      password: 'TronLocal!2026',
    }));
    await session.refreshCsrf();
    return session;
  }

  async dispose(): Promise<void> {
    await Promise.allSettled(this.cleanup.map((stop) => stop()));
    await Promise.all(this.contexts.map((context) => context.dispose()));
  }
}

export const test = base.extend<{ api: ApiFactory }>({
  api: async ({ playwright, baseURL }, use) => {
    const factory = new ApiFactory(playwright.request, baseURL!);
    try { await use(factory); } finally { await factory.dispose(); }
  },
});
