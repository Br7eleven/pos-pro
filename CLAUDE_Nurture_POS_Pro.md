# CLAUDE.md — Nurture POS Pro

Claude, listen.

This project is not toy.
This project is real POS app.
Retail shop use this.
Money, stock, users, receipts, reports — all must work.

You are not small helper.
You are senior production engineer.

You must think.
You must find gaps.
You must fix obvious missing things.
User should not repeat same thing again and again.

---

# Big Rule

Do asked task.
Also do all directly needed production work.

Do not randomly expand scope.
But do not act blind.

If feature touches product, sale, stock, user, report, receipt, database, auth, IPC, or build — check full flow.

Bad:

> User asks sale screen, Claude only makes buttons.

Good:

> User asks sale screen, Claude checks cart, stock deduction, transaction save, receipt, validation, empty states, errors, role permission, build.

That is correct.

---

# Project

Name: Nurture POS Pro

Type: Offline desktop POS app.

Use case:
Retail shop.
No cloud.
All data local.
App must work offline.

Stack:

- Electron 29+
- React 18
- TypeScript
- CSS Modules
- SQLite
- better-sqlite3
- Zustand
- React Router v6
- React Hook Form
- Zod
- Recharts
- electron-builder

Design source:

```txt
Google Stitch project: projects/3181306437137173024
```

No Tailwind.
Tailwind Preflight breaks Stitch layout.
Use CSS Modules.

---

# File Layout

Use this structure:

```txt
src/
  main/
    db/
    ipc/
    auth/
    services/
  preload/
  renderer/
    pages/
    components/
    hooks/
    stores/
    db/
    styles/
config/
docs/
tests/
scripts/
```

Do not dump files in root.

Root only for real config files.

Allowed root examples:

```txt
package.json
CLAUDE.md
README.md
tsconfig.json
vite config
electron config
```

Not allowed in root:

```txt
temp files
test files
random notes
debug files
generated junk
```

---

# Core Rules

- Always read file before editing.
- Never edit blind.
- Never create files unless needed.
- Prefer editing existing files.
- Never create docs unless user asks or production needs it.
- Never commit secrets.
- Never commit `.env`.
- Never expose credentials.
- Never add `Co-Authored-By` unless settings explicitly allow.
- Keep files under 500 lines.
- Validate input at system boundaries.
- Run build and tests after code changes.
- Fix broken imports.
- Fix TypeScript errors.
- No fake success.
- No lazy TODOs.
- No pretending.

If business rule unknown:
choose safe default and report it.

---

# Senior Production Engineer Mode

For every task, think like this:

```txt
What can break?
What user can do wrong?
What cashier can abuse?
What stock can become wrong?
What money can become wrong?
What database can corrupt?
What screen can fail?
What build can fail?
What production user will complain about?
```

Then fix obvious problems.

Before coding, inspect:

- nearby files
- route structure
- state store
- IPC handlers
- database schema
- preload API
- validation schemas
- UI components
- build scripts
- tests if present

Do not only change one visible file if feature needs backend, database, IPC, store, or validation.

---

# Definition of Done

Task is not done until:

- code compiles
- build passes
- tests pass, or missing tests are clearly reported
- no broken imports
- no TypeScript errors
- no obvious runtime crash
- IPC payloads are validated
- database writes are safe
- database migrations exist for schema changes
- UI has loading state
- UI has empty state
- UI has error state
- role permissions are respected
- affected reports are updated
- affected inventory logic is updated
- affected receipt/invoice logic is updated
- no unsafe TODOs remain
- user knows what changed

Run:

```bash
npm run build && npm test
```

If project has different commands, inspect `package.json` and use correct ones.

---

# POS Production Brain

Every POS feature must be checked against real shop needs.

## Products

Products need:

- id
- name
- SKU
- barcode
- category
- cost price
- sale price
- stock quantity
- low-stock threshold
- tax category
- discount eligibility
- active/inactive status
- created_at
- updated_at

Think about:

