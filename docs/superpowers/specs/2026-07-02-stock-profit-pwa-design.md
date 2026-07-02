# Stock Profit PWA Design

## Goal

Build a mobile-first stock profit calculator that can be installed from the browser, shared as a link, and used locally without accounts or server-side data storage.

## Scope

- The app is a PWA-style static web app.
- Data is stored only on the current device using browser storage.
- Sharing the app shares the tool, not the user's stock data.
- The first screen groups records by stock.
- Each stock has a detail view with editable current price, realized profit/loss, and account rows.
- Account names are automatic labels: A, B, C, and so on.
- Each account row stores cost price and share count.
- The app shows total shares, weighted average cost price, current price, current position profit/loss, realized profit/loss, and total profit/loss.
- The app creates a timestamped snapshot only when the user confirms saving.

## Calculation Rules

- Position cost amount = sum of account cost price times account shares.
- Total shares = sum of account shares.
- Weighted cost price = position cost amount divided by total shares.
- Market value = current price times total shares.
- Current position profit/loss = market value minus position cost amount.
- Total profit/loss = realized profit/loss plus current position profit/loss.

## Screens

### Stock List

The list shows one card per stock. Each card displays stock name, current price, total shares, weighted cost price, and total profit/loss. Tapping a card opens that stock's detail screen.

### Stock Detail

The detail screen has editable fields for stock name, current price, and realized profit/loss. It lists account rows labeled A, B, C, etc. The user can add or remove account rows. The summary updates live while editing.

### Snapshots

Each confirmed save records the current stock data, summary values, and a full timestamp in `YYYY-MM-DD HH:mm:ss` format. Snapshot records are displayed from newest to oldest.

## Error Handling

Blank numeric fields are treated as zero. Negative profit/loss is allowed. Negative share counts and negative prices are clamped to zero in calculations.

## Testing

Calculation functions must be covered with Node's built-in test runner before UI implementation is finalized.
