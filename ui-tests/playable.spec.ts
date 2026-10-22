import { test, expect, BrowserContext, Page } from '@playwright/test';

const password = 'UiPlaytest!2026';
const uniqueName = () => 'Ui' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

async function createPlayer(context: BrowserContext, baseURL: string) {
  const name = uniqueName();
  const csrf = await (await context.request.get(baseURL + '/api/csrf')).json();
  const response = await context.request.post(baseURL + '/api/auth/register', {
    headers: { 'X-CSRF-TOKEN': csrf.token },
    data: { email: name + '@example.test', displayName: name, password },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return await response.json() as { id: number; displayName: string };
}

async function enter(page: Page, baseURL: string, name: string) {
  await page.goto(baseURL);
  await expect(page.locator('.sidebar-player strong')).toHaveText(name);
  await expect(page.locator('.chat-title .live-dot')).not.toHaveClass(/offline/);
}

test('registration, owner-only profile controls, refresh, and logout work through the interface', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const name = uniqueName();
  await page.goto('/');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await page.getByLabel('Display name', { exact: true }).fill(name);
  await page.getByLabel('Email', { exact: true }).fill(name + '@example.test');
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: /Create my character/ }).click();
  await expect(page.locator('.sidebar-player strong')).toHaveText(name);
  await page.locator('.sidebar-player').click();
  await page.getByRole('button', { name: /Edit profile/ }).click();
  await page.getByLabel('Your story').fill('I am testing my own profile in Tron City.');
  await page.getByRole('button', { name: /Save profile/ }).click();
  await expect(page.locator('.profile-about')).toContainText('I am testing my own profile');
  await page.reload();
  await expect(page.locator('.profile-about')).toContainText('I am testing my own profile');
  await page.goto('/players/1');
  await expect(page.getByRole('button', { name: /Edit profile/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Send a message/ })).toBeVisible();
  await page.screenshot({ path: info.outputPath('profile-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: /Sign out/ }).click();
  await expect(page.getByRole('heading', { name: 'Welcome to the city.' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Welcome to the city.' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('two browsers agree on authors and messages, recover history, and retry a failed draft', async ({ browser, baseURL }, info) => {
  const a = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const b = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  try {
    const alice = await createPlayer(a, baseURL!);
    const bob = await createPlayer(b, baseURL!);
    const ap = await a.newPage(); const bp = await b.newPage();
    await enter(ap, baseURL!, alice.displayName); await enter(bp, baseURL!, bob.displayName);
    const text = 'Global ' + uniqueName();
    await ap.getByLabel('Message', { exact: true }).fill(text);
    await ap.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(ap.locator('article.message.mine').filter({ hasText: text })).toHaveCount(1);
    await expect(bp.locator('article.message').filter({ hasText: text })).toHaveCount(1);
    await expect(bp.locator('article.message').filter({ hasText: text }).locator('.message-meta a')).toHaveText(alice.displayName);
    await bp.reload();
    await expect(bp.locator('article.message').filter({ hasText: text })).toHaveCount(1);

    await ap.goto(baseURL! + '/players/' + bob.id);
    await ap.getByRole('button', { name: /Send a message/ }).click();
    await bp.goto(baseURL! + '/players/' + alice.id);
    await bp.getByRole('button', { name: /Send a message/ }).click();
    const privateText = 'Private ' + uniqueName();
    await ap.getByLabel('Message', { exact: true }).fill(privateText);
    await ap.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(bp.locator('article.message').filter({ hasText: privateText })).toHaveCount(1);
    await expect(bp.locator('article.message').filter({ hasText: text })).toHaveCount(0);

    await ap.route('**/api/chat/messages', route => route.request().method() === 'POST' ? route.abort('failed') : route.continue());
    const retryText = 'Retry ' + uniqueName();
    await ap.getByLabel('Message', { exact: true }).fill(retryText);
    await ap.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(ap.getByLabel('Message', { exact: true })).toHaveValue(retryText);
    await expect(ap.getByRole('button', { name: /Retry message/ })).toBeVisible();
    await ap.unroute('**/api/chat/messages');
    await ap.getByRole('button', { name: /Retry message/ }).click();
    await expect(ap.getByLabel('Message', { exact: true })).toHaveValue('');
    await expect(bp.locator('article.message').filter({ hasText: retryText })).toHaveCount(1);
    await ap.locator('.main-nav').getByRole('button', { name: /Public chat/ }).click();
    await bp.locator('.main-nav').getByRole('button', { name: /Public chat/ }).click();
    await expect(ap.locator('.chat-title')).toContainText('Public chat');
    await expect(ap.locator('article.message').filter({ hasText: privateText })).toHaveCount(0);
    const publicText = 'Back in public ' + uniqueName();
    await ap.getByLabel('Message', { exact: true }).fill(publicText);
    await ap.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(bp.locator('article.message').filter({ hasText: publicText })).toHaveCount(1);
    await ap.screenshot({ path: info.outputPath('chat-desktop.png'), fullPage: true });
  } finally { await a.close(); await b.close(); }
});

test('demo equipment, energy actions, and the mobile layout are playable', async ({ page }, info) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Play as Vince/ }).click();
  await expect(page.locator('.sidebar-player strong')).toHaveText('Vince');
  await page.goto('/inventory');
  const before = await (await page.request.get('/api/inventory')).json();
  const sodaQuantity = before.stacks[0].quantity as number;
  expect(sodaQuantity).toBeGreaterThan(0);
  await expect(page.locator('.consumable-card')).toContainText(sodaQuantity.toLocaleString('en-US'));
  await expect(page.locator('.weapon-row')).toHaveCount(2);
  await page.screenshot({ path: info.outputPath('inventory-desktop.png'), fullPage: true });
  await page.goto('/training');
  await page.getByRole('button', { name: /Train Strength/ }).click();
  await expect(page.locator('.training-result')).toContainText('1 energy spent · +10 XP');
  await page.goto('/inventory');
  await page.locator('.consumable-card').getByRole('button', { name: /^Use 1/ }).click();
  await expect(page.locator('.consumable-card')).toContainText((sodaQuantity - 1).toLocaleString('en-US'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: info.outputPath('inventory-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Open public chat', exact: true }).click();
  await expect(page.getByLabel('Message', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close chat' }).click();
  await expect(page.getByLabel('Message', { exact: true })).not.toBeVisible();
});

test('a new player can buy, personalize, equip, and sell inventory with changes surviving refresh', async ({ page, baseURL }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const player = await createPlayer(page.context(), baseURL!);
  await enter(page, baseURL!, player.displayName);
  await page.locator('.main-nav').getByRole('link', { name: /Market/ }).click();

  const swordCard = page.locator('.shop-card').filter({ has: page.getByRole('heading', { name: 'Iron Sword', exact: true }) });
  await swordCard.getByLabel('Iron Sword quantity').fill('2');
  await swordCard.getByRole('button', { name: /Buy for \$300/ }).click();
  await expect(page.locator('.market-banner h2')).toHaveText('$700');

  const sodaCard = page.locator('.shop-card').filter({ has: page.getByRole('heading', { name: 'Soda', exact: true }) });
  await sodaCard.getByLabel('Soda quantity').fill('5');
  await sodaCard.getByRole('button', { name: /Buy for \$50/ }).click();
  await expect(page.locator('.market-banner h2')).toHaveText('$650');
  await sodaCard.getByLabel('Soda quantity').fill('2');
  await sodaCard.getByRole('button', { name: /Buy for \$20/ }).click();
  await expect(page.locator('.market-banner h2')).toHaveText('$630');
  const trainingCard = page.locator('.shop-card').filter({ has: page.getByRole('heading', { name: 'Focus Band', exact: true }) });
  await trainingCard.getByRole('button', { name: /Buy for \$250/ }).click();
  await expect(page.locator('.market-banner h2')).toHaveText('$380');

  await page.getByRole('link', { name: /Your inventory/ }).click();
  const weapons = page.locator('.weapon-row');
  const sodas = page.locator('.consumable-card');
  await expect(weapons).toHaveCount(3);
  await expect(sodas).toHaveCount(1);
  await expect(sodas.locator('.pill')).toHaveText('× 7');
  await weapons.first().getByRole('button', { name: 'Rename Iron Sword', exact: true }).click();
  await page.getByLabel('Item name', { exact: true }).fill('Roadlight');
  await weapons.first().getByRole('button', { name: 'Save', exact: true }).click();

  const namedSword = weapons.filter({ has: page.getByRole('button', { name: 'Rename Roadlight', exact: true }) });
  const spareSword = weapons.filter({ has: page.getByRole('button', { name: 'Rename Iron Sword', exact: true }) });
  await expect(namedSword).toHaveCount(1);
  await expect(spareSword).toHaveCount(1);
  await namedSword.getByRole('button', { name: 'Equip item', exact: true }).click();
  await expect(page.locator('.weapon-equipped')).toHaveCount(1);
  await spareSword.getByRole('button', { name: 'Equip item', exact: true }).click();
  await expect(page.locator('.weapon-equipped')).toHaveCount(1);
  await expect(namedSword).not.toHaveClass(/weapon-equipped/);
  await namedSword.getByRole('button', { name: 'Equip item', exact: true }).click();
  await expect(namedSword).toHaveClass(/weapon-equipped/);
  await expect(page.locator('.weapon-equipped')).toHaveCount(1);
  const trainingGear = weapons.filter({ has: page.getByRole('button', { name: 'Rename Focus Band', exact: true }) });
  await trainingGear.getByRole('button', { name: 'Equip item', exact: true }).click();
  await expect(trainingGear).toHaveClass(/weapon-equipped/);
  await expect(namedSword).toHaveClass(/weapon-equipped/);
  await expect(page.locator('.weapon-equipped')).toHaveCount(2);
  await expect(trainingGear.locator('.power-label')).toHaveText(/\+\d\.\d{4}% training gain.*active/);

  await spareSword.getByRole('button', { name: 'Sell for $75', exact: true }).click();
  await expect(weapons).toHaveCount(2);
  await expect(page.getByTitle('Money', { exact: true })).toHaveText(/\$\s*455/);
  await sodas.getByLabel('Quantity to use or sell').fill('2');
  await sodas.getByRole('button', { name: 'Sell · $10', exact: true }).click();
  await expect(sodas.locator('.pill')).toHaveText('× 5');
  await expect(page.getByTitle('Money', { exact: true })).toHaveText(/\$\s*465/);

  await page.reload();
  await expect(weapons).toHaveCount(2);
  await expect(namedSword).toHaveClass(/weapon-equipped/);
  await expect(trainingGear).toHaveClass(/weapon-equipped/);
  await expect(page.locator('.weapon-equipped')).toHaveCount(2);
  await expect(sodas).toHaveCount(1);
  await expect(sodas.locator('.pill')).toHaveText('× 5');
  await expect(page.getByTitle('Money', { exact: true })).toHaveText(/\$\s*465/);
  await page.screenshot({ path: info.outputPath('inventory-customized.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('the progression planner responds to cadence, precise gear bonuses, and stat allocation on mobile', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/assets/progression-calculator.html');
  await expect(page.locator('#daily')).toHaveText('72');
  const startingYears = Number.parseFloat(await page.locator('#stat100').innerText());
  await page.getByLabel('Full energy bars spent each day').selectOption('2');
  await expect(page.locator('#daily')).toHaveText('144');
  expect(Number.parseFloat(await page.locator('#stat100').innerText())).toBeLessThan(startingYears);
  await page.getByLabel('Extra energy from food/drinks daily').fill('24');
  await page.getByLabel('Extra energy from food/drinks daily').press('Tab');
  await expect(page.locator('#daily')).toHaveText('168');
  const beforeGear = Number.parseFloat(await page.locator('#stat100').innerText());
  await page.getByLabel('Equipment training bonus (%)', { exact: true }).fill('3.4572');
  await page.getByLabel('Equipment training bonus (%)', { exact: true }).press('Tab');
  await expect(page.getByLabel('Equipment training bonus (%)', { exact: true })).toHaveValue('3.4572');
  expect(Number.parseFloat(await page.locator('#stat100').innerText())).toBeLessThan(beforeGear);
  await page.getByLabel('Energy assigned to this stat').selectOption('0.25');
  expect(Number.parseFloat(await page.locator('#stat100').innerText())).toBeGreaterThan(beforeGear);
  await expect(page.locator('#error')).not.toBeVisible();
  await page.getByLabel('Extra energy from food/drinks daily').fill('25');
  await page.getByLabel('Extra energy from food/drinks daily').press('Tab');
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByLabel('Extra energy from food/drinks daily').fill('24');
  await page.getByLabel('Extra energy from food/drinks daily').press('Tab');
  await expect(page.getByRole('alert')).not.toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: info.outputPath('progression-mobile.png'), fullPage: true });
  expect(errors).toEqual([]);
});
