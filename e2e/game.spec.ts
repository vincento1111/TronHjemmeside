import { test, expect, json, type Inventory, type TrainingResult } from './api-helpers';

test('fresh development demos store 1000 sodas as one stack and swords as separate instances', async ({ api }) => {
  for (const email of ['vince@tron.local', 'nova@tron.local']) {
    const player = await api.demo(email);
    const definitions = await player.definitions();
    const soda = definitions.find((item) => item.name === 'Soda')!;
    expect(soda.tracking).toBe('stack');
    const inventory = await player.inventory();
    const stacks = inventory.stacks.filter((stack) => stack.definitionId === soda.id);
    expect(stacks).toHaveLength(1);
    expect(stacks[0].quantity).toBe(1000);
    expect(inventory.instances).toHaveLength(2);
    expect(new Set(inventory.instances.map((item) => item.id)).size).toBe(2);
    expect(inventory.instances[0].definitionId).toBe(inventory.instances[1].definitionId);
    for (const sword of inventory.instances) {
      expect(Number.isFinite(sword.power)).toBeTruthy();
      expect(sword.power).toBeGreaterThan(0);
    }
  }
});

test('concurrent purchases charge only successful transactions and cannot overspend', async ({ api }) => {
  const player = await api.user('Buyer');
  const before = await player.me();
  const inventoryBefore = await player.inventory();
  const sword = (await player.definitions()).filter((item) => item.kind === 'weapon' && item.price <= before.stats.money)
    .sort((a, b) => b.price - a.price)[0];
  expect(sword).toBeTruthy();
  const affordable = Math.floor(before.stats.money / sword.price);
  const requests = Array.from({ length: affordable + 4 }, () => player.mutate('POST', '/api/inventory/buy', { definitionId: sword.id, quantity: 1 }));
  const responses = await Promise.all(requests);
  const successes = responses.filter((response) => response.ok());
  expect(successes).toHaveLength(affordable);
  for (const response of responses.filter((result) => !result.ok())) expect([400, 409, 422]).toContain(response.status());
  const after = await player.me();
  expect(after.stats.money).toBe(before.stats.money - successes.length * sword.price);
  expect(after.stats.money).toBeGreaterThanOrEqual(0);
  const inventoryAfter = await player.inventory();
  expect(inventoryAfter.instances.length - inventoryBefore.instances.length).toBe(successes.length);
  expect(new Set(inventoryAfter.instances.map((item) => item.id)).size).toBe(inventoryAfter.instances.length);
});

test('stack purchases merge; consuming and selling change quantity and currency exactly once', async ({ api }) => {
  const player = await api.user('Stack');
  const soda = (await player.definitions()).find((item) => item.name === 'Soda')!;
  const before = await player.me();
  await json(await player.mutate('POST', '/api/inventory/buy', { definitionId: soda.id, quantity: 3 }));
  await json(await player.mutate('POST', '/api/inventory/buy', { definitionId: soda.id, quantity: 4 }));
  let inventory = await player.inventory();
  expect(inventory.stacks.filter((stack) => stack.definitionId === soda.id)).toHaveLength(1);
  expect(inventory.stacks.find((stack) => stack.definitionId === soda.id)!.quantity).toBe(7);
  expect((await player.me()).stats.money).toBe(before.stats.money - 7 * soda.price);

  const trained = (await json<TrainingResult>(await player.mutate('POST', '/api/game/train', { stat: 'defense', amount: 12 }))).stats;
  await json(await player.mutate('POST', '/api/inventory/consume', { definitionId: soda.id, quantity: 1 }));
  expect((await player.me()).stats.energy).toBe(Math.min(trained.maxEnergy, trained.energy + soda.energyRestore));
  expect((await player.inventory()).stacks.find((stack) => stack.definitionId === soda.id)!.quantity).toBe(6);
  await json(await player.mutate('POST', '/api/inventory/sell', { definitionId: soda.id, quantity: 6 }));
  inventory = await player.inventory();
  expect(inventory.stacks.filter((stack) => stack.definitionId === soda.id)).toHaveLength(0);
  expect((await player.me()).stats.money).toBe(before.stats.money - 7 * soda.price + 6 * Math.floor(soda.price / 2));
});

