import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../core/api.service';
import { SessionService } from '../core/session.service';
import { ChatStore } from '../core/chat.store';
import { Player } from '../core/models';

@Component({
  selector: 'app-players',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-heading"><div><span class="eyebrow">THE PEOPLE MAKE THE PLACE</span><h1>Meet the city<span class="heading-dot">.</span></h1><p>Find a familiar name. Make a new connection.</p></div><span class="page-number">TRON / PEOPLE</span></div>
    <form class="search-form" (ngSubmit)="load()"><label class="sr-only" for="player-search">Find a player</label><span aria-hidden="true">⌕</span><input id="player-search" name="search" [(ngModel)]="search" placeholder="Search by player name…" maxlength="64"><button class="button button-primary" [disabled]="loading()">Search ↗</button></form>
    @if (error()) { <p class="form-error" role="alert">{{ error() }} <button class="text-button" (click)="load()">Try again</button></p> }
    @if (loading()) { <div class="panel loading-panel" role="status">Looking around the city…</div> }
    <div class="people-grid">
      @for (player of players(); track player.id) {
        <article class="panel person-card">
          <div class="person-card-top"><span class="avatar avatar-large" [class.avatar-purple]="player.id % 2 === 0">{{ player.displayName.slice(0,1) }}</span><span class="pill">LEVEL {{ player.level }}</span></div>
          <h2><a [routerLink]="['/players', player.id]">{{ player.displayName }}</a>@if (player.id === session.user()?.id) { <span class="you-label">YOU</span> }</h2>
          <p class="profile-preview">{{ player.description || 'A new face with a story still to write.' }}</p>
          <div class="person-card-actions"><a [routerLink]="['/players', player.id]" class="text-link">View profile ↗</a>@if (player.id !== session.user()?.id) { <button class="button button-small button-outline" (click)="chat.open(player)">Message ⌁</button> }</div>
        </article>
      } @empty {
        @if (!loading() && !error()) { <div class="panel empty-state"><h3>No players found.</h3><p>Try a different name or clear your search.</p></div> }
      }
    </div>
  `,
})
export class PlayersComponent {
  readonly session = inject(SessionService);
  readonly chat = inject(ChatStore);
  private readonly api = inject(ApiService);
  readonly players = signal<Player[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  search = '';
  private generation = 0;
  constructor() { void this.load(); }
  async load(): Promise<void> {
    const generation = ++this.generation;
    this.loading.set(true); this.error.set('');
    try {
      const players = await this.api.get<Player[]>('/api/players?search=' + encodeURIComponent(this.search.trim()));
      if (generation === this.generation) this.players.set(players);
    } catch (error) { if (generation === this.generation) this.error.set(errorMessage(error)); }
    finally { if (generation === this.generation) this.loading.set(false); }
  }
}
