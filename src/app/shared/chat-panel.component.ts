import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChatStore } from '../core/chat.store';
import { SessionService } from '../core/session.service';
import { OutgoingMessage } from '../core/models';

@Component({
  selector: 'app-chat-panel',
  imports: [DatePipe, FormsModule, RouterLink],
  template: `
    <section class="chat-panel" aria-label="Chat">
      <header class="chat-title">
        <div><span class="eyebrow">STAY CONNECTED</span><h2>City chat <span class="live-dot" [class.offline]="chat.status() !== 'online'"></span></h2></div>
        <button class="icon-button" aria-label="Close chat" (click)="chat.visible.set(false)">×</button>
      </header>
      <div class="chat-tabs">
        <button [class.selected]="!chat.recipient()" (click)="switchToGlobal()">Global</button>
        @if (chat.recipient(); as player) {
          <button class="selected">↗ {{ player.displayName }}</button>
        } @else {
          <a routerLink="/players" class="chat-find">Find people ↗</a>
        }
      </div>
      @if (chat.recipient(); as player) {
        <div class="conversation-label">Private conversation with <a [routerLink]="['/players', player.id]">{{ player.displayName }}</a></div>
      } @else {
        <div class="conversation-label">A shared corner of the city. Say hello.</div>
      }
      @if (chat.status() !== 'online') {
        <div class="connection-banner" role="status">{{ chat.status() === 'offline' ? 'Connection lost. Retrying…' : 'Connecting to the city…' }}</div>
      }
      <div class="chat-messages" #messageList aria-live="polite" aria-relevant="additions">
        @if (chat.loading() && !chat.messages().length) { <p class="muted chat-empty">Loading messages…</p> }
        @if (!chat.loading() && !chat.messages().length && !chat.historyError()) {
          <div class="chat-empty"><span class="empty-symbol">⌁</span><strong>Start a conversation</strong><p>Your next connection starts with hello.</p></div>
        }
        @for (message of chat.messages(); track message.id) {
          <article class="message" [class.mine]="message.senderId === session.user()?.id" [attr.data-message-id]="message.id">
            <div class="message-meta">
              <a [routerLink]="['/players', message.senderId]">{{ message.senderName }}</a>
              @if (message.senderId === session.user()?.id) { <span class="you-label">you</span> }
              <time [attr.datetime]="message.createdAt" [title]="(message.createdAt | date:'medium') ?? ''">{{ message.createdAt | date:'HH:mm' }}</time>
            </div>
            <p>{{ message.content }}</p>
          </article>
        }
        @for (message of chat.pending(); track message.clientMessageId) {
          <article class="message pending-message" [class.failed-message]="message.status === 'failed'">
            <div class="message-meta"><strong>You</strong><span>{{ message.status === 'sending' ? 'Sending…' : 'Not sent' }}</span></div>
            <p>{{ message.content }}</p>
            @if (message.status === 'failed') {
              <small>{{ message.error }}</small>
              <button class="text-button" (click)="retry(message)">Retry message ↗</button>
            }
          </article>
        }
      </div>
      @if (chat.historyError()) { <div class="chat-error" role="status">{{ chat.historyError() }} <button class="text-button" (click)="chat.catchUp()">Retry</button></div> }
      <form class="chat-compose" (ngSubmit)="send()">
        <label class="sr-only" for="chat-message">Message</label>
        <textarea id="chat-message" name="chatMessage" [ngModel]="draft()" (ngModelChange)="draft.set($event)"
          placeholder="Write a message…" rows="2" maxlength="2000" (keydown)="onKeydown($event)"></textarea>
        <div class="compose-footer"><span>Enter to send · Shift + Enter for a new line</span><button class="send-button" aria-label="Send message" [disabled]="sending() || !draft().trim()">↗</button></div>
      </form>
    </section>
  `,
})
export class ChatPanelComponent {
  readonly chat = inject(ChatStore);
  readonly session = inject(SessionService);
  readonly draft = signal('');
  readonly sending = signal(false);
  private readonly messageList = viewChild<ElementRef<HTMLDivElement>>('messageList');
  private lastConversation: number | null = null;
  private lastAccount: number | null = null;

  constructor() {
    effect(() => {
      const account = this.session.user()?.id ?? null;
      const conversation = this.chat.recipient()?.id ?? null;
      if (account !== this.lastAccount || conversation !== this.lastConversation) {
        this.draft.set('');
        this.sending.set(false);
        this.lastAccount = account;
        this.lastConversation = conversation;
      }
    });
    effect(() => {
      this.chat.messages();
      this.chat.pending();
      const element = this.messageList()?.nativeElement;
      if (element) {
        const nearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 140;
        if (nearBottom || element.scrollTop === 0) requestAnimationFrame(() => element.scrollTo({ top: element.scrollHeight }));
      }
    });
  }

  switchToGlobal(): void { this.chat.select(null); }
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void this.send(); }
  }
  async send(): Promise<void> {
    if (this.sending() || !this.draft().trim()) return;
    const draft = this.draft();
    const revision = this.session.revision;
    const context = this.chat.contextRevision;
    this.sending.set(true);
    const sent = await this.chat.send(draft);
    if (revision === this.session.revision && context === this.chat.contextRevision) {
      if (sent && this.draft() === draft) this.draft.set('');
      this.sending.set(false);
    }
  }
  async retry(message: OutgoingMessage): Promise<void> {
    const revision = this.session.revision;
    const context = this.chat.contextRevision;
    const sent = await this.chat.retry(message);
    if (sent && revision === this.session.revision && context === this.chat.contextRevision && this.draft().trim() === message.content)
      this.draft.set('');
  }
}
