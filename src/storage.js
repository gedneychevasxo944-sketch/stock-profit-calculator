const STORAGE_KEY = "stock-profit-calculator:v1";

export function createDefaultData() {
  return {
    activeStockId: null,
    stocks: [
      {
        id: "stock-sample-a",
        name: "A 股票",
        currentPrice: 11,
        realizedProfit: 100000,
        accounts: [
          { costPrice: 10, shares: 50000 },
          { costPrice: 12, shares: 10000 },
        ],
        snapshots: [
          {
            id: "snapshot-sample-a-1",
            savedAt: "2026-07-02 21:18:34",
            stock: {
              id: "stock-sample-a",
              name: "A 股票",
              currentPrice: 11,
              realizedProfit: 100000,
              accounts: [
                { costPrice: 10, shares: 50000 },
                { costPrice: 12, shares: 10000 },
              ],
              snapshots: [],
            },
            summary: {
              totalShares: 60000,
              positionCost: 620000,
              marketValue: 660000,
              weightedCost: 10.333333333333334,
              floatingProfit: 40000,
              realizedProfit: 100000,
              totalProfit: 140000,
            },
          },
        ],
      },
      {
        id: "stock-sample-b",
        name: "B 股票",
        currentPrice: 23.6,
        realizedProfit: 0,
        accounts: [{ costPrice: 24.1, shares: 8000 }],
        snapshots: [],
      },
    ],
  };
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultData();
    }

    return normalizeData(JSON.parse(raw));
  } catch {
    return createDefaultData();
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeData(data)));
}

function normalizeData(data) {
  if (!data || !Array.isArray(data.stocks)) {
    return createDefaultData();
  }

  return {
    activeStockId: data.activeStockId ?? null,
    stocks: data.stocks.map(normalizeStock),
  };
}

function normalizeStock(stock) {
  return {
    id: String(stock.id || makeId("stock")),
    name: String(stock.name || "未命名股票"),
    currentPrice: stock.currentPrice ?? 0,
    realizedProfit: stock.realizedProfit ?? 0,
    accounts: Array.isArray(stock.accounts) && stock.accounts.length > 0
      ? stock.accounts.map(normalizeAccount)
      : [{ costPrice: 0, shares: 0 }],
    snapshots: Array.isArray(stock.snapshots) ? stock.snapshots : [],
  };
}

function normalizeAccount(account) {
  return {
    costPrice: account?.costPrice ?? 0,
    shares: account?.shares ?? 0,
  };
}

export function makeId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}