test('each sword can be renamed and equipped independently, only by its owner', async ({ api }) => {
  const owner = await api.user('Sword');
  const other = await api.user('Thief');
  const definition = (await owner.definitions()).find((item) => item.name === 'Iron Sword')!;
  const inventory = await json<Inventory>(await owner.mutate('POST', '/api/inventory/buy', { definitionId: definition.id, quantity: 2 }));
  const [first, second] = inventory.instances;
  expect(first.id).not.toBe(second.id);
  const renamed = await json<{ id: number; name: string }>(await owner.mutate('PUT', `/api/inventory/instances/${first.id}`, { name: 'The First Blade' }));
  expect(renamed.id).toBe(first.id);
  expect(renamed.name).toBe('The First Blade');
  expect((await owner.inventory()).instances.find((item) => item.id === second.id)!.name).toBe(second.name);

  await json(await owner.mutate('POST', `/api/inventory/instances/${first.id}/equip`));
  await json(await owner.mutate('POST', `/api/inventory/instances/${second.id}/equip`));
  let equipped = (await owner.inventory()).instances.filter((item) => item.equipped);
  expect(equipped.map((item) => item.id)).toEqual([second.id]);
  const ownerBefore = await owner.inventory();
  const thiefBefore = await other.me();
  for (const response of [
    await other.mutate('PUT', `/api/inventory/instances/${first.id}`, { name: 'Stolen Sword' }),
    await other.mutate('POST', `/api/inventory/instances/${first.id}/equip`),
    await other.mutate('POST', '/api/inventory/sell', { instanceId: first.id }),
  ]) expect([403, 404]).toContain(response.status());
  expect(await owner.inventory()).toEqual(ownerBefore);
  expect((await other.me()).stats.money).toBe(thiefBefore.stats.money);
  await json(await owner.mutate('POST', `/api/inventory/instances/${second.id}/equip`));
  equipped = (await owner.inventory()).instances.filter((item) => item.equipped);
  expect(equipped).toHaveLength(0);
});

test('invalid quantities never mint money, items, or energy', async ({ api }) => {
  const player = await api.user('Bounds');
  const soda = (await player.definitions()).find((item) => item.name === 'Soda')!;
  await json(await player.mutate('POST', '/api/inventory/buy', { definitionId: soda.id, quantity: 2 }));
  const before = await player.me();
  const inventory = await player.inventory();
  for (const quantity of [-1, 0, 1.5, 1001, 2_147_483_648]) {
    for (const action of ['buy', 'consume', 'sell']) {
      const response = await player.mutate('POST', `/api/inventory/${action}`, { definitionId: soda.id, quantity });
      expect([400, 422], `${action}, quantity ${quantity}`).toContain(response.status());
    }
  }
  expect(await player.inventory()).toEqual(inventory);
  const after = await player.me();
  expect(after.stats.money).toBe(before.stats.money);
  expect(after.stats.energy).toBe(before.stats.energy);
  for (const action of ['consume', 'sell']) {
    const response = await player.mutate('POST', `/api/inventory/${action}`, { definitionId: soda.id, quantity: 3 });
    expect([400, 409, 422]).toContain(response.status());
  }
  expect(await player.inventory()).toEqual(inventory);
});

test('concurrent training cannot spend more energy than the character owns', async ({ api }) => {
  const player = await api.user('Train');
  const before = await player.me();
  const amount = Math.floor(before.stats.energy / 4) + 1;
  const responses = await Promise.all(Array.from({ length: 8 }, () => player.mutate('POST', '/api/game/train', { stat: 'strength', amount })));
  const successful = responses.filter((response) => response.ok());
  expect(successful).toHaveLength(Math.floor(before.stats.energy / amount));
  for (const response of responses.filter((result) => !result.ok())) expect([400, 409, 422]).toContain(response.status());
  const after = await player.me();
  expect(after.stats.energy).toBe(before.stats.energy - successful.length * amount);
  expect(after.stats.energy).toBeGreaterThanOrEqual(0);
  expect(after.stats.energy).toBeLessThanOrEqual(after.stats.maxEnergy);
  expect(after.stats.strength).toBeGreaterThan(before.stats.strength);
  expect(after.stats.nextEnergyAt).not.toBeNull();
  expect(Number.isFinite(Date.parse(after.stats.nextEnergyAt!))).toBeTruthy();
  for (const invalid of [
    { stat: 'strength', amount: -1 },
    { stat: 'strength', amount: 0 },
    { stat: 'strength', amount: 1.5 },
    { stat: 'strength', amount: after.stats.maxEnergy + 1 },
    { stat: 'money', amount: 1 },
  ]) {
    expect([400, 422]).toContain((await player.mutate('POST', '/api/game/train', invalid)).status());
  }
  const unchanged = await player.me();
  expect(unchanged.stats.energy).toBe(after.stats.energy);
  expect(unchanged.stats.strength).toBe(after.stats.strength);
  expect(unchanged.stats.money).toBe(after.stats.money);
});
