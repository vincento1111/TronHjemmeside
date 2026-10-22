import { Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../core/api.service';
import { SessionService } from '../core/session.service';
import { NoticeService } from '../core/notice.service';
import { STAT_INFO, StatName, TrainingResult } from '../core/models';
import { ProgressionPanelComponent } from '../shared/progression-panel.component';

@Component({
  selector: 'app-training',
  imports: [DecimalPipe, DatePipe, FormsModule, RouterLink, ProgressionPanelComponent],
  template: `
    @if (session.user(); as me) {
      <div class="page-heading"><div><span class="eyebrow">PUT IN THE WORK</span><h1>Training<span class="heading-dot">.</span></h1><p>Small gains add up. Build your character one session at a time.</p></div><span class="page-number">01 / BUILD</span></div>
      <section class="panel training-settings">
        <div><span class="eyebrow">AVAILABLE ENERGY</span><h2 class="energy-total">ϟ {{ me.stats.energy }} <span>/ {{ me.stats.maxEnergy }}</span></h2><div class="meter"><span [style.width.%]="100 * me.stats.energy / me.stats.maxEnergy"></span></div><small>+1 energy every 10 minutes · A full bar takes 12 hours.</small></div>
        <div><label for="training-amount">Energy per session</label><div class="amount-control"><input id="training-amount" type="number" min="1" max="72" step="1" [ngModel]="amount()" (ngModelChange)="amount.set($event)"><div class="quick-amounts">@for (value of [1,5,10]; track value) { <button [class.selected]="amount() === value" (click)="amount.set(value)">{{ value }}</button> }<button (click)="amount.set(me.stats.energy)" [disabled]="!me.stats.energy">Max</button></div></div><small>Training gives smaller gains as each stat grows toward 100.</small></div>
      </section>
      <app-progression-panel [stats]="me.stats" />
      <section class="panel training-bonuses" aria-label="Training bonuses">
        <div><span class="eyebrow">TRAINING EXPERIENCE</span><strong>{{ me.stats.totalTrainingEnergy | number:'1.0-0' }} <small>energy spent</small></strong></div>
        <div><span class="eyebrow">MASTERY BONUS</span><strong>+{{ me.stats.trainingMasteryPercent | number:'1.4-4' }}<small>%</small></strong></div>
        <div><span class="eyebrow">EQUIPPED GEAR</span><strong>+{{ me.stats.trainingBonusPercent | number:'1.4-4' }}<small>%</small></strong><a routerLink="/inventory" class="text-link">Manage gear ↗</a></div>
      </section>
      <div class="training-explanation"><p>Your training experience helps every stat. Mastery grows gradually toward +25%; equipped training gear adds its own bonus.</p><a href="/assets/progression-calculator.html" target="_blank" rel="noopener" class="text-link">Explore progression ↗</a></div>
      @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }
      @if (lastResult(); as result) {
        <section class="training-result" role="status"><span class="training-result-icon">✓</span><div><strong>+{{ result.statGain | number:'1.6-9' }} {{ result.stat }}</strong><p>{{ result.energySpent }} energy spent · +{{ result.xpGained | number:'1.0-0' }} XP @if (result.levelsGained) { · Level up! You are now level {{ result.stats.level }}. }</p></div></section>
      }
      <div class="training-grid">
        @for (stat of stats; track stat.name) {
          <section class="panel training-card">
            <div class="training-card-top"><span class="large-stat-icon">{{ stat.icon }}</span><span class="eyebrow">{{ me.stats[stat.name] >= 100 ? 'MAXIMUM REACHED' : 'CHARACTER STAT' }}</span></div>
            <h2>{{ stat.label }}</h2><div class="training-value fractional-stat" [title]="me.stats[stat.name].toFixed(9)">{{ me.stats[stat.name] | number:'1.4-6' }}</div>
            <p class="muted">{{ stat.description }}</p>
            <div class="training-estimate">@if (me.stats[stat.name] < 100 && validAmount()) { ≈ +{{ estimatedGain(stat.name) | number:'1.6-6' }} this session <span>{{ me.stats.level >= 100 ? 'Level 100 · XP capped' : 'Up to +' + estimatedXp() + ' XP' }}</span> } @else if (me.stats[stat.name] >= 100) { Stat cap reached: 100 } @else { Choose an energy amount to see an estimate. }</div>
            <div class="training-card-bottom"><span>ϟ {{ validAmount() ? amount() : '—' }} energy</span><button class="button button-primary" (click)="train(stat.name)" [disabled]="!!busy() || !validAmount() || amount() > me.stats.energy || me.stats[stat.name] >= 100">{{ busy() === stat.name ? 'Training…' : 'Train ' + stat.label }} <span>↗</span></button></div>
          </section>
        }
      </div>
      <p class="training-estimate-note">Gains are estimates. Each energy varies by ±3%, and gains diminish slightly as the stat rises within a session. Training grants 10 XP per energy actually spent, stopping at level 100.</p>
      <div class="tip-strip"><span>ϟ</span><p>Consumables can restore up to 24 extra energy each day. You have {{ me.stats.energyBoostRemaining }} left; resets {{ me.stats.energyBoostResetAt | date:'MMM d, HH:mm':'UTC' }} UTC.</p><a routerLink="/inventory" class="text-link">Open inventory ↗</a></div>
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
  readonly lastResult = signal<TrainingResult | null>(null);
  validAmount(): boolean { return Number.isInteger(this.amount()) && this.amount() >= 1 && this.amount() <= 72; }
  estimatedGain(stat: StatName): number {
    const stats = this.session.user()?.stats;
    if (!stats || !this.validAmount()) return 0;
    const gain = 0.0125 / Math.pow(Math.max(1, stats[stat]), 0.75)
      * (1 + stats.trainingMasteryPercent / 100) * (1 + stats.trainingBonusPercent / 100) * this.amount();
    return Math.max(0, Math.min(100 - stats[stat], gain));
  }
  estimatedXp(): number {
    const stats = this.session.user()?.stats;
    if (!stats || stats.level >= 100 || !this.validAmount()) return 0;
    return Math.max(0, Math.min(this.amount() * 10,
      stats.level === 99 ? stats.xpToNextLevel - stats.xpIntoLevel : Number.POSITIVE_INFINITY));
  }
  async train(stat: StatName): Promise<void> {
    if (this.busy() || !this.validAmount() || (this.session.user()?.stats[stat] ?? 100) >= 100) return;
    const amount = this.amount();
    const revision = this.session.revision;
    this.busy.set(stat); this.error.set(''); this.lastResult.set(null);
    try {
      const result = await this.api.mutate<TrainingResult>('POST', '/api/game/train', { stat, amount });
      if (revision !== this.session.revision) return;
      this.session.updateStats(result.stats, revision);
      this.lastResult.set(result);
      const gain = result.statGain.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 9 });
      this.notices.show('+' + gain + ' ' + stat + ' · +' + result.xpGained + ' XP'
        + (result.levelsGained ? ' · Level ' + result.stats.level + '!' : '.'));
    } catch (error) {
      if (revision !== this.session.revision) return;
      this.error.set(errorMessage(error)); await this.session.refresh().catch(() => undefined);
    }
    finally { this.busy.set(null); }
  }
}
