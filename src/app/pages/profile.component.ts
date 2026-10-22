import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../core/api.service';
import { SessionService } from '../core/session.service';
import { ChatStore } from '../core/chat.store';
import { NoticeService } from '../core/notice.service';
import { Me, Player } from '../core/models';

@Component({
  selector: 'app-profile',
  imports: [DatePipe, FormsModule, RouterLink],
  template: `
    <a routerLink="/players" class="back-link">← Back to people</a>
    @if (loading()) { <div class="panel loading-panel" role="status">Opening profile…</div> }
    @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }
    @if (player(); as profile) {
      <section class="panel profile-card">
        <div class="profile-cover"><span class="eyebrow">TRON CITY / CITIZEN {{ profile.id.toString().padStart(4, '0') }}</span><div class="profile-cover-art" aria-hidden="true">◈</div></div>
        <div class="profile-body">
          <div class="profile-identity"><span class="avatar avatar-profile" [class.avatar-purple]="profile.id % 2 === 0">{{ profile.displayName.slice(0,1) }}</span><div class="profile-identity-actions">@if (isOwner()) { <span class="pill pill-teal">YOUR PROFILE</span><button class="button button-outline" (click)="toggleEdit()">{{ editing() ? 'Cancel editing' : 'Edit profile ✎' }}</button> } @else { <button class="button button-primary" (click)="chat.open(profile)">Send a message ⌁</button> }</div></div>
          <div class="profile-name"><h1>{{ profile.displayName }}</h1><span class="pill">LEVEL {{ profile.level }}</span></div>
          <p class="muted">In the city since {{ profile.createdAt | date:'MMMM d, yyyy' }}</p>
          @if (editing() && isOwner()) {
            <form class="profile-edit-form" (ngSubmit)="save()" #profileForm="ngForm">
              <label for="profile-display-name">Display name</label><input id="profile-display-name" name="displayName" [(ngModel)]="displayName" required minlength="2" maxlength="24">
              <label for="profile-description">Your story</label><textarea id="profile-description" name="description" [(ngModel)]="description" maxlength="2000" rows="6" placeholder="Tell the city a little about yourself."></textarea><small class="field-help">{{ description.length }}/2000 characters</small>
              <button class="button button-primary" [disabled]="saving() || profileForm.invalid">{{ saving() ? 'Saving…' : 'Save profile' }} ↗</button>
            </form>
          } @else {
            <div class="profile-about"><span class="eyebrow">THE STORY SO FAR</span><p [class.muted]="!profile.description">{{ profile.description || (isOwner() ? 'This is your space. Edit your profile to tell your story.' : 'Some stories are still waiting to be told.') }}</p></div>
          }
        </div>
      </section>
      @if (!isOwner()) { <div class="tip-strip"><span>⌁</span><p>Make the first move. A private message is a good place to start.</p><button class="text-button" (click)="chat.open(profile)">Say hello ↗</button></div> }
    }
  `,
})
export class ProfileComponent {
  readonly id = input.required<string>();
  readonly session = inject(SessionService);
  readonly chat = inject(ChatStore);
  private readonly api = inject(ApiService);
  private readonly notices = inject(NoticeService);
  readonly player = signal<Player | null>(null);
  readonly isOwner = computed(() => this.player()?.id === this.session.user()?.id);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly editing = signal(false);
  readonly saving = signal(false);
  displayName = ''; description = '';
  private generation = 0;

  constructor() { effect(() => { void this.load(Number(this.id())); }); }
  private async load(id: number): Promise<void> {
    const generation = ++this.generation;
    this.loading.set(true); this.error.set(''); this.editing.set(false); this.player.set(null);
    if (!Number.isSafeInteger(id) || id < 1) { this.error.set('This player could not be found.'); this.loading.set(false); return; }
    try {
      const player = await this.api.get<Player>('/api/players/' + id);
      if (generation === this.generation) this.player.set(player);
    } catch (error) { if (generation === this.generation) this.error.set(errorMessage(error)); }
    finally { if (generation === this.generation) this.loading.set(false); }
  }
  toggleEdit(): void {
    if (!this.isOwner()) return;
    this.editing.update(value => !value);
    this.displayName = this.player()?.displayName ?? '';
    this.description = this.player()?.description ?? '';
    this.error.set('');
  }
  async save(): Promise<void> {
    if (!this.isOwner() || this.saving()) return;
    const generation = this.generation;
    const revision = this.session.revision;
    this.saving.set(true); this.error.set('');
    try {
      const me = await this.api.mutate<Me>('PUT', '/api/players/me', { displayName: this.displayName.trim(), description: this.description });
      if (revision !== this.session.revision || generation !== this.generation) return;
      this.session.update(me, revision);
      this.player.set({ id: me.id, displayName: me.displayName, description: me.description, createdAt: me.createdAt, level: me.stats.level });
      this.editing.set(false); this.notices.show('Your profile has been updated.');
    } catch (error) { if (generation === this.generation && revision === this.session.revision) this.error.set(errorMessage(error)); }
    finally { this.saving.set(false); }
  }
}
