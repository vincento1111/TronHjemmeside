# Local API integration checks

These tests exercise the running API through HTTP and real SignalR WebSocket connections. They create isolated accounts, perform concurrent purchases/training, and verify cookie sessions, CSRF, ownership, bulk stacks, individual weapons, saved chat, retry identifiers, catch-up cursors, and private message delivery. Client-state regression tests also exercise the real Angular services/components with deliberately delayed responses to verify account switching and CSRF refresh races. No browser download is needed.

Progression checks cover stats starting at one, positive fractional training within the ±3% roll bounds, saved XP and level-ups, rolled training-gear bonuses, separate weapon/training equipment slots, and the shared 24-energy consumable allowance under concurrent requests and partial restoration.

Use a **fresh local test database** with the API in Development and `Tron__SeedDemo=true`. Set `Tron__AuthPermitLimit=1000` on that test server so creating the isolated test accounts does not exhaust the normal 30-per-minute authentication limit; this override is honored only in Development. The demo fixture test reads both demo inventories and expects their initial single stack of 1000 sodas and two independent swords. The remaining tests create new accounts; those test accounts and their messages remain in that test database.

With the backend listening locally, run from the frontend directory:

```powershell
$env:TRON_API_BASE_URL = 'http://127.0.0.1:5078'
pnpm test:api
```

The default is `http://127.0.0.1:5077`; an explicit local URL can select an isolated test server. The config refuses remote hosts so it cannot accidentally run against the former API or a public deployment. The WebSocket test uses the allowed frontend origin `http://localhost:4200`; override `TRON_CHAT_ORIGIN` only when the local API is configured with a different allowed origin.

Tests never connect to the original Azure database. They deliberately assert externally observable behavior, including rejected operations leaving balances and ownership unchanged. They do not establish load capacity, long-term balancing, or production hosting readiness.
