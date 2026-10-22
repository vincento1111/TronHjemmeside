import { Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SessionService } from '../core/session.service';
import { ApiService, errorMessage } from '../core/api.service';
import { Inventory, STAT_INFO } from '../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DecimalPipe, DatePipe],
  template: `
    @if (session.user(); as me) {
      <div class="page-heading"><div><span class="eyebrow">YOUR CORNER OF THE CITY</span><h1>Overview<span class="heading-dot">.</span></h1></div><span class="pill">LEVEL {{ me.stats.level }}</span></div>
      <section class="welcome-panel">
        <div class="welcome-copy"><span class="eyebrow">EVERY MOVE COUNTS</span><h2>Welcome back,<br><span>{{ me.displayName }}.</span></h2><p>The city is yours to explore.<br>What will you make of today?</p><a routerLink="/training" class="button button-primary">Get stronger <span>↗</span></a></div>
        <div class="welcome-art" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><span class="hero-symbol">T</span><span class="art-coordinate">TRON / CITY<br>BUILD YOUR NAME</span></div>
      </section>
      <div class="resource-grid">
        <section class="panel resource-card"><div class="card-label"><span>ϟ ENERGY</span><span class="teal">{{ me.stats.energy === me.stats.maxEnergy ? 'FULLY CHARGED' : 'RECHARGING' }}</span></div><div class="resource-number">{{ me.stats.energy }}<span>/ {{ me.stats.maxEnergy }}</span></div><div class="meter"><span [style.width.%]="100 * me.stats.energy / me.stats.maxEnergy"></span></div><small>@if (me.stats.nextEnergyAt) { Next energy around {{ me.stats.nextEnergyAt | date:'shortTime' }} } @else { Ready for your next training session. }</small></section>
        <section class="panel resource-card"><div class="card-label"><span>$ CASH</span><span class="gold">MAKE IT COUNT</span></div><div class="resource-number">&#36;{{ me.stats.money | number:'1.0-0' }}</div><small>Find your next upgrade at the market.</small><a routerLink="/shop" class="text-link">Visit the market ↗</a></section>
      </div>
      <div class="section-heading"><h2>Your character</h2><a routerLink="/training" class="text-link">Go to training ↗</a></div>
      <div class="stat-grid">
        @for (stat of stats; track stat.name) { <section class="panel mini-stat"><span class="stat-icon">{{ stat.icon }}</span><strong>{{ me.stats[stat.name] | number:'1.0-0' }}</strong><span>{{ stat.label }}</span></section> }
      </div>
      <div class="dashboard-bottom">
        <section class="panel equipped-card"><div class="section-heading"><h2>Ready for the streets</h2><span class="pill">LOADOUT</span></div>
          @if (equipped(); as item) { <div class="equipment-line"><span class="weapon-symbol">⚔</span><div><h3>{{ item.name }}</h3><p>{{ item.definitionName }} · {{ item.power }} power</p></div><span class="pill pill-teal">EQUIPPED</span></div> }
          @else { <p class="muted">{{ inventoryError() || 'No weapon equipped. Pick a favorite from your inventory.' }}</p> }
          <a routerLink="/inventory" class="text-link">Manage your inventory ↗</a>
        </section>
        <section class="panel city-people-card"><span class="eyebrow">BETTER WITH PEOPLE</span><h2>Put a name<br>to the conversation.</h2><p class="muted">Find other players, visit their profiles and start a private chat.</p><a routerLink="/players" class="text-link">Meet the city ↗</a></section>
      </div>
    }
  `,
})
export class DashboardComponent {
  readonly session = inject(SessionService);
  private readonly api = inject(ApiService);
  readonly stats = STAT_INFO;
  readonly equipped = signal<Inventory['instances'][number] | null>(null);
  readonly inventoryError = signal('');
  constructor() {
    const revision = this.session.revision;
    void this.api.get<Inventory>('/api/inventory')
      .then(inventory => { if (revision === this.session.revision) this.equipped.set(inventory.instances.find(item => item.equipped) ?? null); })
      .catch(error => { if (revision === this.session.revision) this.inventoryError.set(errorMessage(error)); });
  }
}
