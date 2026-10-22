import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../core/api.service';
import { SessionService } from '../core/session.service';
import { NoticeService } from '../core/notice.service';
import { Definition, Inventory, ItemInstance, ItemStack } from '../core/models';

@Component({
  selector: 'app-inventory',
  imports: [DatePipe, DecimalPipe, FormsModule, RouterLink],
  template: `
    <div class="page-heading"><div><span class="eyebrow">EVERY ITEM HAS A STORY</span><h1>Your inventory<span class="heading-dot">.</span></h1><p>Keep your favorites close. Make room for what's next.</p></div><a routerLink="/shop" class="button button-outline">Visit market ↗</a></div>
    @if (loading()) { <div class="panel loading-panel" role="status">Checking your inventory…</div> }
    @if (error()) { <p class="form-error" role="alert">{{ error() }} <button class="text-button" (click)="load()">Reload inventory</button></p> }
    <div class="inventory-summary"><span><strong>{{ inventory().instances.length }}</strong> individual items</span><span><strong>{{ stackCount() | number:'1.0-0' }}</strong> consumables</span><span><strong>{{ equippedCount() }}/2</strong> slots equipped</span></div>
    <div class="section-heading"><h2>Equipment</h2><span class="muted">One weapon + one training item.</span></div>
    <div class="weapon-list">
      @for (item of inventory().instances; track item.id) {
        <article class="panel weapon-row" [class.weapon-equipped]="item.equipped">
          <div class="weapon-thumbnail" [class.training-thumbnail]="item.equipmentSlot === 'training'" aria-hidden="true">{{ item.equipmentSlot === 'training' ? '◈' : '⚔' }}</div>
          <div class="weapon-details">
            <span class="eyebrow">{{ item.definitionName }} <span class="muted">/ #{{ item.id }}</span></span>
            @if (editingId() === item.id) {
              <form class="rename-form" (ngSubmit)="rename(item)"><label class="sr-only" [for]="'item-name-' + item.id">Item name</label><input [id]="'item-name-' + item.id" name="itemName" [(ngModel)]="renameText" maxlength="48" required><button class="text-button" [disabled]="!!busy() || !renameText.trim()">Save</button><button class="text-button muted" type="button" (click)="editingId.set(null)">Cancel</button></form>
            } @else {
              <h3>{{ item.name }} <button class="rename-button" [attr.aria-label]="'Rename ' + item.name" (click)="beginRename(item)">✎</button></h3>
            }
            <span class="power-label">@if (item.equipmentSlot === 'training') { ◈ +{{ item.trainingBonusPercent | number:'1.4-4' }}% training gain <span class="muted">{{ item.equipped ? '· active' : '· equip to activate' }}</span> } @else { ↗ {{ item.power }} power }</span>
          </div>
          <div class="weapon-actions"><button class="button button-small" [class.button-primary]="!item.equipped" [class.button-outline]="item.equipped" [disabled]="!!busy()" (click)="equip(item)">{{ item.equipped ? '✓ Equipped · Unequip' : 'Equip item' }}</button><button class="text-button muted" [disabled]="!!busy()" (click)="sellWeapon(item)">Sell for &#36;{{ sellPrice(item.definitionId) | number:'1.0-0' }}</button></div>
        </article>
      } @empty {
        @if (!loading()) { <div class="panel empty-state"><span class="empty-symbol">◇</span><h3>Your loadout starts here.</h3><p>Choose a weapon or training gear at the market.</p><a routerLink="/shop" class="text-link">Find your first item ↗</a></div> }
      }
    </div>
    <div class="section-heading section-gap"><h2>Consumables</h2><span class="muted">Shared stacks. Less clutter.</span></div>
    @if (session.user(); as me) {
      <div class="energy-budget"><span>ϟ</span><div><strong>{{ me.stats.energyBoostRemaining }}/24 extra energy remaining today</strong><p>All consumables share this daily allowance. Resets {{ me.stats.energyBoostResetAt | date:'MMM d, HH:mm':'UTC' }} UTC.</p></div></div>
    }
    <div class="consumable-grid">
      @for (item of inventory().stacks; track item.definitionId) {
        <article class="panel consumable-card"><div class="consumable-top"><span class="soda-symbol" aria-hidden="true">▤</span><span class="pill">× {{ item.quantity | number:'1.0-0' }}</span></div><h2>{{ item.name }}</h2><p class="muted">Restore {{ item.energyRestore }} energy per item.</p>
          <label [for]="'stack-quantity-' + item.definitionId">Quantity to use or sell</label><div class="amount-control"><input [id]="'stack-quantity-' + item.definitionId" type="number" min="1" [max]="item.quantity" step="1" [ngModel]="quantities[item.definitionId] ?? 1" (ngModelChange)="quantities[item.definitionId] = $event"><button class="text-button" (click)="quantities[item.definitionId] = maxUse(item)" [disabled]="maxUse(item) < 1">Use max</button></div>
          <div class="restore-preview">@if (canUse(item)) { Restores <strong>{{ actualRestore(item) }} energy</strong> using {{ quantities[item.definitionId] ?? 1 }} item(s). @if (actualRestore(item) < item.energyRestore * (quantities[item.definitionId] ?? 1)) { <span>The final item restores only what fits your energy or daily allowance.</span> } } @else if ((session.user()?.stats?.energyBoostRemaining ?? 0) < 1) { Your daily allowance is used. Energy still recovers naturally. } @else if (maxUse(item) > 0) { Choose {{ maxUse(item) }} or fewer to stay within your energy and daily allowance. } </div>
          <div class="consumable-actions"><button class="button button-primary" [disabled]="!!busy() || !canUse(item)" (click)="consume(item)">Use {{ quantities[item.definitionId] ?? 1 }} <span>ϟ</span></button><button class="button button-outline" [disabled]="!!busy() || !validQuantity(item)" (click)="sellStack(item)">Sell · &#36;{{ sellPrice(item.definitionId) * (quantities[item.definitionId] ?? 1) | number:'1.0-0' }}</button></div>
          @if (session.user()?.stats?.energy === session.user()?.stats?.maxEnergy) { <small class="field-help">Your energy is full. Save these for later.</small> }
        </article>
      } @empty {
        @if (!loading()) { <div class="panel empty-state"><h3>No consumables yet.</h3><p>Keep some soda handy for your next training session.</p><a routerLink="/shop" class="text-link">Stock up ↗</a></div> }
      }
    </div>
  `,
})
export class InventoryComponent {
  readonly session = inject(SessionService);
  private readonly api = inject(ApiService);
  private readonly notices = inject(NoticeService);
  readonly inventory = signal<Inventory>({ instances: [], stacks: [] });
  readonly definitions = signal<Definition[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly busy = signal<string | null>(null);
  readonly editingId = signal<number | null>(null);
  readonly quantities: Record<number, number> = {};
  renameText = '';
  private loadGeneration = 0;
  readonly stackCount = computed(() => this.inventory().stacks.reduce((sum, stack) => sum + stack.quantity, 0));
  readonly equippedCount = computed(() => this.inventory().instances.filter(item => item.equipped).length);
  constructor() { void this.load(); }
  async load(): Promise<void> {
    const generation = ++this.loadGeneration;
    const revision = this.session.revision;
    this.loading.set(true); this.error.set('');
    try {
      const [inventory, definitions] = await Promise.all([this.api.get<Inventory>('/api/inventory'), this.api.get<Definition[]>('/api/items')]);
      if (revision !== this.session.revision || generation !== this.loadGeneration) return;
      this.inventory.set(inventory); this.definitions.set(definitions);
    } catch (error) { if (revision === this.session.revision && generation === this.loadGeneration) this.error.set(errorMessage(error)); }
    finally { if (generation === this.loadGeneration) this.loading.set(false); }
  }
  sellPrice(definitionId: number): number { return Math.floor((this.definitions().find(item => item.id === definitionId)?.price ?? 0) / 2); }
  validQuantity(item: ItemStack): boolean {
    const amount = this.quantities[item.definitionId] ?? 1;
    return Number.isInteger(amount) && amount >= 1 && amount <= item.quantity && amount <= 1000;
  }
  maxUse(item: ItemStack): number {
    const stats = this.session.user()?.stats;
    return stats ? Math.min(item.quantity, 1000, Math.ceil(Math.min(stats.maxEnergy - stats.energy, stats.energyBoostRemaining) / item.energyRestore)) : 0;
  }
  actualRestore(item: ItemStack): number {
    const stats = this.session.user()?.stats;
    return stats && this.validQuantity(item) ? Math.max(0, Math.min(item.energyRestore * (this.quantities[item.definitionId] ?? 1), stats.maxEnergy - stats.energy, stats.energyBoostRemaining)) : 0;
  }
  canUse(item: ItemStack): boolean { return this.validQuantity(item) && (this.quantities[item.definitionId] ?? 1) <= this.maxUse(item); }
  beginRename(item: ItemInstance): void { this.editingId.set(item.id); this.renameText = item.name; }
  async rename(item: ItemInstance): Promise<void> {
    if (this.busy() || !this.renameText.trim()) return;
    this.busy.set('rename'); this.error.set('');
    const revision = this.session.revision;
    try {
      const updated = await this.api.mutate<ItemInstance>('PUT', '/api/inventory/instances/' + item.id, { name: this.renameText.trim() });
      if (revision !== this.session.revision) return;
      this.inventory.update(inventory => ({ ...inventory, instances: inventory.instances.map(old => old.id === updated.id ? updated : old) }));
      this.editingId.set(null); await this.session.refresh();
      if (revision === this.session.revision) this.notices.show('Item renamed.');
    } catch (error) { if (revision === this.session.revision) this.error.set(errorMessage(error)); }
    finally { this.busy.set(null); }
  }
  equip(item: ItemInstance): Promise<void> {
    return this.mutate('/api/inventory/instances/' + item.id + '/equip', {}, item.equipped ? 'Item unequipped.' : item.name + ' equipped.');
  }
  sellWeapon(item: ItemInstance): Promise<void> {
    return this.mutate('/api/inventory/sell', { instanceId: item.id }, item.name + ' sold.');
  }
  consume(item: ItemStack): Promise<void> {
    return this.mutate('/api/inventory/consume', { definitionId: item.definitionId, quantity: this.quantities[item.definitionId] ?? 1 }, 'Energy restored.');
  }
  sellStack(item: ItemStack): Promise<void> {
    return this.mutate('/api/inventory/sell', { definitionId: item.definitionId, quantity: this.quantities[item.definitionId] ?? 1 }, 'Items sold.');
  }
  private async mutate(path: string, body: unknown, success: string): Promise<void> {
    if (this.busy()) return;
    this.busy.set(path); this.error.set('');
    const revision = this.session.revision;
    try {
      const inventory = await this.api.mutate<Inventory>('POST', path, body);
      if (revision !== this.session.revision) return;
      this.inventory.set(inventory);
      await this.session.refresh();
      if (revision === this.session.revision) this.notices.show(success);
    } catch (error) {
      if (revision !== this.session.revision) return;
      this.error.set(errorMessage(error)); await this.session.refresh().catch(() => undefined);
    }
    finally { this.busy.set(null); }
  }
}
