import test from "node:test";
import assert from "node:assert/strict";
import {
  calculatePortfolioSummary,
  calculateStockSummary,
  createSnapshot,
  formatCurrency,
  formatNumber,
  formatTimestamp,
  getAccountLabel,
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

test("treats blank and negative position inputs conservatively", () => {
  const stock = {
    currentPrice: -3,
    realizedProfit: "",
    accounts: [
      { costPrice: "", shares: "" },
      { costPrice: 8, shares: -100 },
    ],
  };

  assert.deepEqual(calculateStockSummary(stock), {
    totalShares: 0,
    positionCost: 0,
    marketValue: 0,
    weightedCost: 0,
    floatingProfit: 0,
    realizedProfit: 0,
    totalProfit: 0,
  });
});

test("keeps negative realized profit and includes it in total profit", () => {
  const stock = {
    currentPrice: 5,
    realizedProfit: -1000,
    accounts: [{ costPrice: 4, shares: 1000 }],
  };

  assert.equal(calculateStockSummary(stock).floatingProfit, 1000);
  assert.equal(calculateStockSummary(stock).totalProfit, 0);
});

test("calculates portfolio totals across stocks", () => {
  const stocks = [
    {
      currentPrice: 11,
      realizedProfit: 100000,
      accounts: [
        { costPrice: 10, shares: 50000 },
        { costPrice: 12, shares: 10000 },
      ],
    },
    {
      currentPrice: 23.6,
      realizedProfit: 0,
      accounts: [{ costPrice: 24.1, shares: 8000 }],
    },
  ];

  assert.deepEqual(calculatePortfolioSummary(stocks), {
    stockCount: 2,
    totalMarketValue: 848800,
    totalProfit: 136000,
  });
});

test("formats snapshot timestamp with seconds", () => {
  assert.equal(
    formatTimestamp(new Date("2026-07-02T21:18:34+08:00")),
    "2026-07-02 21:18:34",
  );
});

test("creates confirmed snapshot with stock copy and summary", () => {
  const stock = {
    id: "stock-a",
    name: "A 股票",
    currentPrice: 11,
    realizedProfit: 100000,
    accounts: [{ costPrice: 10, shares: 50000 }],
    snapshots: [],
  };
  const snapshot = createSnapshot(stock, new Date("2026-07-02T21:18:34+08:00"));

  assert.equal(snapshot.savedAt, "2026-07-02 21:18:34");
  assert.equal(snapshot.stock.name, "A 股票");
  assert.deepEqual(snapshot.stock.snapshots, []);
  assert.equal(snapshot.summary.totalShares, 50000);
  assert.equal(snapshot.summary.totalProfit, 150000);
});

test("formats values for display", () => {
  assert.equal(formatCurrency(140000), "+¥140,000");
  assert.equal(formatCurrency(-4180), "-¥4,180");
  assert.equal(formatCurrency(10.333333333), "¥10.33");
  assert.equal(formatNumber(60000), "60,000");
});

test("generates account labels beyond Z", () => {
  assert.equal(getAccountLabel(0), "A");
  assert.equal(getAccountLabel(25), "Z");
  assert.equal(getAccountLabel(26), "AA");
  assert.equal(getAccountLabel(27), "AB");
});
