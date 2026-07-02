import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultData, loadData, saveData } from "../src/storage.js";

test("starts with no stock data on first launch", () => {
  assert.deepEqual(createDefaultData(), {
    activeStockId: null,
    stocks: [],
  });
});

test("removes legacy seeded stocks from existing local storage", () => {
  const originalLocalStorage = globalThis.localStorage;
  globalThis.localStorage = createMemoryStorage();

  try {
    saveData({
      activeStockId: "stock-sample-a",
      stocks: [
        {
          id: "stock-sample-a",
          name: "legacy seeded stock",
          currentPrice: 11,
          realizedProfit: 100000,
          accounts: [{ costPrice: 10, shares: 50000 }],
          snapshots: [],
        },
        {
          id: "stock-user-owned",
          name: "user stock",
          currentPrice: 5,
          realizedProfit: 0,
          accounts: [{ costPrice: 4, shares: 100 }],
          snapshots: [],
        },
      ],
    });

    assert.deepEqual(loadData(), {
      activeStockId: null,
      stocks: [
        {
          id: "stock-user-owned",
          name: "user stock",
          currentPrice: 5,
          realizedProfit: 0,
          accounts: [{ costPrice: 4, shares: 100 }],
          snapshots: [],
        },
      ],
    });
  } finally {
    globalThis.localStorage = originalLocalStorage;
  }
});

function createMemoryStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}
