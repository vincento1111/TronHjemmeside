# Tron City

A local playable revival of the original browser RPG, built with Angular and the companion [TronApiV2](https://github.com/vincento1111/TronApiV2) ASP.NET Core API. This version focuses on reliable identity, public profiles, global/direct chat, training, and an inventory with individual weapons and stacks of consumables.

## Play on Windows

Keep the two repositories beside each other:

```text
your-project-folder/
  TronHjemmeside/
  TronApiV2/
```

Use `codex/revive-tron-city` in both repositories until the paired changes are merged. Double-click **Start-Tron.cmd**. The launcher builds the website and API, starts the local server in the background, and opens **http://localhost:5077**. It can download a local, SHA512-verified .NET 10 SDK. Node.js 24 and pnpm 11 are required; it also recognises the Codex bundled Node/pnpm installation.

Demo accounts are created only in the opt-in local development environment:

| Player | Email | Password |
| --- | --- | --- |
| Vince | vince@tron.local | TronLocal!2026 |
| Nova | nova@tron.local | TronLocal!2026 |

Use a normal browser window and a separate private window for two accounts. Tabs in the same browser profile share a login cookie. You can also register your own account.

1. Open Players and compare another character's public profile with your own editable profile.
2. Send global and direct messages, refresh, and reconnect. Confirm each character sees the correct author.
3. Train a stat, drink soda to restore energy, and train again.
4. Open Inventory: each demo character starts with 1,000 sodas in one stack and two separately tracked swords. Rename/equip a sword, buy more items, or sell them.

Progress persists in `TronApiV2/TronApi/App_Data/tron-city.db`. Starting and stopping does not reset it. **Stop-Tron.cmd** stops only the server recorded by this launcher's process file. Logs are in this repository's ignored `.local` folder.

```powershell
# Build and start, or open the existing server
.\scripts\Start-Tron.ps1

# Restart after changing source
.\scripts\Start-Tron.ps1 -Restart

# Start an existing build quickly
.\scripts\Start-Tron.ps1 -SkipBuild

# Repositories in different locations
.\scripts\Start-Tron.ps1 -BackendPath C:\Projects\TronApiV2
```

This is a fresh local database. It does not import, modify, or connect to the previous Azure database. Importing existing accounts and inventories needs an explicit migration.

## Development and checks

Run the API on port 5077 with `ASPNETCORE_ENVIRONMENT=Development`, then:

```sh
pnpm install --frozen-lockfile
pnpm start
```

The Angular development server uses port 4200 and proxies `/api` and `/hubs` to the API. Built assets are under `dist/tron-city/browser`; the Windows launcher serves them from the API's `wwwroot` so sessions and websocket connections use the same origin.

```sh
pnpm build
pnpm test:state
pnpm test:api
pnpm test:ui
```

See the `e2e` documentation for isolated test-server configuration. API tests default to port 5077; set `TRON_API_BASE_URL` to your test server. Browser tests default to port 5078 and require the built frontend to be served there. They use installed Edge on Windows; elsewhere install Playwright Chromium with `pnpm exec playwright install chromium`. Run API tests before browser tests on a fresh test database because browser tests consume demo items. Tests must not use a real player's save. GitHub Actions builds, typechecks, and runs the isolated client-state checks; pushing source does not deploy to the old Azure application.

Read [the solution explanation](docs/SOLUTION.md) for the session, profile, inventory and chat architecture. Combat, missions, crimes, and trading between players remain future features. The current shop uses fixed NPC buy/sell prices.
