import {
  calculatePortfolioSummary,
  calculateStockSummary,
  createSnapshot,
  formatCurrency,
  formatNumber,
  formatSignedCurrency,
  getAccountLabel,
  profitClass,
} from "./calculations.js";
import { loadData, makeId, saveData } from "./storage.js";

const app = document.querySelector("#app");
let data = loadData();
let selectedStockId = data.activeStockId;

render();
registerServiceWorker();

app.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) {
    return;
  }

  const { action, stockId, accountIndex } = actionTarget.dataset;

  if (action === "add-stock") {
    const stock = createBlankStock();
    data.stocks.unshift(stock);
    selectedStockId = stock.id;
    persist();
    render();
  }

  if (action === "open-stock") {
    selectedStockId = stockId;
    persist();
    render();
  }

  if (action === "back-home") {
    selectedStockId = null;
    persist();
    render();
  }

  if (action === "add-account") {
    const stock = getSelectedStock();
    stock.accounts.push({ costPrice: "", shares: "" });
    persist();
    render();
  }

  if (action === "remove-account") {
    const stock = getSelectedStock();
    if (stock.accounts.length > 1) {
      stock.accounts.splice(Number(accountIndex), 1);
      persist();
      render();
    }
  }

  if (action === "save-snapshot") {
    const stock = getSelectedStock();
    stock.snapshots.unshift(createSnapshot(stock, new Date()));
    persist();
    render();
  }

  if (action === "delete-stock") {
    const stock = getSelectedStock();
    if (stock && confirm(`确定删除「${stock.name || "未命名股票"}」吗？`)) {
      data.stocks = data.stocks.filter((item) => item.id !== stock.id);
      selectedStockId = null;
      persist();
      render();
    }
  }
});

app.addEventListener("input", (event) => {
  const input = event.target.closest("[data-field]");
  if (!input) {
    return;
  }

  const stock = getSelectedStock();
  if (!stock) {
    return;
  }

  const { field, accountIndex } = input.dataset;
  if (accountIndex !== undefined) {
    stock.accounts[Number(accountIndex)][field] = input.value;
  } else {
    stock[field] = input.value;
  }

  persist();
  updateDetailTotals(stock);
});

function render() {
  const stock = getSelectedStock();
  if (stock) {
    renderDetail(stock);
  } else {
    renderHome();
  }
}

function renderHome() {
  const portfolio = calculatePortfolioSummary(data.stocks);

  app.innerHTML = `
    <section class="screen" aria-label="股票列表">
      <header class="topbar">
        <div class="brand">
          <span class="eyebrow">LOCAL PORTFOLIO</span>
          <h1>盈利账本</h1>
        </div>
        <button class="icon-button" type="button" data-action="add-stock" aria-label="新增股票">＋</button>
      </header>

      <section class="summary-band" aria-label="全部股票汇总">
        <div>
          <p class="label">全部股票总盈亏</p>
          <p class="value ${profitClass(portfolio.totalProfit)}">${formatSignedCurrency(portfolio.totalProfit)}</p>
        </div>
        <div class="summary-grid">
          <div class="metric">
            <span class="metric-label">总市值</span>
            <strong>${formatCurrency(portfolio.totalMarketValue)}</strong>
          </div>
          <div class="metric">
            <span class="metric-label">持仓股票</span>
            <strong>${formatNumber(portfolio.stockCount)} 只</strong>
          </div>
        </div>
      </section>

      <div class="section-heading">
        <h2>股票分类</h2>
        <span>点卡片查看详情</span>
      </div>

      <section class="stock-list">
        ${
          data.stocks.length > 0
            ? data.stocks.map(renderStockCard).join("")
            : `<div class="empty-state">还没有股票。点右上角 + 添加第一只。</div>`
        }
      </section>

      <p class="hint-strip">
        数据只保存在本机浏览器。分享出去的是工具链接，不会带走你的持仓和快照。
      </p>
    </section>
  `;
}

function renderStockCard(stock) {
  const summary = calculateStockSummary(stock);

  return `
    <button class="stock-card" type="button" data-action="open-stock" data-stock-id="${escapeHtml(stock.id)}">
      <div class="stock-head">
        <div class="stock-name">
          <strong>${escapeHtml(stock.name || "未命名股票")}</strong>
          <span>现价 ${formatCurrency(stock.currentPrice)} · ${formatNumber(stock.accounts.length)} 个账户</span>
        </div>
        <span class="profit-pill ${profitClass(summary.totalProfit)}">${formatSignedCurrency(summary.totalProfit)}</span>
      </div>
      <div class="mini-grid">
        <div class="mini-cell">
          <span>总股数</span>
          <strong>${formatNumber(summary.totalShares)}</strong>
        </div>
        <div class="mini-cell">
          <span>成本价</span>
          <strong>${formatCurrency(summary.weightedCost)}</strong>
        </div>
        <div class="mini-cell">
          <span>现价</span>
          <strong>${formatCurrency(stock.currentPrice)}</strong>
        </div>
      </div>
    </button>
  `;
}

