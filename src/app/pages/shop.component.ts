import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../core/api.service';
import { SessionService } from '../core/session.service';
import { NoticeService } from '../core/notice.service';
import { Definition, Inventory } from '../core/models';

@Component({
  selector: 'app-shop',
  imports: [DecimalPipe, FormsModule, RouterLink],
  template: `
    <div class="page-heading"><div><span class="eyebrow">GEAR UP FOR WHAT'S NEXT</span><h1>The market<span class="heading-dot">.</span></h1><p>A little preparation goes a long way.</p></div><a routerLink="/inventory" class="button button-outline">Your inventory ↗</a></div>
    <div class="market-banner"><div><span class="eyebrow">AVAILABLE TO SPEND</span><h2>&#36;{{ session.user()?.stats?.money | number:'1.0-0' }}</h2></div><p>Weapons and training gear each have a permanent roll.<br>Equip one of each. Make them yours.</p><span class="banner-symbol" aria-hidden="true">◇</span></div>
    <div class="filter-row" role="group" aria-label="Item category">
      <button [class.selected]="filter() === 'all'" (click)="filter.set('all')">All items <span>{{ definitions().length }}</span></button>
      <button [class.selected]="filter() === 'weapon'" (click)="filter.set('weapon')">Weapons</button>
      <button [class.selected]="filter() === 'training'" (click)="filter.set('training')">Training gear</button>
      <button [class.selected]="filter() === 'consumable'" (click)="filter.set('consumable')">Consumables</button>
    </div>
    @if (loading()) { <div class="panel loading-panel" role="status">Opening the market…</div> }
    @if (error()) { <p class="form-error" role="alert">{{ error() }} <button class="text-button" (click)="load()">Reload</button></p> }
    <div class="shop-grid">
      @for (item of filtered(); track item.id) {
        <article class="panel shop-card">
          <div class="item-art" [class.soda-art]="item.kind === 'consumable'" [class.training-art]="item.kind === 'training'"><span class="item-type">{{ item.kind === 'weapon' ? 'WEAPON' : item.kind === 'training' ? 'TRAINING GEAR' : 'CONSUMABLE' }}</span><span class="item-art-symbol" aria-hidden="true">{{ item.kind === 'weapon' ? '⚔' : item.kind === 'training' ? '◈' : '▤' }}</span><span class="item-art-grid" aria-hidden="true"></span></div>
          <div class="shop-card-body"><span class="eyebrow">{{ item.tracking === 'instance' ? 'ONE OF YOUR OWN' : 'STOCK UP' }}</span><h2>{{ item.name }}</h2><p class="muted">{{ item.description }}</p>
            <div class="item-perk">
              @if (item.kind === 'weapon') { ↗ Base power {{ item.basePower }} · individually rolled }
              @else if (item.kind === 'training') { <div>◈ +{{ item.trainingBonusPercent | number:'1.4-4' }}% training gain<small>Each item rolls {{ item.trainingBonusMinPercent | number:'1.4-4' }}–{{ item.trainingBonusMaxPercent | number:'1.4-4' }}%. Equip to activate.</small></div> }
              @else { ϟ Restores {{ item.energyRestore }} energy · 24 extra energy per day across all consumables }
            </div>
            <div class="shop-purchase"><div><strong>&#36;{{ item.price | number:'1.0-0' }}</strong><small>each</small></div><label [for]="'quantity-' + item.id" class="sr-only">{{ item.name }} quantity</label><input [id]="'quantity-' + item.id" type="number" min="1" [max]="item.tracking === 'instance' ? 20 : 1000" step="1" [ngModel]="quantities[item.id] ?? 1" (ngModelChange)="quantities[item.id] = $event"></div>
            <button class="button button-primary full-width" [disabled]="busy() !== null || !canBuy(item)" (click)="buy(item)">{{ busy() === item.id ? 'Buying…' : 'Buy for $' + total(item) }} <span>↗</span></button>
          </div>
        </article>
      }
    </div>
    <div class="tip-strip"><span>↺</span><p>Changed your mind about an item? Sell it from your inventory for half its purchase price.</p></div>
  `,
})
export class ShopComponent {
  readonly session = inject(SessionService);
  private readonly api = inject(ApiService);
  private readonly notices = inject(NoticeService);
  readonly definitions = signal<Definition[]>([]);
  readonly filter = signal<'all' | 'weapon' | 'training' | 'consumable'>('all');
  readonly filtered = computed(() => this.definitions().filter(item => this.filter() === 'all' || item.kind === this.filter()));
  readonly loading = signal(true);
  readonly error = signal('');
  readonly busy = signal<number | null>(null);
  readonly quantities: Record<number, number> = {};
  constructor() { void this.load(); }
  async load(): Promise<void> {
    this.loading.set(true); this.error.set('');
    try { this.definitions.set(await this.api.get<Definition[]>('/api/items')); }
    catch (error) { this.error.set(errorMessage(error)); }
    finally { this.loading.set(false); }
  }
  total(item: Definition): number { return item.price * (this.quantities[item.id] ?? 1); }
  canBuy(item: Definition): boolean {
    const quantity = this.quantities[item.id] ?? 1;
    return Number.isInteger(quantity) && quantity >= 1 && quantity <= (item.tracking === 'instance' ? 20 : 1000)
      && this.total(item) <= (this.session.user()?.stats.money ?? 0);
  }
  async buy(item: Definition): Promise<void> {
    if (this.busy() !== null || !this.canBuy(item)) return;
    const quantity = this.quantities[item.id] ?? 1;
    this.busy.set(item.id); this.error.set('');
    const revision = this.session.revision;
    try {
      await this.api.mutate<Inventory>('POST', '/api/inventory/buy', { definitionId: item.id, quantity });
      if (revision !== this.session.revision) return;
      await this.session.refresh();
      if (revision === this.session.revision) this.notices.show(quantity + ' × ' + item.name + ' added to your inventory.');
    } catch (error) {
      if (revision !== this.session.revision) return;
      this.error.set(errorMessage(error)); await this.session.refresh().catch(() => undefined);
    }
    finally { this.busy.set(null); }
  }
}
