# Roadmap: Accounts-first refresh

Decided 2026-10-17. Goal: make the numbers in the app match real money (multiple accounts, credit cards), then polish UX, then extend quests. Desktop-only for now, but keep layouts responsive so Tauri mobile stays possible.

Order: finance features → UX polish → game layer.

## Phase 1 — Accounts & transfers ✅
- Account types: cash, bank, e-wallet, credit card. Each has an opening balance; current balance is derived from transactions and transfers.
- Transfers move money between accounts and are never counted as income or expense.
- Existing transactions migrate into a default "Main account". Old JSON backups still restore (missing accounts fall back to the default).
- Net worth = sum of all account balances (credit card balances are negative).

## Phase 2 — Credit cards & account-aware input ✅
- Card purchases count as expenses when swiped. Paying the card is a transfer bank → card.
- Card accounts have a statement day and due day; a "Pay card X" bill is generated in Recurring Bills from the statement balance. Paying it records a transfer and is not deducted from Safe-to-Spend again.
- Quick command bar: default account plus `@alias` suffix (`กะเพรา 65 @kb`). Presets can carry an account. Slip scans guess the account from the bank name.
- Safe-to-Spend keeps the plan-based formula; transfers do not affect it.
- Savings goals may optionally link to a destination account (deposit = transfer); unlinked goals keep the current behaviour. Either way deposits still count toward the Savings bucket.
  - Implemented as a `Savings` transaction with `counterAccountId`: it stays in every savings metric, and balances move the amount from the source account into the goal account.
- Regular bill payments can also choose which account paid.

## Phase 3 — Custom categories & category budgets ✅
- The 9 built-in categories become defaults; users can add, edit and hide categories, each mapped to Needs / Wants / Savings.
- Every category has an icon and a distinct colour (expanded AA-checked palette); never colour alone.
- Monthly limit per category with alerts at 80% and 100%; limits roll up into the 50/30/20 buckets. No rollover.
- Risk: `TransactionCategory` turns from a union type into stored data and touches many files.
  - Built-in ids stay the same ("Food", "Income", …), so stored data needed no migration. Categories live in the `categories` setting and reach components through `CategoriesContext` (`useCategories`).
- Found while testing, for Phase 5: hard-coded English in Budget ("Allocation Slider", "% of budget") and an uninterpolated `{{amount}}` in the Dashboard's Safe-to-Spend breakdown.

## Phase 4 — Balance check & reminders ✅
- Enter the real balance of an account; the app shows the difference. A shortfall is recorded in a system "Unaccounted" category (shown separately in Analytics); a surplus is recorded as an "Adjustment" income. Differences can be split into several entries.
- Close-to-tray, optional launch at login (off by default), and an evening reminder (default 20:00) only on days with nothing logged. Needs `tauri-plugin-notification` and a tray.
  - The reminder runs as a once-a-minute check in the webview, so it needs the app running (window open or hidden in the tray). Tray menu labels are English for now.

## Phase 5 — UX polish
- Move Tax Planner into a Tools menu (6 main tabs). No Accounts tab: balances strip on Dashboard, account filter in Ledger, account management in a modal.
- Dashboard order: Safe-to-Spend today → account balances → to-do (bills due, categories near limit, balance-check nudge) → compact month KPIs → quests/XP.
- Ledger: transfers as a single neutral row ("KBank → Card X"), account column and filter, running balance when filtered to one account.

## Phase 6 — Quests
- New quests: weekly balance check; finish the month with no category over budget. Nothing else in the game layer changes.

## Out of scope
Batch slip import (already exists), sub-categories, budget rollover, sync, mobile app.
