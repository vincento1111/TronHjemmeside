import { HubConnectionBuilder, HubConnectionState, HttpTransportType, LogLevel } from '@microsoft/signalr';
import { test, expect, json, randomUUID, type Message, type Session } from './api-helpers';

test('chat persists the authenticated author and retries do not duplicate a message', async ({ api }) => {
  const alice = await api.user('Writer');
  const bob = await api.user('NotWriter');
  const clientMessageId = randomUUID();
  const content = `Persisted retry ${clientMessageId}`;
  const body = { content, clientMessageId, senderId: bob.account.id, senderName: bob.account.displayName };
  const responses = await Promise.all(Array.from({ length: 6 }, () => alice.mutate('POST', '/api/chat/messages', body)));
  const messages = await Promise.all(responses.map((response) => json<Message>(response)));
  expect(new Set(messages.map((message) => message.id)).size).toBe(1);
  for (const message of messages) {
    expect(message.senderId).toBe(alice.account.id);
    expect(message.senderName).toBe(alice.account.displayName);
    expect(message.content).toBe(content);
    expect(message.clientMessageId).toBe(clientMessageId);
    expect(message.recipientId).toBeNull();
  }
  const history = await bob.history(`after=${messages[0].id - 1}`);
  expect(history.messages.filter((message) => message.clientMessageId === clientMessageId)).toHaveLength(1);
  const conflict = await alice.mutate('POST', '/api/chat/messages', { content: 'A different message', clientMessageId });
  expect([400, 409]).toContain(conflict.status());
  expect((await bob.history(`after=${messages[0].id - 1}`)).messages.find((message) => message.id === messages[0].id)!.content).toBe(content);
  // The retry identifier belongs to the sender; another account cannot acquire the original message by reusing it.
  const bobsMessage = await bob.send('A different sender with the same retry identifier.', null, clientMessageId);
  expect(bobsMessage.id).not.toBe(messages[0].id);
  expect(bobsMessage.senderId).toBe(bob.account.id);
});

test('private history is visible only to its two participants and never appears in global history', async ({ api }) => {
  const alice = await api.user('PrivateA');
  const bob = await api.user('PrivateB');
  const outsider = await api.user('Outside');
  const a = await alice.send(`Only Alice and Bob ${randomUUID()}`, bob.account.id);
  const b = await bob.send('Reply in the same private conversation.', alice.account.id);
  expect(a.recipientId).toBe(bob.account.id);
  expect(b.recipientId).toBe(alice.account.id);
  for (const [session, target] of [[alice, bob], [bob, alice]] as const) {
    const history = await session.history(`withPlayerId=${target.account.id}`);
    expect(history.messages.map((message) => message.id)).toEqual([a.id, b.id]);
  }
  for (const target of [alice, bob]) {
    const history = await outsider.history(`withPlayerId=${target.account.id}&after=0`);
    expect(history.messages).toEqual([]);
  }
  for (const session of [alice, bob, outsider]) {
    const global = await session.history(`after=${a.id - 1}`);
    expect(global.messages.some((message) => [a.id, b.id].includes(message.id))).toBeFalsy();
    expect(global.messages.every((message) => message.recipientId === null)).toBeTruthy();
  }
  const scopeConflict = await alice.mutate('POST', '/api/chat/messages', {
    content: a.content,
    clientMessageId: a.clientMessageId,
    recipientId: outsider.account.id,
  });
  expect([400, 409]).toContain(scopeConflict.status());
});