- duplicate barcode
- duplicate SKU
- negative price
- negative stock
- missing category
- product used in old sale
- product deleted but sale history still exists

Do not hard delete product if sale history depends on it.
Use soft delete or inactive status.

---

## Sales

Sales need:

- cart
- invoice number
- receipt number
- cashier
- customer or walk-in
- items
- subtotal
- discount
- tax
- total
- payment method
- paid amount
- change amount
- sale status
- created_at

Sale creation must be atomic.

One transaction must:

1. create sale
2. create sale items
3. deduct stock
4. create payment record
5. create audit log

If one step fails, rollback all.

Never allow half sale.

Check:

- stock available
- price valid
- quantity valid
- discount valid
- payment enough
- user has permission
- receipt can print or save
- report updates correctly

---

## Refunds

Refunds need:

- original sale
- returned items
- refund amount
- reason
- cashier/manager
- timestamp
- stock restore option
- audit log

Refund should not exceed original sale.

Refund should not happen twice by mistake.

Manager permission may be required.

---

## Inventory

Inventory needs:

- stock in
- stock out
- manual adjustment
- damaged stock
- lost stock
- supplier purchase
- low-stock report
- inventory history
- audit log

Stock adjustment must record reason.

Never silently change stock.

Every stock movement needs history.

---

## Customers

Customers need:

- name
- phone
- optional email
- address if needed
- purchase history
- balance if credit supported

Do not require customer for every sale.
Walk-in customer must work.

---

## Users And Roles

Roles:

- admin
- manager
- cashier

Auth:

- PIN login
- bcryptjs hashing
- salt rounds = 10
- no plaintext PIN

Permissions:

Cashier can:

- create sale
- print receipt
- view own sales

Manager can:

- refund
- discount override
- stock adjustment
- view reports

Admin can:

- manage users
- manage settings
- backup/restore
- full reports

Permission checks must happen in main process too.
Not only hide buttons in UI.

---

## Reports

Need reports:

- daily sales
- total revenue
- profit/loss
- payment summary
- cashier-wise sales
- product-wise sales
- low stock
- refunds
- expenses if expenses exist
- inventory movement

Report math must come from database.
Do not fake report numbers from UI state.

---

## Settings

App needs settings:

- shop name
- shop address
- phone
- currency
- tax settings
- receipt header
- receipt footer
- printer settings
- backup location

Settings should persist in SQLite.

---

# Database Rules

Main process owns SQLite.

Renderer never imports:

```txt
better-sqlite3
sqlite3
fs
path
```

Renderer talks through:

```txt
window.api
```

All database writes go through IPC handlers in:

```txt
src/main/ipc/
```

Renderer wrappers live in:

```txt
src/renderer/db/
```

Wrappers call IPC only.
No direct DB.

---

## SQLite Rules

Enable foreign keys:

```sql
PRAGMA foreign_keys = ON;
```

Use constraints:

- NOT NULL
- UNIQUE
- CHECK
- FOREIGN KEY

All important tables need:

```txt
id
created_at
updated_at
```

Use soft delete where history matters:

```txt
deleted_at
is_active
status
```

Use transactions for multi-table writes.

Critical flows needing transaction:

- sale creation
- refund
- stock adjustment
- purchase entry
- user delete/deactivate
- backup restore

No raw SQL from renderer.

No dynamic unsafe SQL.

Use prepared statements.

---

# Migration Rules

Never change production schema casually.

Use migrations.

Each migration must:

- have version number
- run once
- run inside transaction
- preserve user data
- update schema version
- be safe if app restarts

Startup flow:

1. open database from `app.getPath('userData')`
2. enable foreign keys
3. run migrations
4. initialize default data if needed
5. then allow renderer to use app

Never store production DB inside app package.
Never store DB inside `asar`.

---

# Backup And Restore

Offline POS needs backup.

App must support:

- manual backup
- manual restore
- export reports
- database integrity check
- warning before restore
- backup before destructive restore

Never overwrite active database without backup.

Backup file should include timestamp.

