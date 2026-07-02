export function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function nonNegativeNumber(value) {
  return Math.max(0, toNumber(value));
}

export function calculateStockSummary(stock = {}) {
  const currentPrice = nonNegativeNumber(stock.currentPrice);
  const realizedProfit = toNumber(stock.realizedProfit);
  const accounts = Array.isArray(stock.accounts) ? stock.accounts : [];

  const totals = accounts.reduce(
    (summary, account) => {
      const costPrice = nonNegativeNumber(account?.costPrice);
      const shares = nonNegativeNumber(account?.shares);
      summary.totalShares += shares;
      summary.positionCost += costPrice * shares;
      return summary;
    },
    { totalShares: 0, positionCost: 0 },
  );

  const marketValue = currentPrice * totals.totalShares;
  const weightedCost =
    totals.totalShares > 0 ? totals.positionCost / totals.totalShares : 0;
  const floatingProfit = marketValue - totals.positionCost;

  return {
    totalShares: totals.totalShares,
    positionCost: totals.positionCost,
    marketValue,
    weightedCost,
    floatingProfit,
    realizedProfit,
    totalProfit: realizedProfit + floatingProfit,
  };
}

export function calculatePortfolioSummary(stocks = []) {
  return stocks.reduce(
    (portfolio, stock) => {
      const summary = calculateStockSummary(stock);
      portfolio.stockCount += 1;
      portfolio.totalMarketValue += summary.marketValue;
      portfolio.totalProfit += summary.totalProfit;
      return portfolio;
    },
    { stockCount: 0, totalMarketValue: 0, totalProfit: 0 },
  );
}

export function formatTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join(" ");
}

export function createSnapshot(stock, now = new Date()) {
  const { snapshots, ...stockWithoutSnapshots } = stock;

  return {
    id: `snapshot-${now.getTime()}`,
    savedAt: formatTimestamp(now),
    stock: { ...structuredClone(stockWithoutSnapshots), snapshots: [] },
    summary: calculateStockSummary(stock),
  };
}

export function formatNumber(value, fractionDigits = 0) {
  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(toNumber(value));
}

export function formatCurrency(value) {
  const number = toNumber(value);
  const absolute = Math.abs(number);
  const fractionDigits = absolute >= 1000 ? 0 : 2;
  const prefix = number < 0 ? "-" : absolute >= 1000 ? "+" : "";

  return `${prefix}¥${formatNumber(absolute, fractionDigits)}`;
}

export function profitClass(value) {
  return toNumber(value) >= 0 ? "positive" : "negative";
}

export function getAccountLabel(index) {
  let value = index + 1;
  let label = "";

  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }

  return label;
}
