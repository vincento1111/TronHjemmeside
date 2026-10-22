# How the revived systems work

## One identity per authenticated session

The original app treated a browser-stored user ID as proof of identity. Components read it at different times; chat could read it before login and retain a previous account after logout.

The API now verifies the password and issues an HTTP-only session cookie. Passwords are stored using a password hasher. The frontend asks `/api/auth/me` who the session belongs to and shares that result across the application. Login/logout updates that state, clears account-specific data, and replaces the chat connection.

The API derives the acting player from the verified session on every protected request. A request body cannot claim to be another player. Public player and message responses contain only fields those screens require; emails and password hashes are not broadcast with chat or inventory. Modifying HTTP requests require an antiforgery token. The intentionally public demo credentials must not be enabled on a public deployment.

## Viewing someone and being someone are separate

`/players/12` means "show player 12". The signed-in player might be 7, 12, or someone else. Your own profile offers editing; another player's profile offers direct messaging. The API's self-update endpoint determines ownership from the session, regardless of visible controls. A modified browser cannot grant edit permission.

## Three inventory concepts

| Concept | Stored information | Example |
| --- | --- | --- |
| Item definition | Shared type, name, price, base properties and tracking mode | Iron Sword; Soda |
| Item instance | Unique ID, definition, owner, custom name, rolled power and equipped state | Sword 9812, "Stormfang", power 23 |
| Inventory stack | Owner, definition and quantity | Player 7, Soda, quantity 1,000 |

Two swords can share a definition with different instance IDs and rolled values. Those values are saved once and stay stable on refresh. A thousand identical sodas occupy one stack row; buying increases the quantity, consuming or selling reduces it. Only interchangeable copies belong in the same stack.

Buying selects a definition. Equipping, renaming or selling a weapon selects an instance. Consuming selects a stack and amount. The API checks ownership, enforces positive bounded quantities, and changes balances and quantities in one database transaction. A unique database constraint prevents duplicate stacks for the same player and type. Player-to-player trading is future work.

## Chat survives more than the happy path

Chat history is durable database data. SignalR delivers new-message notifications. The server determines the author, assigns an ID and UTC timestamp, saves the message, then publishes the same public representation used by history loading.

Each browser merges messages by server ID. History and live updates can overlap without duplicate displays or erasing new messages. Reconnect and periodic catch-up fetch persisted messages after the last confirmed position. This also recovers a message saved just before an interruption prevented its broadcast.

A send carries a unique client request ID. Retrying returns the existing message instead of inserting another. The editor clears only after a confirmed save; failed sends remain available to retry. Switching accounts or conversations invalidates old asynchronous work so a late response cannot populate the wrong conversation.

Global messages are visible to signed-in players. Direct messages are authorised and delivered only to the two participants, including the sender's other connections. "You" is computed by comparing the message sender ID with the current session ID.

## Game state and time

Training checks energy and increases the stat in the same transaction. Buying checks money and adds items in the same transaction. SQLite write transactions serialise the read/check/write sequence so simultaneous requests cannot both spend the same old balance.

Energy regeneration uses a persisted timestamp. Returning later calculates elapsed recovery up to the cap. It does not depend on a background timer keeping the process alive, and restarting does not grant bonus energy.

Progression v2 adds fractional stats, practice efficiency, individually rolled training equipment, character XP/levels/health, and a daily energy-consumable allowance. See [the formulas, pacing tables, precision rules, and save conversion](PROGRESSION.md). The game includes an interactive progression calculator linked from Training.

## Local operation and future work

The local server uses a fresh SQLite database and serves the website from the same application. The launcher creates opt-in development demo data and keeps existing saves. Old Azure credentials and the remote database are not required.

The old SQL Server migrations describe a different schema. This revival does not silently convert old data. A future import should back up the old database, map identities and inventory explicitly, and handle old plaintext passwords through a reset or controlled transition. Credentials previously committed to Git remain in old history and should be rotated if the corresponding account still exists.

The next design work is combat, rewards, progression balance, missions, and the distinction between an NPC shop and a player marketplace. This version establishes the core systems while leaving those game rules open.