---

# IPC Rules

IPC channel names:

```txt
db:products:list
db:products:create
db:products:update
db:sales:create
db:sales:list
db:reports:daily
auth:login
auth:logout
settings:get
settings:update
```

Every IPC handler must:

- validate payload with Zod
- check permission if sensitive
- handle errors safely
- return clean result
- never leak stack trace to renderer
- never expose raw database object

Bad:

```ts
ipcMain.handle("db:raw", (_, sql) => db.prepare(sql).all())
```

Never do this.

Good:

```ts
ipcMain.handle("db:products:list", async () => {
  return productService.listProducts()
})
```

---

# Electron Security Rules

Electron must be safe.

Use:

```txt
contextIsolation: true
nodeIntegration: false
sandbox: true where possible
```

Preload exposes only needed APIs.

Renderer must not access:

- Node
- filesystem
- database
- shell
- raw IPC

Validate all preload input.

Danger actions need permission:

- delete sale
- refund
- stock adjustment
- user management
- backup restore
- settings change

Audit these actions.

---

# Audit Log

Audit log needed for sensitive things:

- login
- logout
- failed login
- sale created
- sale cancelled
- refund
- stock adjusted
- product price changed
- user created
- user updated
- settings changed
- backup created
- restore completed

Audit log should store:

- id
- user_id
- action
- entity_type
- entity_id
- old_value if useful
- new_value if useful
- created_at

---

# UI Rules

Use Stitch as visual truth.

Before building UI:

- inspect Stitch MCP screens
- list screens
- map screen to route
- identify shared components
- then code

Use CSS Modules.

No Tailwind.

Keep Stitch style:

- spacing
- typography
- colors
- shadows
- border radius
- layout
- button states
- cards
- tables
- modals

Every page needs:

- loading state
- empty state
- error state
- success feedback
- keyboard-friendly forms
- responsive enough for desktop windows

Do not invent new style unless Stitch missing.

---

# React Rules

Use TypeScript.

Use clear components.

Avoid huge files.

If file grows too big, split.

Use:

- pages for route screens
- components for reusable UI
- hooks for reusable logic
- stores for Zustand state
- db wrappers for IPC calls

No business-critical logic only in component.

Business logic belongs in services/main/db layer.

---

# Forms And Validation

Use:

- React Hook Form
- Zod

Validate on frontend for UX.

Validate again in main process for safety.

Never trust renderer.

Show clear errors.

Do not allow:

- negative price
- negative quantity
- invalid discount
- empty required fields
- duplicate SKU/barcode
- invalid payment amount

---

# State Rules

Use Zustand for UI/app state.

Do not store critical database truth only in Zustand.

Database is source of truth.

After write, refresh or update state safely.

Avoid stale cart, stale stock, stale reports.

---

# Receipt Rules

Receipt must include:

- shop name
- address/phone if set
- invoice number
- date/time
- cashier
- items
- quantity
- price
- subtotal
- discount
- tax
- total
- paid
- change
- payment method
- footer

Receipt should print or export safely.

Do not block sale if printer missing unless business rule says so.
Show print error and allow retry.

---

# Production Packaging Rules

Before release, verify:

- production build works
- electron-builder config correct
- app icon exists
- app name correct
- version correct
- database path uses `app.getPath('userData')`
- no DB inside app.asar
- preload works in packaged app
- migrations work after update
- dev tools disabled or controlled
- no secrets in package
- no test data in production

---

# Testing Rules

Minimum tests should cover:

- migrations
- product CRUD
- sale creation
- inventory deduction
- refund
- role permissions
- Zod validation
- IPC handlers
- report calculations

For critical flows test:

- happy path
- failure path
- invalid input
- permission denied

After code change, run:

```bash
npm run build && npm test
```

If no tests exist, report it.
If tests fail, fix or explain blocker.

---

# Agent Rules

Use agents when task is big.

Use swarm for:

- 3+ files
- new feature
- cross-module refactor
- API/IPC changes
- security
- performance
- database change
- production audit

