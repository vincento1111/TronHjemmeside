# Progression v2: short visits, long goals

This is the first playable balance model, built around the requested shape: quick early character levels, years of late progression, and individual stats where 100 is exceptional. RuneScape and classic WoW are references for the feeling of progression, not sources for the numerical formulas below.

Open `/assets/progression-calculator.html` on the running game for an interactive comparison. It changes forecasts, not your character or game rules.

## Energy sets the pace

- Maximum energy: **72**.
- Passive recovery: **1 every 10 minutes**, calculated from saved timestamps even while offline.
- Empty to full: **12 hours**. Recovery stops at the cap.
- One full bar spent each day: **72 training energy/day**. Two appropriately spaced visits can use **144/day**.
- Energy consumables share a **24 additional energy/day** allowance, resetting at **00:00 UTC**. Only the energy actually restored uses the allowance. An item used close to either cap can restore less than its nominal value; the interface previews this.
- One training energy gives **10 character XP**, independent of item bonuses, mastery, or luck. Failed training and training a capped stat give no XP or mastery.

The daily consumable allowance matters: the existing demo inventories contain 1,000 sodas. Without a limit, those cans would replace weeks of passive recovery in one session. They remain in inventory and can still be used over time.

## Fractional stats and practice

All four stats start at **1** and cap at **100**. Each energy unit is processed separately:

```text
gain = 0.0125 / stat^0.75
     × (1 + 0.25 × T / (T + 10,000))
     × (1 + equipmentBonusPercent / 100)
     × randomRoll
```

`T` is total energy already spent training any stat. `randomRoll` ranges from **0.97 to 1.03**, with mean 1. The new stat and T are used for the next energy unit, including inside a batch. Dividing 72 energy into 72 requests grants no extra mastery or XP.

Higher stats reduce gains. Practice offsets some of that difficulty: the mastery bonus approaches +25%, reaching +12.5% after 10,000 energy. The benefit never compounds exponentially. Equipment multiplies stat gains, not XP. A +1% item means multiplying the gain by 1.01, not adding a whole percentage point to the stat.

With mean luck and no equipment, focusing all training on one stat gives these approximate milestones:

| Stat reached | Total energy | Daily budgets at 72 energy/day |
| --- | ---: | ---: |
| 5 | 712 | 9.9 days |
| 10 | 2,460 | 34.2 days |
| 25 | 11,738 | 163 days |
| 50 | 37,460 | 520 days / 1.42 years |
| 75 | 74,126 | 1,030 days / 2.82 years |
| 99 | 118,705 | 1,649 days / 4.51 years |
| 100 | 120,753 | 1,677 days / 4.59 years |

Training all four evenly makes all four reaching 100 an approximately **17.9-year** goal at 72 energy/day, or **8.9 years** at 144/day, without consumables or equipment. That is deliberately extreme and is a central balance choice to revisit after playtesting. Stat 100 is not required to unlock normal play; combat and activity requirements have not been designed yet. The calculator exposes this tradeoff rather than hiding it.

The forecasts simulate mean rolls; actual random rolls change the result slightly. Allocation forecasts approximate evenly spaced training, so different training orders can alter mastery benefits a little.

## Character XP, levels, and health

XP required to advance from character level `L` to `L+1`:

```text
ceil(500 + 20 × (L−1) + 0.0008 × (L−1)^4)
```

The linear term keeps early growth gentle. The fourth-power term makes the final levels much longer. Levels cap at 100; XP is capped at that level's threshold. Stats can continue improving independently until their own caps.

| Character level | Total XP required | At 72 energy/day | At 144 energy/day |
| --- | ---: | ---: | ---: |
| 5 | 2,123 | 2.95 days | 1.47 days |
| 10 | 5,233 | 7.27 days | 3.63 days |
| 20 | 13,275 | 18.44 days | 9.22 days |
| 50 | 90,963 | 126.34 days | 63.17 days |
| 75 | 434,207 | 603.07 days | 301.53 days |
| 90 | 991,400 | 3.77 years | 1.88 years |
| 100 | 1,629,982 | 6.20 years | 3.10 years |

**Level 90 to 100 alone:** 638,582 XP, about **887 daily budgets / 2.43 years** at 72 energy/day. Spending the full 24 daily consumable allowance raises that budget to 96/day and reduces that interval to about 1.82 years. Item training bonuses do not shorten the character XP curve.

These are energy-budget estimates. A new player already has a full bar, so level 5 can be reached on the third once-daily visit, around two calendar days after the first. Missed visits and unused energy extend the time. Future activity XP will need explicit limits and a new calibration; adding unrestricted activity XP would invalidate these estimates.

Maximum health is `100 + 5 × (level−1)`: 100 at level 1 and 595 at level 100. Levelling increases current health by the increase in maximum health, preserving the amount of damage rather than providing an unrelated full heal. Combat and other damage activities are still future work.

## Items and precision

There are two independent equipment slots: **weapon** and **training gear**. Equipping another item in a slot replaces that slot only. Training gear receives a permanent rolled bonus when bought:

| Item | Price | Training bonus range |
| --- | ---: | ---: |
| Focus Band | $250 | +0.9000% to +1.1000% |
| Weighted Vest | $750 | +1.8000% to +2.2000% |
| Precision Rig | $1,800 | +3.0000% to +4.0000% |

Coffee restores 3 energy, Soda 6, and Trail Mix 12, subject to the shared allowance. Consumables stack; each piece of equipment keeps its own ID, name, roll, and ownership.

Stats are stored as **integer billionths**, with nine decimal places. For example, `1.234567891` is stored as `1234567891`. The server rounds applied gains to that precision. Stored item bonus rolls are **integer parts per million**: `3.4572%` is exactly `34572 ppm`, giving a multiplier of `1.034572`. The interface rounds for readability; it does not determine authoritative stored values. Small browser floating-point display differences do not change the save.

## Existing local saves

This update upgrades the earlier local SQLite schema after creating a consistent backup. Accounts, login sessions, messages, cash, remaining energy, named item instances, ownership, and stacks are retained.

The old prototype granted +1 whole stat per energy and started at 10. Its training work is inferred as `max(0, oldStat−10)` per stat. The upgrade converts that work into the new stat scale, adds its character XP and mastery, and derives the new level. Old untrained 10s therefore become 1s. This is a balance conversion, not a reset of accounts or inventories. The old scheme cannot reveal the exact historical training order; the conversion uses a deterministic mean-gain approximation and is applied only once.

The former Azure SQL database is still separate and is not imported by this upgrade.
