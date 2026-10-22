import { Component, effect, inject, signal, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionService } from './core/session.service';
import { ChatStore } from './core/chat.store';
import { NoticeService } from './core/notice.service';
import { errorMessage } from './core/api.service';
import { ChatPanelComponent } from './shared/chat-panel.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DecimalPipe, ChatPanelComponent],
  template: `
    @if (session.user(); as me) {
      <div class="city-shell" [class.chat-hidden]="!chat.visible()">
        <aside class="sidebar">
          <a routerLink="/" class="brand" aria-label="Tron City home"><span class="brand-mark">T</span><span>TRON<span class="brand-city">CITY</span></span></a>
          <div class="sidebar-caption">MAKE YOUR NEXT MOVE</div>
          <nav class="main-nav" aria-label="Main navigation">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"><span class="nav-icon">◈</span><span>Overview</span></a>
            <a routerLink="/training" routerLinkActive="active"><span class="nav-icon">ϟ</span><span>Training</span></a>
            <a routerLink="/inventory" routerLinkActive="active"><span class="nav-icon">▣</span><span>Inventory</span></a>
            <a routerLink="/shop" routerLinkActive="active"><span class="nav-icon">◇</span><span>Market</span></a>
            <a routerLink="/players" routerLinkActive="active"><span class="nav-icon">◎</span><span>People</span></a>
          </nav>
          <div class="sidebar-bottom">
            <div class="local-badge"><span class="live-dot"></span> LOCAL EDITION</div>
            <a class="sidebar-player" [routerLink]="['/players', me.id]">
              <span class="avatar">{{ me.displayName.slice(0, 1) }}</span>
              <span><strong>{{ me.displayName }}</strong><small>Level {{ me.stats.level }} · View profile</small></span><span>↗</span>
            </a>
            <button class="logout-button" [disabled]="loggingOut()" (click)="logout()">{{ loggingOut() ? 'Signing out…' : 'Sign out' }} <span>↗</span></button>
          </div>
        </aside>
        <div class="main-column">
          <header class="topbar">
            <span class="topbar-location"><span class="live-dot"></span> TRON CITY <span class="muted">/ YOUR STORY</span></span>
            <div class="topbar-resources">
              <span title="Energy"><span class="teal">ϟ</span> {{ me.stats.energy }}<span class="muted">/{{ me.stats.maxEnergy }}</span></span>
              <span title="Money"><span class="gold">$</span> {{ me.stats.money | number:'1.0-0' }}</span>
              <button class="button button-small button-outline" (click)="chat.visible.set(!chat.visible())" [attr.aria-expanded]="chat.visible()">Chat <span>⌁</span></button>
            </div>
          </header>
          <main id="main-content"><router-outlet /></main>
          <footer class="main-footer"><span>TRON CITY</span><span>Build your name. One move at a time.</span></footer>
        </div>
        <aside class="chat-column" [attr.inert]="chat.visible() ? null : ''"><app-chat-panel /></aside>
      </div>
    } @else {
      <router-outlet />
    }
    @if (notices.notice(); as notice) {
      <div class="toast" [class.toast-error]="notice.kind === 'error'" role="status"><span>{{ notice.kind === 'success' ? '✓' : '!' }}</span>{{ notice.text }}<button aria-label="Dismiss notification" (click)="notices.notice.set(null)">×</button></div>
    }
  `,
})
export class AppComponent {
  readonly session = inject(SessionService);
  readonly chat = inject(ChatStore);
  readonly notices = inject(NoticeService);
  private readonly router = inject(Router);
  readonly loggingOut = signal(false);

  constructor() {
    effect(() => {
      const me = this.session.user();
      untracked(() => {
        if (!me && !this.router.url.startsWith('/login')) void this.router.navigateByUrl('/login');
        if (me && this.router.url.startsWith('/login')) void this.router.navigateByUrl('/');
      });
    });
    window.addEventListener('focus', () => void this.refreshSession());
    setInterval(() => { if (!document.hidden) void this.refreshSession(); }, 30000);
  }
  private async refreshSession(): Promise<void> {
    if (this.session.user()) await this.session.refresh().catch(() => undefined);
  }
  async logout(): Promise<void> {
    this.loggingOut.set(true);
    try { await this.session.logout(); await this.router.navigateByUrl('/login'); }
    catch (error) { this.notices.show(errorMessage(error), 'error'); }
    finally { this.loggingOut.set(false); }
  }
}