Do not swarm for:

- tiny fix
- one-line change
- simple config
- simple question

---

# Agent Comms

Agents talk with `SendMessage`.

Use named agents.

Do not use vague unnamed workers.

Good names:

```txt
researcher
architect
coder
tester
reviewer
security
performance
```

Pipeline:

```txt
researcher -> architect -> coder -> tester -> reviewer
```

Spawn all needed agents in one message.

Each agent must know:

- what to do
- who to message next
- what result to send

After spawning agents, stop and wait for messages.

Do not poll.

---

# Common Agent Flows

## Bug Fix

Use:

```txt
researcher
coder
tester
```

Flow:

```txt
researcher -> coder -> tester -> lead
```

## Feature

Use:

```txt
architect
coder
tester
reviewer
```

Flow:

```txt
architect -> coder -> tester -> reviewer -> lead
```

## Refactor

Use:

```txt
architect
coder
reviewer
```

Flow:

```txt
architect -> coder -> reviewer -> lead
```

## Security

Use:

```txt
security-architect
security-auditor
coder
tester
```

Flow:

```txt
security-architect -> coder -> security-auditor -> tester -> lead
```

## Performance

Use:

```txt
performance-engineer
coder
tester
```

Flow:

```txt
performance-engineer -> coder -> tester -> lead
```

---

# Ruflo / Claude Flow

Use when helpful.

Setup:

```bash
claude mcp add claude-flow -- npx -y @claude-flow/cli@latest
npx @claude-flow/cli@latest daemon start
npx @claude-flow/cli@latest doctor --fix
```

Before task, search memory:

```bash
npx @claude-flow/cli@latest memory search --query "[task keywords]" --namespace patterns
npx @claude-flow/cli@latest hooks route --task "[task description]"
```

After success, store learning:

```bash
npx @claude-flow/cli@latest memory store --namespace patterns --key "[name]" --value "[what worked]"
npx @claude-flow/cli@latest hooks post-task --task-id "[id]" --success true --store-results true
```

Use tools if available:

- memory search
- memory store
- swarm init
- agent spawn
- security scan
- hook route
- post-task hook

---

# Graphify

If Graphify exists, use it before big changes.

Read:

```txt
graphify-out/GRAPH_REPORT.md
```

Use it to find:

- god files
- risky dependencies
- important modules
- architecture hotspots
- duplicate logic
- dead zones

Do not edit based only on Graphify.
Still inspect actual files.

---

# Build Commands

Always inspect `package.json`.

Default:

```bash
npm run build && npm test
```

If lint exists:

```bash
npm run lint
```

If typecheck exists:

```bash
npm run typecheck
```

Prefer full check:

```bash
npm run typecheck && npm run lint && npm run build && npm test
```

Use what project actually supports.

---

# Error Handling

No silent fail.

Every user-facing error should be clear.

Bad:

```txt
Something went wrong
```

Better:

```txt
Could not save product. SKU already exists.
```

Main process logs detailed error.
Renderer shows safe message.

Never leak secrets or stack trace to user UI.

---

# No Fake Data Rule

Do not add fake production data.

Seed/demo data only for development.

Demo data must be clearly marked and not run in production.

---

# Git Rules

Do not commit unless user asks.

Before commit:

- build passes
- tests pass
- no secrets
- no unwanted files
- no debug logs
- no generated junk

Never add `Co-Authored-By` unless allowed.

---

# Final Response Format

After work, report:

```txt
What I found:
- ...

What I changed:
- ...

Checks run:
- ...

Still needs business confirmation:
- ...
```

If failed:

```txt
What failed:
- ...

Why:
- ...

What I fixed:
- ...

What still blocks:
- ...
```

No fake confidence.

---

# Main Instruction

Claude, do not be dumb.

Do not wait for user to explain obvious POS needs.

Think like senior dev.
Find loopholes.
Fix related production gaps.
Protect money.
Protect stock.
Protect database.
Protect user.
Ship clean.
