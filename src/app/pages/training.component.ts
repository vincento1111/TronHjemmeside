import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../core/api.service';
import { SessionService } from '../core/session.service';
import { NoticeService } from '../core/notice.service';
import { STAT_INFO, StatName, Stats } from '../core/models';

@Component({
  selector: 'app-training',
  imports: [DecimalPipe, FormsModule, RouterLink],
  template: `
    @if (session.user(); as me) {
      <div class="page-heading"><div><span class="eyebrow">PUT IN THE WORK</span><h1>Training<span class="heading-dot">.</span></h1><p>Turn today's energy into tomorrow's advantage.</p></div><span class="page-number">01 / BUILD</span></div>
      <section class="panel training-settings">
        <div><span class="eyebrow">AVAILABLE ENERGY</span><h2 class="energy-total">ϟ {{ me.stats.energy }} <span>/ {{ me.stats.maxEnergy }}</span></h2><div class="meter"><span [style.width.%]="100 * me.stats.energy / me.stats.maxEnergy"></span></div></div>
        <div><label for="training-amount">Energy per session</label><div class="amount-control"><input id="training-amount" type="number" min="1" max="72" step="1" [ngModel]="amount()" (ngModelChange)="amount.set($event)"><div class="quick-amounts">@for (value of [1,5,10]; track value) { <button [class.selected]="amount() === value" (click)="amount.set(value)">{{ value }}</button> }<button (click)="amount.set(me.stats.energy)" [disabled]="!me.stats.energy">Max</button></div></div><small>1 energy = +1 to the stat you choose.</small></div>
      </section>
      @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }
      <div class="training-grid">
        @for (stat of stats; track stat.name) {
          <section class="panel training-card">
            <div class="training-card-top"><span class="large-stat-icon">{{ stat.icon }}</span><span class="eyebrow">CHARACTER STAT</span></div>
            <h2>{{ stat.label }}</h2><div class="training-value">{{ me.stats[stat.name] | number:'1.0-0' }}</div>
            <p class="muted">{{ stat.description }}</p>
            <div class="training-card-bottom"><span>ϟ {{ validAmount() ? amount() : '—' }} energy</span><button class="button button-primary" (click)="train(stat.name)" [disabled]="!!busy() || !validAmount() || amount() > me.stats.energy">{{ busy() === stat.name ? 'Training…' : 'Train ' + stat.label }} <span>↗</span></button></div>
          </section>
        }
      </div>
      <div class="tip-strip"><span>ϟ</span><p>Out of energy? It recovers over time. A soda from your inventory restores 6 energy.</p><a routerLink="/inventory" class="text-link">Open inventory ↗</a></div>
    }
  `,
})
export class TrainingComponent {
  readonly session = inject(SessionService);
  private readonly api = inject(ApiService);
  private readonly notices = inject(NoticeService);
  readonly stats = STAT_INFO;
  readonly amount = signal(1);
  readonly busy = signal<StatName | null>(null);
  readonly error = signal('');
  validAmount(): boolean { return Number.isInteger(this.amount()) && this.amount() >= 1 && this.amount() <= 72; }
  async train(stat: StatName): Promise<void> {
    if (this.busy() || !this.validAmount()) return;
    const amount = this.amount();
    const revision = this.session.revision;
    this.busy.set(stat); this.error.set('');
    try {
      const stats = await this.api.mutate<Stats>('POST', '/api/game/train', { stat, amount });
      if (revision !== this.session.revision) return;
      this.session.updateStats(stats, revision);
      this.notices.show('Training complete. +' + amount + ' ' + stat + '.');
    } catch (error) {
      if (revision !== this.session.revision) return;
      this.error.set(errorMessage(error)); await this.session.refresh().catch(() => undefined);
    }
    finally { this.busy.set(null); }
  }
}