function renderDetail(stock) {
  const summary = calculateStockSummary(stock);

  app.innerHTML = `
    <section class="screen detail-screen" aria-label="股票详情">
      <header class="topbar">
        <button class="icon-button" type="button" data-action="back-home" aria-label="返回股票列表">‹</button>
        <div class="brand">
          <span class="eyebrow">STOCK DETAIL</span>
          <h2 data-stock-heading>${escapeHtml(stock.name || "未命名股票")}</h2>
        </div>
        <button class="icon-button danger" type="button" data-action="delete-stock" aria-label="删除股票">×</button>
      </header>

      <section class="detail-hero">
        <div class="stock-head">
          <div>
            <p class="label">总盈亏</p>
            <h1 data-total-profit class="${profitClass(summary.totalProfit)}">${formatSignedCurrency(summary.totalProfit)}</h1>
          </div>
          <span class="profit-pill ${profitClass(summary.realizedProfit)}">历史 ${formatSignedCurrency(summary.realizedProfit)}</span>
        </div>
        <label class="field">
          <span class="input-label">股票名称</span>
          <input value="${escapeAttribute(stock.name)}" data-field="name" />
        </label>
        <div class="price-row">
          <label class="field">
            <span class="input-label">现价</span>
            <input value="${escapeAttribute(stock.currentPrice)}" data-field="currentPrice" inputmode="decimal" />
          </label>
          <label class="field">
            <span class="input-label">历史已实现盈亏</span>
            <input value="${escapeAttribute(stock.realizedProfit)}" data-field="realizedProfit" inputmode="decimal" />
          </label>
        </div>
      </section>

      <section class="panel">
        <div class="section-heading compact">
          <h3>账户持仓</h3>
          <span>自动使用 A/B/C</span>
        </div>
        <div class="account-list">
          ${stock.accounts.map(renderAccountRow).join("")}
        </div>
        <div class="actions">
          <button class="secondary-button" type="button" data-action="add-account">添加账户</button>
          <button class="primary-button" type="button" data-action="save-snapshot">确认保存</button>
        </div>
      </section>

      <section class="panel">
        <div class="section-heading compact">
          <h3>汇总结果</h3>
          <span>实时预览</span>
        </div>
        <div class="totals-grid">
          ${renderTotalItem("总股数", formatNumber(summary.totalShares), "total-shares")}
          ${renderTotalItem("持仓市值", formatCurrency(summary.marketValue), "market-value")}
          ${renderTotalItem("成本价", formatCurrency(summary.weightedCost), "weighted-cost")}
          ${renderTotalItem("现价", formatCurrency(stock.currentPrice), "current-price")}
          ${renderTotalItem("当前浮盈亏", formatSignedCurrency(summary.floatingProfit), "floating-profit", profitClass(summary.floatingProfit))}
          ${renderTotalItem("历史已实现", formatSignedCurrency(summary.realizedProfit), "realized-profit", profitClass(summary.realizedProfit))}
          ${renderTotalItem("总盈亏", formatSignedCurrency(summary.totalProfit), "summary-total-profit", `${profitClass(summary.totalProfit)} full-width`)}
        </div>
      </section>

      <section class="panel">
        <div class="section-heading compact">
          <h3>确认快照</h3>
          <span>保存时生成时间戳</span>
        </div>
        <div class="snapshot-list">
          ${
            stock.snapshots.length > 0
              ? stock.snapshots.map(renderSnapshot).join("")
              : `<div class="empty-state">还没有快照。点“确认保存”后会记录当前状态。</div>`
          }
        </div>
      </section>
    </section>
  `;
}

