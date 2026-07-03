const STORAGE_KEY = "stock-profit-calculator:v1";
const LEGACY_SEEDED_STOCKS = [
  {
    id: "stock-sample-a",
    name: "A 股票",
    currentPrice: 11,
    realizedProfit: 100000,
    accounts: [
      { costPrice: 10, shares: 50000 },
      { costPrice: 12, shares: 10000 },
    ],
    snapshotIds: ["snapshot-sample-a-1"],
  },
  {
    id: "stock-sample-b",
    name: "B 股票",
    currentPrice: 23.6,
    realizedProfit: 0,
    accounts: [{ costPrice: 24.1, shares: 8000 }],
    snapshotIds: [],
  },
];

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
    .filter((stock) => !isLegacySeededStock(stock))
    .map(normalizeStock);
  const activeStockId = stocks.some((stock) => stock.id === data.activeStockId)
    ? data.activeStockId
    : null;

  return {
    activeStockId,
    stocks,
  };
}

function isLegacySeededStock(stock) {
  if (!stock || typeof stock !== "object") {
    return false;
  }

  const seed = LEGACY_SEEDED_STOCKS.find((item) => item.id === String(stock.id || ""));

  if (!seed) {
    return false;
  }

  return (
    String(stock.name || "") === seed.name &&
    Number(stock.currentPrice) === seed.currentPrice &&
    Number(stock.realizedProfit) === seed.realizedProfit &&
    accountsMatch(stock.accounts, seed.accounts) &&
    snapshotsMatch(stock.snapshots, seed.snapshotIds)
  );
}

function accountsMatch(accounts, seedAccounts) {
  if (!Array.isArray(accounts) || accounts.length !== seedAccounts.length) {
    return false;
  }

  return accounts.every((account, index) => {
    const seed = seedAccounts[index];
    return (
      Number(account?.costPrice) === seed.costPrice &&
      Number(account?.shares) === seed.shares
    );
  });
}

function snapshotsMatch(snapshots, seedSnapshotIds) {
  if (!Array.isArray(snapshots) || snapshots.length !== seedSnapshotIds.length) {
    return false;
  }

  return snapshots.every((snapshot, index) => snapshot?.id === seedSnapshotIds[index]);
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
