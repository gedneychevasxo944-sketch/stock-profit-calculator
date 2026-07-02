# Stock Profit PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first local-only PWA for tracking stock profit/loss by stock, account rows, and confirmed snapshots.

**Architecture:** Use a static web app with focused browser modules. Keep all calculation logic in pure functions so it can be tested with Node, keep persistence behind a small localStorage adapter, and keep UI rendering in `src/app.js`.

**Tech Stack:** HTML, CSS, browser JavaScript modules, localStorage, Web App Manifest, service worker, Node built-in `node:test`.

## Global Constraints

- Store user data only on the current device.
- Do not require network access, backend services, login, or package installation.
- Account labels must be automatic: A, B, C, etc.
- Do not show "break-even", "盈亏平衡", or "综合保本价" concepts.
- Show core stock summary fields: total shares, weighted cost price, current price, current position profit/loss, realized profit/loss, and total profit/loss.
- Create a snapshot only when the user clicks confirm save.
- Snapshot timestamps must include date and time down to seconds.

---

### Task 1: Calculation Core

**Files:**
- Create: `src/calculations.js`
- Create: `test/calculations.test.js`

**Interfaces:**
- Produces: `calculateStockSummary(stock)` returning `{ totalShares, positionCost, marketValue, weightedCost, floatingProfit, realizedProfit, totalProfit }`
- Produces: `calculatePortfolioSummary(stocks)` returning `{ stockCount, totalMarketValue, totalProfit }`
- Produces: `createSnapshot(stock, now)` returning a snapshot object with `savedAt`, `stock`, and `summary`
- Produces: `formatTimestamp(date)` returning `YYYY-MM-DD HH:mm:ss`

- [ ] **Step 1: Write failing tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  calculatePortfolioSummary,
  calculateStockSummary,
  createSnapshot,
  formatTimestamp,
} from "../src/calculations.js";

test("calculates weighted stock summary from multiple accounts", () => {
  const stock = {
    currentPrice: 11,
    realizedProfit: 100000,
    accounts: [
      { costPrice: 10, shares: 50000 },
      { costPrice: 12, shares: 10000 },
    ],
  };

  assert.deepEqual(calculateStockSummary(stock), {
    totalShares: 60000,
    positionCost: 620000,
    marketValue: 660000,
    weightedCost: 10.333333333333334,
    floatingProfit: 40000,
    realizedProfit: 100000,
    totalProfit: 140000,
  });
});

test("formats snapshot timestamp with seconds", () => {
  assert.equal(
    formatTimestamp(new Date("2026-07-02T21:18:34+08:00")),
    "2026-07-02 21:18:34",
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/calculations.test.js`
Expected: FAIL because `src/calculations.js` does not exist.

- [ ] **Step 3: Implement the calculation functions**

Implement numeric parsing, clamping for negative shares/prices, summary aggregation, portfolio aggregation, and snapshot creation.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/calculations.test.js`
Expected: PASS.

### Task 2: App Shell and Persistence

**Files:**
- Modify: `index.html`
- Create: `src/styles.css`
- Create: `src/storage.js`
- Create: `src/app.js`

**Interfaces:**
- Consumes: calculation functions from `src/calculations.js`
- Produces: local app data stored under `stock-profit-calculator:v1`

- [ ] **Step 1: Build the HTML shell**

Create a root app container, link `src/styles.css`, link `manifest.webmanifest`, and load `src/app.js` as a module.

- [ ] **Step 2: Implement storage adapter**

Expose `loadData()`, `saveData(data)`, and `createDefaultData()` in `src/storage.js`.

- [ ] **Step 3: Implement UI rendering and events**

Render stock list, stock detail, account rows, live summary, snapshot list, add stock, add account, remove account, and confirm save behavior.

- [ ] **Step 4: Manually smoke test in browser**

Open `index.html`, add a stock, edit accounts, confirm save, refresh, and verify data remains.

### Task 3: PWA Install Support

**Files:**
- Create: `manifest.webmanifest`
- Create: `service-worker.js`
- Modify: `src/app.js`

**Interfaces:**
- Consumes: static assets from the app.
- Produces: installable PWA metadata and basic offline cache.

- [ ] **Step 1: Add manifest**

Use app name `股票盈利计算器`, display mode `standalone`, and theme color `#0f172a`.

- [ ] **Step 2: Add service worker**

Cache the HTML, CSS, JS, manifest, and service worker files.

- [ ] **Step 3: Register service worker**

Register `service-worker.js` only when `navigator.serviceWorker` exists and the page is served over HTTP(S) or localhost.

### Task 4: Verification

**Files:**
- Read all changed files.

- [ ] **Step 1: Run unit tests**

Run: `node --test test/calculations.test.js`
Expected: PASS.

- [ ] **Step 2: Run static browser module import check**

Run: `node --check src/app.js`
Expected: no syntax errors.

- [ ] **Step 3: Run HTML smoke check**

Run: `open index.html`
Expected: browser displays the app shell.