test('bounded catch-up retrieves every concurrent committed message once in cursor order', async ({ api }) => {
  const alice = await api.user('CatchA');
  const bob = await api.user('CatchB');
  const starting = await alice.history();
  const sent = await Promise.all(Array.from({ length: 18 }, (_, index) => (index % 2 ? alice : bob).send(`Catch-up ${index} ${randomUUID()}`)));
  const expectedIds = sent.map((message) => message.id).sort((a, b) => a - b);
  const received: Message[] = [];
  let cursor = starting.cursor;
  for (let page = 0; page < 20; page++) {
    const result = await alice.history(`after=${cursor}&limit=4`);
    expect(result.messages.length).toBeLessThanOrEqual(4);
    for (const message of result.messages) expect(message.id).toBeGreaterThan(cursor);
    const ids = result.messages.map((message) => message.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
    expect(result.cursor).toBe(result.messages.length ? result.messages.at(-1)!.id : cursor);
    received.push(...result.messages);
    cursor = result.cursor;
    if (!result.hasMore) break;
    expect(result.messages.length, 'A non-final cursor page must make progress').toBeGreaterThan(0);
  }
  const actualIds = received.filter((message) => expectedIds.includes(message.id)).map((message) => message.id);
  expect(actualIds).toEqual(expectedIds);
  expect(new Set(received.map((message) => message.id)).size).toBe(received.length);
  const caughtUp = await alice.history(`after=${cursor}&limit=4`);
  expect(caughtUp.messages).toEqual([]);
  expect(caughtUp.cursor).toBe(cursor);
  expect(caughtUp.hasMore).toBeFalsy();
});

test('live private messages reach both participants but do not leak to another connected account', async ({ api }) => {
  const alice = await api.user('LiveA');
  const bob = await api.user('LiveB');
  const outsider = await api.user('LiveOther');
  async function listen(session: Session): Promise<Message[]> {
    const state = await session.context.storageState();
    const cookie = state.cookies.map((item) => `${item.name}=${item.value}`).join('; ');
    const received: Message[] = [];
    const connection = new HubConnectionBuilder()
      .withUrl(`${api.baseURL}/hubs/chat`, {
        transport: HttpTransportType.WebSockets,
        skipNegotiation: true,
        headers: { Cookie: cookie, Origin: process.env.TRON_CHAT_ORIGIN ?? 'http://localhost:4200' },
      })
      .configureLogging(LogLevel.None)
      .build();
    connection.on('message', (message: Message) => received.push(message));
    api.cleanup.push(() => connection.stop());
    await connection.start();
    return received;
  }
  const [aliceEvents, bobEvents, outsiderEvents] = await Promise.all([listen(alice), listen(bob), listen(outsider)]);
  const privateMessage = await alice.send(`Private live ${randomUUID()}`, bob.account.id);
  await expect.poll(() => aliceEvents.some((event) => event.id === privateMessage.id)).toBeTruthy();
  await expect.poll(() => bobEvents.some((event) => event.id === privateMessage.id)).toBeTruthy();
  // A later global message is a delivery barrier: the third client's connection is healthy and caught up.
  const barrier = await bob.send(`Global delivery barrier ${randomUUID()}`);
  await expect.poll(() => outsiderEvents.some((event) => event.id === barrier.id)).toBeTruthy();
  expect(outsiderEvents.some((event) => event.id === privateMessage.id)).toBeFalsy();
  expect(outsiderEvents.every((event) => event.recipientId === null)).toBeTruthy();
});

test('the live hub refuses anonymous and untrusted-origin WebSocket connections', async ({ api }) => {
  const user = await api.user('HubGuard');
  const state = await user.context.storageState();
  const cookie = state.cookies.map((item) => `${item.name}=${item.value}`).join('; ');
  const attempts: Array<Record<string, string>> = [
    { Origin: process.env.TRON_CHAT_ORIGIN ?? 'http://localhost:4200' },
    { Cookie: cookie, Origin: 'https://untrusted.example' },
  ];
  for (const headers of attempts) {
    const connection = new HubConnectionBuilder().withUrl(`${api.baseURL}/hubs/chat`, {
      transport: HttpTransportType.WebSockets,
      skipNegotiation: true,
      headers,
    }).configureLogging(LogLevel.None).build();
    api.cleanup.push(() => connection.stop());
    await expect(connection.start()).rejects.toThrow();
  }
});

test('logging out closes an existing live connection for that session', async ({ api }) => {
  const user = await api.user('HubLogout');
  const cookie = (await user.context.storageState()).cookies.map((item) => `${item.name}=${item.value}`).join('; ');
  const connection = new HubConnectionBuilder().withUrl(`${api.baseURL}/hubs/chat`, {
    transport: HttpTransportType.WebSockets,
    skipNegotiation: true,
    headers: { Cookie: cookie, Origin: process.env.TRON_CHAT_ORIGIN ?? 'http://localhost:4200' },
  }).configureLogging(LogLevel.None).build();
  api.cleanup.push(() => connection.stop());
  await connection.start();
  expect(connection.state).toBe(HubConnectionState.Connected);
  expect((await user.mutate('POST', '/api/auth/logout')).status()).toBe(204);
  // No client stop() is called until fixture cleanup; this transition must be initiated by the server.
  await expect.poll(() => connection.state).toBe(HubConnectionState.Disconnected);
});
