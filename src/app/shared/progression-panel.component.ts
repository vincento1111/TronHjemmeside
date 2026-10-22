import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Stats } from '../core/models';

@Component({
  selector: 'app-progression-panel',
  imports: [DecimalPipe],
  template: `
    <div class="progression-grid">
      <section class="panel progression-card">
        <div class="card-label"><span>LEVEL {{ stats().level }} · EXPERIENCE</span><span class="teal">{{ stats().experience | number:'1.0-0' }} TOTAL XP</span></div>
        <div class="progression-value">
          @if (stats().xpToNextLevel > 0) {
            <strong>{{ stats().xpIntoLevel | number:'1.0-0' }}</strong><span>/ {{ stats().xpToNextLevel | number:'1.0-0' }} XP</span>
          } @else { <strong>Level 100</strong><span>LEVEL CAP</span> }
        </div>
        <div class="meter" role="progressbar" aria-label="Experience toward next level" [attr.aria-valuenow]="xpPercent()" aria-valuemin="0" aria-valuemax="100"><span [style.width.%]="xpPercent()"></span></div>
        <small>{{ stats().xpToNextLevel > 0 ? '10 XP per energy, up to level 100. Gear boosts stats, not XP.' : 'Your character has reached the maximum level. Training still improves uncapped stats.' }}</small>
      </section>
      <section class="panel progression-card">
        <div class="card-label"><span>♡ HEALTH</span><span class="health-label">+5 MAX HP PER LEVEL</span></div>
        <div class="progression-value"><strong>{{ stats().health | number:'1.0-0' }}</strong><span>/ {{ stats().maxHealth | number:'1.0-0' }} HP</span></div>
        <div class="meter health-meter" role="progressbar" aria-label="Health" [attr.aria-valuenow]="stats().health" aria-valuemin="0" [attr.aria-valuemax]="stats().maxHealth"><span [style.width.%]="100 * stats().health / stats().maxHealth"></span></div>
        <small>Grow your level to increase your maximum health.</small>
      </section>
    </div>
  `,
})
export class ProgressionPanelComponent {
  readonly stats = input.required<Stats>();
  readonly xpPercent = computed(() => this.stats().xpToNextLevel > 0
    ? Math.min(100, Math.max(0, 100 * this.stats().xpIntoLevel / this.stats().xpToNextLevel)) : 100);
}
