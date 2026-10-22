import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { ApiService, errorMessage } from './api.service';
import { Message, MessagePage, OutgoingMessage, Player } from './models';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class ChatStore {
  private readonly api = inject(ApiService);
  private readonly session = inject(SessionService);
  readonly visible = signal(window.innerWidth >= 1200);
  readonly recipient = signal<Player | null>(null);
  readonly messages = signal<Message[]>([]);
  readonly outgoing = signal<OutgoingMessage[]>([]);
  readonly status = signal<'connecting' | 'online' | 'reconnecting' | 'offline'>('offline');
  readonly loading = signal(false);
  readonly historyError = signal('');
  readonly pending = computed(() => this.outgoing().filter(message => message.recipientId === (this.recipient()?.id ?? null)));
  private connection?: HubConnection;
  private identity: number | null = null;
  private accountEpoch = 0;
  private conversationEpoch = 0;
  private cursor: number | null = null;
  private fetching = false;
  private retryTimer?: ReturnType<typeof setTimeout>;

  get contextRevision(): string { return this.accountEpoch + ':' + this.conversationEpoch; }

  constructor() {
    effect(() => {
      const id = this.session.user()?.id ?? null;
      untracked(() => { if (id !== this.identity) void this.changeAccount(id); });
    });
    window.addEventListener('focus', () => void this.catchUp());
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) void this.catchUp();
    });
    setInterval(() => { if (!document.hidden) void this.catchUp(); }, 15000);
  }

  open(player: Player | null = null): void {
    this.visible.set(true);
    this.select(player);
  }

  select(player: Player | null): void {
    if (player?.id === this.identity) player = null;
    if ((player?.id ?? null) === (this.recipient()?.id ?? null)) return;
    this.recipient.set(player);
    this.conversationEpoch++;
    this.cursor = null;
    this.messages.set([]);
    this.historyError.set('');
    this.fetching = false;
    this.loading.set(true);
    void this.catchUp();
  }

  private async changeAccount(id: number | null): Promise<void> {
    const epoch = ++this.accountEpoch;
    this.identity = id;
    this.conversationEpoch++;
    this.recipient.set(null);
    this.messages.set([]);
    this.outgoing.set([]);
    this.cursor = null;
    this.fetching = false;
    this.historyError.set('');
    this.loading.set(id !== null);
    this.status.set(id ? 'connecting' : 'offline');
    if (this.retryTimer) clearTimeout(this.retryTimer);
    const old = this.connection;
    this.connection = undefined;
    if (old) await old.stop().catch(() => undefined);
    if (!id || epoch !== this.accountEpoch) return;

    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/chat', { withCredentials: true })
      .withAutomaticReconnect([0, 1000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Error)
      .build();
    this.connection = connection;
    connection.on('message', (message: Message) => {
      if (epoch !== this.accountEpoch) return;
      this.acknowledge(message);
      if (this.belongsToCurrentConversation(message)) this.merge([message]);
    });
    connection.onreconnecting(() => { if (epoch === this.accountEpoch) this.status.set('reconnecting'); });
    connection.onreconnected(() => {
      if (epoch !== this.accountEpoch) return;
      this.status.set('online');
      void this.catchUp();
    });
    connection.onclose(() => {
      if (epoch !== this.accountEpoch) return;
      this.status.set('offline');
      this.scheduleConnect(connection, epoch);
    });
    await this.connect(connection, epoch);
  }

  private scheduleConnect(connection: HubConnection, epoch: number): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => void this.connect(connection, epoch), 5000);
  }

  private async connect(connection: HubConnection, epoch: number): Promise<void> {
    if (epoch !== this.accountEpoch || connection.state !== HubConnectionState.Disconnected) return;
    this.status.set('connecting');
    try {
      await connection.start();
      if (epoch !== this.accountEpoch) { await connection.stop(); return; }
      this.status.set('online');
      await this.catchUp();
    } catch {
      if (epoch !== this.accountEpoch) return;
      this.status.set('offline');
      this.loading.set(false);
      this.historyError.set('Chat is reconnecting. Your saved messages will return when the connection is restored.');
      this.scheduleConnect(connection, epoch);
    }
  }

  async catchUp(): Promise<void> {
    if (!this.identity || this.fetching || this.connection?.state !== HubConnectionState.Connected) return;
    const accountEpoch = this.accountEpoch;
    const conversationEpoch = this.conversationEpoch;
    const recipientId = this.recipient()?.id ?? null;
    this.fetching = true;
    if (this.cursor === null) this.loading.set(true);
    try {
      let hasMore: boolean;
      do {
        const query = new URLSearchParams({ limit: '100' });
        if (this.cursor !== null) query.set('after', String(this.cursor));
        if (recipientId !== null) query.set('withPlayerId', String(recipientId));
        const page = await this.api.get<MessagePage>('/api/chat/messages?' + query.toString());
        if (accountEpoch !== this.accountEpoch || conversationEpoch !== this.conversationEpoch) return;
        this.merge(page.messages);
        for (const message of page.messages) this.acknowledge(message);
        this.cursor = page.cursor;
        hasMore = page.hasMore;
      } while (hasMore);
      this.historyError.set('');
    } catch (error) {
      if (accountEpoch === this.accountEpoch && conversationEpoch === this.conversationEpoch)
        this.historyError.set(errorMessage(error));
    } finally {
      if (accountEpoch === this.accountEpoch && conversationEpoch === this.conversationEpoch) {
        this.fetching = false;
        this.loading.set(false);
      }
    }
  }

  async send(content: string): Promise<boolean> {
    const text = content.trim();
    if (!text || !this.identity) return false;
    const recipientId = this.recipient()?.id ?? null;
    const previous = this.outgoing().find(item => item.status === 'failed' && item.content === text && item.recipientId === recipientId);
    return this.deliver(previous ?? {
      content: text, recipientId, clientMessageId: crypto.randomUUID(), status: 'sending',
    });
  }

  retry(message: OutgoingMessage): Promise<boolean> { return this.deliver(message); }

  private async deliver(outgoing: OutgoingMessage): Promise<boolean> {
    const epoch = this.accountEpoch;
    const request = { ...outgoing, status: 'sending' as const, error: undefined };
    this.outgoing.update(items => [...items.filter(item => item.clientMessageId !== request.clientMessageId), request]);
    try {
      const message = await this.api.mutate<Message>('POST', '/api/chat/messages', {
        content: request.content, recipientId: request.recipientId, clientMessageId: request.clientMessageId,
      });
      if (epoch !== this.accountEpoch) return false;
      this.acknowledge(message);
      if (this.belongsToCurrentConversation(message)) this.merge([message]);
      return true;
    } catch (error) {
      if (epoch !== this.accountEpoch) return false;
      // A live event may have already confirmed a save whose HTTP acknowledgement was lost.
      if (!this.outgoing().some(item => item.clientMessageId === request.clientMessageId)) return true;
      this.outgoing.update(items => items.map(item => item.clientMessageId === request.clientMessageId
        ? { ...item, status: 'failed', error: errorMessage(error) } : item));
      return false;
    }
  }

  private acknowledge(message: Message): void {
    if (message.senderId !== this.identity) return;
    this.outgoing.update(items => items.filter(item => item.clientMessageId !== message.clientMessageId));
  }

  private belongsToCurrentConversation(message: Message): boolean {
    const recipientId = this.recipient()?.id ?? null;
    if (recipientId === null) return message.recipientId === null;
    return (message.senderId === this.identity && message.recipientId === recipientId)
      || (message.senderId === recipientId && message.recipientId === this.identity);
  }

  private merge(incoming: Message[]): void {
    this.messages.update(existing => {
      const messages = new Map(existing.map(message => [message.id, message]));
      for (const message of incoming) messages.set(message.id, message);
      return [...messages.values()].sort((a, b) => a.id - b.id).slice(-500);
    });
  }
}