function renderAccountRow(account, index) {
  const label = getAccountLabel(index);
  const accountSummary = calculateStockSummary({
    currentPrice: getSelectedStock()?.currentPrice,
    realizedProfit: 0,
    accounts: [account],
  });

  return `
    <div class="account-row">
      <div class="account-badge">${label}</div>
      <label>
        <span class="input-label">成本价</span>
        <input value="${escapeAttribute(account.costPrice)}" data-field="costPrice" data-account-index="${index}" inputmode="decimal" />
      </label>
      <label>
        <span class="input-label">股数</span>
        <input value="${escapeAttribute(account.shares)}" data-field="shares" data-account-index="${index}" inputmode="numeric" />
      </label>
      <button class="small-icon-button" type="button" data-action="remove-account" data-account-index="${index}" aria-label="删除账户 ${label}">×</button>
      <div class="account-result">
        <span>持仓盈亏</span>
        <strong data-account-profit="${index}" class="${profitClass(accountSummary.floatingProfit)}">${formatSignedCurrency(accountSummary.floatingProfit)}</strong>
      </div>
    </div>
  `;
}

function renderTotalItem(label, value, target, className = "") {
  return `
    <div class="total-item ${className}">
      <span>${label}</span>
      <strong data-summary-target="${target}">${value}</strong>
    </div>
  `;
}

function renderSnapshot(snapshot, index) {
  return `
    <article class="snapshot-card">
      <div class="snapshot-main">
        <div>
          <strong class="${profitClass(snapshot.summary.totalProfit)}">${formatSignedCurrency(snapshot.summary.totalProfit)}</strong>
          <p class="snapshot-time">保存时间 ${escapeHtml(snapshot.savedAt)}</p>
        </div>
        ${index === 0 ? `<span class="profit-pill positive">最新</span>` : ""}
      </div>
      <div class="snapshot-meta">
        <span>现价 ${formatCurrency(snapshot.stock.currentPrice)}</span>
        <span>股数 ${formatNumber(snapshot.summary.totalShares)}</span>
        <span>成本价 ${formatCurrency(snapshot.summary.weightedCost)}</span>
        <span>历史 ${formatSignedCurrency(snapshot.summary.realizedProfit)}</span>
      </div>
    </article>
  `;
}

function updateDetailTotals(stock) {
  const summary = calculateStockSummary(stock);
  const setText = (target, value) => {
    const element = app.querySelector(`[data-summary-target="${target}"]`);
    if (element) {
      element.textContent = value;
    }
  };

  setText("total-shares", formatNumber(summary.totalShares));
  setText("market-value", formatCurrency(summary.marketValue));
  setText("weighted-cost", formatCurrency(summary.weightedCost));
  setText("current-price", formatCurrency(stock.currentPrice));
  setText("floating-profit", formatSignedCurrency(summary.floatingProfit));
  setText("realized-profit", formatSignedCurrency(summary.realizedProfit));
  setText("summary-total-profit", formatSignedCurrency(summary.totalProfit));

  updateClass("[data-summary-target='floating-profit']", profitClass(summary.floatingProfit));
  updateClass("[data-summary-target='realized-profit']", profitClass(summary.realizedProfit));
  updateClass("[data-summary-target='summary-total-profit']", profitClass(summary.totalProfit));
  updateText("[data-total-profit]", formatSignedCurrency(summary.totalProfit));
  updateClass("[data-total-profit]", profitClass(summary.totalProfit));
  updateText("[data-stock-heading]", stock.name || "未命名股票");

  stock.accounts.forEach((account, index) => {
    const accountSummary = calculateStockSummary({
      currentPrice: stock.currentPrice,
      realizedProfit: 0,
      accounts: [account],
    });
    const element = app.querySelector(`[data-account-profit="${index}"]`);
    if (element) {
      element.textContent = formatSignedCurrency(accountSummary.floatingProfit);
      element.className = profitClass(accountSummary.floatingProfit);
    }
  });
}

function updateText(selector, value) {
  const element = app.querySelector(selector);
  if (element) {
    element.textContent = value;
  }
}

function updateClass(selector, className) {
  const element = app.querySelector(selector);
  if (element) {
    element.classList.remove("positive", "negative");
    element.classList.add(className);
  }
}

function getSelectedStock() {
  return data.stocks.find((stock) => stock.id === selectedStockId);
}

function createBlankStock() {
  return {
    id: makeId("stock"),
    name: "新股票",
    currentPrice: 0,
    realizedProfit: 0,
    accounts: [{ costPrice: 0, shares: 0 }],
    snapshots: [],
  };
}

function persist() {
  data.activeStockId = selectedStockId;
  saveData(data);
}

function registerServiceWorker() {
  const canRegister =
    "serviceWorker" in navigator &&
    (location.protocol === "https:" ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1");

  if (canRegister) {
    const SW_VERSION = "2026-07-03";
    navigator.serviceWorker.register(`service-worker.js?v=${SW_VERSION}`);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
