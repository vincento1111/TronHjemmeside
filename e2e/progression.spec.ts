import { test, expect, json, type Inventory, type Me, type TrainingResult } from './api-helpers';

test('training starts at one, awards bounded fractional gains, and persists exact XP and levels', async ({ api }) => {
  const player = await api.user('Progress');
  const initial = (await player.me()).stats;
  for (const stat of ['strength', 'defense', 'speed', 'dexterity'] as const) expect(initial[stat]).toBe(1);
  expect(initial.experience).toBe(0);
  expect(initial.level).toBe(1);
  expect(initial.totalTrainingEnergy).toBe(0);
  expect(initial.xpIntoLevel).toBe(0);
  expect(initial.xpToNextLevel).toBe(500);

  const first = await json<TrainingResult>(await player.mutate('POST', '/api/game/train', { stat: 'strength', amount: 1 }));
  expect(first.stat).toBe('strength');
  expect(first.energySpent).toBe(1);
  expect(first.statGain).toBeGreaterThan(0);
  expect(Number.isInteger(first.statGain)).toBeFalsy();
  expect(first.statGain).toBeGreaterThanOrEqual(0.0125 * 0.97 - 0.000000001);
  expect(first.statGain).toBeLessThanOrEqual(0.0125 * 1.03 + 0.000000001);
  expect(first.stats.strength).toBeCloseTo(1 + first.statGain, 9);
  expect(first.stats.defense).toBe(1);
  expect(first.stats.energy).toBe(71);
  expect(first.xpGained).toBe(10);
  expect(first.levelsGained).toBe(0);
  expect(first.stats.experience).toBe(10);
  expect(first.stats.totalTrainingEnergy).toBe(1);
  expect(first.stats.trainingMasteryPercent).toBeGreaterThan(0);

  const next = await json<TrainingResult>(await player.mutate('POST', '/api/game/train', { stat: 'strength', amount: 49 }));
  expect(next.energySpent).toBe(49);
  expect(next.xpGained).toBe(490);
  expect(next.levelsGained).toBe(1);
  expect(next.stats.experience).toBe(500);
  expect(next.stats.level).toBe(2);
  expect(next.stats.xpIntoLevel).toBe(0);
  expect(next.stats.xpToNextLevel).toBe(521);
  expect(next.stats.totalTrainingEnergy).toBe(50);
  expect(next.stats.trainingMasteryPercent).toBeGreaterThan(first.stats.trainingMasteryPercent);
  expect(next.stats.strength).toBeCloseTo(first.stats.strength + next.statGain, 9);
  expect(next.stats.energy).toBe(22);

  await player.mutate('POST', '/api/auth/logout');
  await player.refreshCsrf();
  const resumed = await json<Me>(await player.mutate('POST', '/api/auth/login', { email: player.account.email, password: player.password }));
  expect(resumed.stats.strength).toBe(next.stats.strength);
  expect(resumed.stats.experience).toBe(500);
  expect(resumed.stats.level).toBe(2);
  expect(resumed.stats.totalTrainingEnergy).toBe(50);
});

test('training gear has a precise rolled bonus and an equipment slot separate from weapons', async ({ api }) => {
  const player = await api.user('Gear');
  const definitions = await player.definitions();
  const band = definitions.find((item) => item.name === 'Focus Band')!;
  const sword = definitions.find((item) => item.name === 'Iron Sword')!;
  expect(band.kind).toBe('training');
  expect(band.equipmentSlot).toBe('training');
  expect(band.trainingBonusPercent).toBe(1);
  expect(band.trainingBonusMinPercent).toBe(0.9);
  expect(band.trainingBonusMaxPercent).toBe(1.1);
  await json(await player.mutate('POST', '/api/inventory/buy', { definitionId: band.id, quantity: 2 }));
  const purchased = await json<Inventory>(await player.mutate('POST', '/api/inventory/buy', { definitionId: sword.id, quantity: 2 }));
  const bands = purchased.instances.filter((item) => item.definitionId === band.id);
  const swords = purchased.instances.filter((item) => item.definitionId === sword.id);
  expect(new Set(purchased.instances.map((item) => item.id)).size).toBe(4);
  for (const gear of bands) {
    expect(gear.equipmentSlot).toBe('training');
    expect(gear.trainingBonusPercent).toBeGreaterThanOrEqual(band.trainingBonusMinPercent);
    expect(gear.trainingBonusPercent).toBeLessThanOrEqual(band.trainingBonusMaxPercent);
    const units = gear.trainingBonusPercent * 10_000;
    expect(units).toBeCloseTo(Math.round(units), 6);
  }
  await json(await player.mutate('POST', `/api/inventory/instances/${bands[0].id}/equip`));
  await json(await player.mutate('POST', `/api/inventory/instances/${swords[0].id}/equip`));
  let equipped = (await player.inventory()).instances.filter((item) => item.equipped);
  expect(equipped.map((item) => item.equipmentSlot).sort()).toEqual(['training', 'weapon']);
  await json(await player.mutate('POST', `/api/inventory/instances/${swords[1].id}/equip`));
  await json(await player.mutate('POST', `/api/inventory/instances/${bands[1].id}/equip`));
  equipped = (await player.inventory()).instances.filter((item) => item.equipped);
  expect(equipped.map((item) => item.id).sort((a, b) => a - b)).toEqual([bands[1].id, swords[1].id].sort((a, b) => a - b));
  expect((await player.me()).stats.trainingBonusPercent).toBe(bands[1].trainingBonusPercent);

  const result = await json<TrainingResult>(await player.mutate('POST', '/api/game/train', { stat: 'speed', amount: 1 }));
  const expectedMean = 0.0125 * (1 + bands[1].trainingBonusPercent / 100);
  expect(result.statGain).toBeGreaterThanOrEqual(expectedMean * 0.97 - 0.000000001);
  expect(result.statGain).toBeLessThanOrEqual(expectedMean * 1.03 + 0.000000001);
  expect(result.stats.trainingBonusPercent).toBe(bands[1].trainingBonusPercent);
  expect(result.xpGained).toBe(10); // Gear improves the chosen stat, not character XP.
});

