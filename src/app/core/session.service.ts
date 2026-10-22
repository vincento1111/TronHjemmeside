import { Injectable, inject, signal } from '@angular/core';
import { ApiError, ApiService } from './api.service';
import { Me, Stats } from './models';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly api = inject(ApiService);
  readonly user = signal<Me | null>(null);
  readonly connectionError = signal('');
  private generation = 0;
  private readonly channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('tron-city-session') : null;

  constructor() {
    this.channel?.addEventListener('message', event => {
      if (event.data !== 'auth-changed') return;
      // Cookies are shared by tabs. Clear the old identity immediately, including its chat.
      this.clear();
      void this.api.refreshCsrf().then(() => this.refresh()).catch(() =>
        this.connectionError.set('Your session changed in another tab. Please sign in again.'));
    });
  }

  async initialize(): Promise<void> {
    try { await this.refresh(); }
    catch { this.connectionError.set('The local server is unavailable. Start Tron City, then try signing in.'); }
  }

  async refresh(): Promise<void> {
    const generation = this.generation;
    try {
      const me = await this.api.get<Me>('/api/auth/me');
      if (generation === this.generation) {
        if (this.user()?.id !== me.id) this.generation++;
        this.user.set(me);
        this.connectionError.set('');
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        if (generation === this.generation) this.clear();
        return;
      }
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    const me = await this.api.mutate<Me>('POST', '/api/auth/login', { email, password });
    this.generation++;
    this.user.set(me);
    this.connectionError.set('');
    await this.api.refreshCsrf();
    this.channel?.postMessage('auth-changed');
  }

  async register(email: string, password: string, displayName: string): Promise<void> {
    const me = await this.api.mutate<Me>('POST', '/api/auth/register', { email, password, displayName });
    this.generation++;
    this.user.set(me);
    this.connectionError.set('');
    await this.api.refreshCsrf();
    this.channel?.postMessage('auth-changed');
  }

  async logout(): Promise<void> {
    await this.api.mutate<void>('POST', '/api/auth/logout');
    this.clear();
    this.channel?.postMessage('auth-changed');
    await this.api.refreshCsrf();
  }

  get revision(): number { return this.generation; }
  update(me: Me, revision: number): void {
    if (revision === this.generation && me.id === this.user()?.id) this.user.set(me);
  }
  updateStats(stats: Stats, revision: number): void {
    if (revision === this.generation) this.user.update(me => me ? { ...me, stats } : null);
  }
  private clear(): void { this.generation++; this.user.set(null); }
}
