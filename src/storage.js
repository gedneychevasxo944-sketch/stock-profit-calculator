const STORAGE_KEY = "stock-profit-calculator:v1";
const LEGACY_SEEDED_STOCK_IDS = new Set(["stock-sample-a", "stock-sample-b"]);

export function createDefaultData() {
  return {
    activeStockId: null,
    stocks: [],
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

  const stocks = data.stocks
    .filter((stock) => !LEGACY_SEEDED_STOCK_IDS.has(String(stock?.id || "")))
    .map(normalizeStock);
  const activeStockId = stocks.some((stock) => stock.id === data.activeStockId)
    ? data.activeStockId
    : null;

  return {
    activeStockId,
    stocks,
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
