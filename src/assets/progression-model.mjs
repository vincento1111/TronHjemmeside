// Forecasts use the server's progression-v2 rules with the random roll at its mean.
// This module is explanatory only. The server remains authoritative for gameplay.
export function levelCost(level) {
  if (level >= 100) return 0;
  const n = level - 1;
  return Math.ceil(500 + 20 * n + 8 * n ** 4 / 10000);
}
export function levelThreshold(level) {
  let xp = 0;
  for (let current = 1; current < level; current++) xp += levelCost(current);
  return xp;
}
export function meanGain(stat, totalEnergy = 0, itemBonusPercent = 0) {
  return 0.0125 / stat ** 0.75 * (1 + 0.25 * totalEnergy / (totalEnergy + 10000)) * (1 + itemBonusPercent / 100);
}
export function projectStats(allocation = 1, itemBonusPercent = 0) {
  const milestones = [1, 2, 5, 10, 25, 50, 75, 90, 99, 100];
  const result = [{ stat: 1, totalEnergy: 0, selectedEnergy: 0, gain: meanGain(1, 0, itemBonusPercent) }];
  let stat = 1, selectedEnergy = 0, next = 1;
  while (stat < 100 && selectedEnergy < 1000000) {
    const totalEnergy = selectedEnergy / allocation;
    const gain = Math.round(meanGain(stat, totalEnergy, itemBonusPercent) * 1e9) / 1e9;
    stat = Math.min(100, Math.round((stat + gain) * 1e9) / 1e9);
    selectedEnergy++;
    if (stat >= milestones[next]) {
      result.push({ stat: milestones[next], totalEnergy: selectedEnergy / allocation,
        selectedEnergy, gain: meanGain(milestones[next], selectedEnergy / allocation, itemBonusPercent) });
      next++;
    }
  }
  return result;
}