test('concurrent consumable requests cannot exceed the shared daily 24-energy allowance', async ({ api }) => {
  const player = await api.user('DailyCap');
  const definitions = await player.definitions();
  const soda = definitions.find((item) => item.name === 'Soda')!;
  const coffee = definitions.find((item) => item.name === 'Coffee')!;
  await json(await player.mutate('POST', '/api/inventory/buy', { definitionId: soda.id, quantity: 10 }));
  await json(await player.mutate('POST', '/api/game/train', { stat: 'dexterity', amount: 72 }));
  const attempts = await Promise.all(Array.from({ length: 8 }, () => player.mutate('POST', '/api/inventory/consume', { definitionId: soda.id, quantity: 1 })));
  expect(attempts.filter((response) => response.ok())).toHaveLength(4);
  for (const failure of attempts.filter((response) => !response.ok())) expect([400, 409, 422]).toContain(failure.status());
  const stats = (await player.me()).stats;
  expect(stats.energy).toBe(24);
  expect(stats.energyBoostRemaining).toBe(0);
  expect((await player.inventory()).stacks.find((item) => item.definitionId === soda.id)!.quantity).toBe(6);
  const reset = new Date(stats.energyBoostResetAt);
  expect(Number.isFinite(reset.getTime())).toBeTruthy();
  expect([reset.getUTCHours(), reset.getUTCMinutes(), reset.getUTCSeconds()]).toEqual([0, 0, 0]);
  await json(await player.mutate('POST', '/api/game/train', { stat: 'dexterity', amount: 1 }));
  await json(await player.mutate('POST', '/api/inventory/buy', { definitionId: coffee.id, quantity: 1 }));
  const again = await player.mutate('POST', '/api/inventory/consume', { definitionId: coffee.id, quantity: 1 });
  expect([400, 409, 422]).toContain(again.status());
  expect((await player.me()).stats.energy).toBe(23);
  expect((await player.inventory()).stacks.find((item) => item.definitionId === coffee.id)!.quantity).toBe(1);
});

test('the consumable allowance counts actual restored energy, including a partial final item', async ({ api }) => {
  const player = await api.user('Partial');
  const soda = (await player.definitions()).find((item) => item.name === 'Soda')!;
  await json(await player.mutate('POST', '/api/inventory/buy', { definitionId: soda.id, quantity: 5 }));
  await json(await player.mutate('POST', '/api/game/train', { stat: 'defense', amount: 1 }));
  await json(await player.mutate('POST', '/api/inventory/consume', { definitionId: soda.id, quantity: 1 }));
  expect((await player.me()).stats.energy).toBe(72);
  expect((await player.me()).stats.energyBoostRemaining).toBe(23);
  await json(await player.mutate('POST', '/api/game/train', { stat: 'defense', amount: 24 }));
  await json(await player.mutate('POST', '/api/inventory/consume', { definitionId: soda.id, quantity: 4 }));
  expect((await player.me()).stats.energy).toBe(71);
  expect((await player.me()).stats.energyBoostRemaining).toBe(0);
  expect((await player.inventory()).stacks.some((item) => item.definitionId === soda.id)).toBeFalsy();
});
