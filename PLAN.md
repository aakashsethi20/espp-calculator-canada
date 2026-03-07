# ESPP Calculator Canada — Rebuild Plan

## Context
The existing project is a Create React App boilerplate with zero calculator logic implemented. The user wants a full rebuild using Vite + React + TypeScript + Tailwind, dark-themed (black + #4a8380 green), replicating the Excel-based ESPP calculator for Canadians receiving USD-denominated stock.

---

## Tech Stack
- **Vite** (replaces CRA)
- **React 18** + **TypeScript**
- **Tailwind CSS** with custom colors
- No router needed — single page

## Color Palette
- Background: `#0a0a0a` / `#111111`
- Primary accent: `#4a8380` (green)
- Secondary: `#2a5553` (darker green)
- Text: `#e5e5e5`
- Muted: `#6b7280`
- Error/tax: `#ef4444` (red)
- Positive gain: `#4a8380` (green)

---

## Iterative Steps

### Step 1 — Scaffold ✅
Tear down CRA, set up Vite + React + TS + Tailwind.

**Actions:**
1. Delete CRA files (src/, public/, package.json, package-lock.json)
2. Run `npm create vite@latest . -- --template react-ts` (in-place)
3. Install Tailwind: `npm install -D tailwindcss @tailwindcss/vite`
4. Configure `tailwind.config.ts` with custom colors
5. Update `vite.config.ts` to include Tailwind plugin
6. Replace `src/index.css` with Tailwind directives
7. Clean `src/App.tsx` to a bare dark shell

**Deliverable:** `npm run dev` shows blank dark page

---

### Step 2 — Calculation Engine (`src/lib/espp.ts`)
Pure TypeScript functions, no UI dependencies.

**Inputs type:**
```ts
interface ESPPInputs {
  companyDiscountPct: number        // e.g. 15
  contributionCAD: number           // e.g. 9375.12
  fxRate: number                    // 1 USD = X CAD, e.g. 1.36
  periodStartPrice: number          // USD
  exercisePrice: number             // USD
  marginalTaxRateCapitalGains: number  // e.g. 21.5
  marginalTaxRateIncome: number        // e.g. 43
  sellPrice: number                 // USD
  wireFeePct: number                // e.g. 2
}
```

**Calculated outputs:**
- `lowerPrice` = min(periodStartPrice, exercisePrice)
- `purchasePrice` = lowerPrice × (1 − discountPct/100)
- `contributionUSD` = contributionCAD / fxRate
- `numShares` = floor(contributionUSD / purchasePrice)
- `cashToBuyUSD` = numShares × purchasePrice
- `immediateGainPct` = (exercisePrice / purchasePrice − 1) × 100
- `additionalIncomeUSD` = (exercisePrice − purchasePrice) × numShares
- `additionalIncomeCAD` = additionalIncomeUSD × fxRate
- `incomeTaxOwedCAD` = additionalIncomeCAD × (marginalTaxRateIncome/100)
- `capitalGainsUSD` = (sellPrice − exercisePrice) × numShares
- `capitalGainsCAD` = capitalGainsUSD × fxRate
- `capitalGainsTaxOwedCAD` = capitalGainsCAD × (marginalTaxRateCapitalGains/100)
- `sellValueUSD` = sellPrice × numShares
- `sellValueCAD` = sellValueUSD × fxRate
- `sellValueAfterWireCAD` = sellValueCAD × (1 − wireFeePct/100)
- `moneyLeftAfterTaxesCAD` = sellValueAfterWireCAD − incomeTaxOwedCAD − capitalGainsTaxOwedCAD
- `netGainCAD` = moneyLeftAfterTaxesCAD − contributionCAD
- `roiPct` = (netGainCAD / contributionCAD) × 100

**Deliverable:** Exported `calculateESPP(inputs): ESPPResults` function

---

### Step 3 — Input Form Component (`src/components/InputPanel.tsx`)
Two logical groups, each with a card:

**Card 1 — ESPP Setup:**
- Company Discount %
- ESPP Contribution (CAD) *
- 1 USD = X CAD (FX Rate)
- Stock Price — Period Start Date (USD)
- Stock Price — Exercise Date (USD)

**Card 2 — Tax & Sale:**
- Marginal Tax Rate — Capital Gains (%) *
- Marginal Tax Rate — Income (%) *
- Stock Price — Sell Date (USD) *
- Wire/Transfer Fee (%) [default: 2]
- Reference link to mackenzie investments tax rates

Auto-computed display (inline, green text):
- "Lower of the two prices (auto): $XX.XX"

**Deliverable:** Controlled form inputs wired to parent state via `onChange`

---

### Step 4 — Results Panel (`src/components/ResultsPanel.tsx`)
Three result sections displayed in cards:

**Section 1 — Purchase Summary**
- Cash to Buy Stock (USD)
- Purchase Price (USD)
- Shares Purchased
- Immediate Gain in Value (%) — accent color

**Section 2 — Tax Breakdown** (two columns)
- Left: Income Tax (due to discount)
  - Additional "Income" from Company (USD)
  - Additional "Income" from Company (CAD)
  - Income Tax Owed (CAD) — red
- Right: Capital Gains Tax (from sale)
  - Capital Gains (USD)
  - Capital Gains (CAD)
  - Capital Gains Tax Owed (CAD) — red

**Section 3 — Net Result** (highlighted card)
- Sell Value of Stock (USD / CAD)
- Sell Value After Wire (CAD)
- Money Left After Taxes (CAD)
- Initial Contribution (CAD)
- **Net Gain (CAD)** — large, green
- Return on Investment (%) — large, green

**Deliverable:** Results display that re-renders on every input change

---

### Step 5 — Layout & Polish (`src/App.tsx`, global styles)
- Page header: "ESPP Calculator" title + subtitle explaining purpose
- Two-column layout on desktop (inputs left, results right), single column on mobile
- "Fill out the required fields (marked with *)" hint text
- Empty/zero state: show placeholder text in results until all required fields are filled
- Tooltip or info icon on complex fields (e.g. "Lower Of The Two" explains ESPP lookback)
- Footer with link to tax reference (mackenzie investments)

---

## Verification
Enter example values to confirm outputs match the Excel:
- Discount: 15, Contribution: 9375.12 CAD, FX: 1.36
- Period Start: 25.45, Exercise: 32.36
- Tax CG: 21.5, Tax Income: 43
- Sell Price: 35, Wire fee: 2

Expected outputs:
- Lower price: 25.45
- Purchase price: 21.6325
- Shares: 306
- Income tax owed: ~1919.67 CAD
- Capital gains tax: ~236.21 CAD
- Sell value USD: 10710
- Net gain: ~2743.28 CAD
- ROI: ~29.26%

---

## Files
| File | Purpose |
|------|---------|
| `package.json` | Vite deps |
| `vite.config.ts` | Vite + Tailwind plugin |
| `tailwind.config.ts` | Custom color palette |
| `src/index.css` | Tailwind directives |
| `src/main.tsx` | Entry point |
| `src/App.tsx` | Root layout + state |
| `src/lib/espp.ts` | Calculation engine |
| `src/components/InputPanel.tsx` | Input form |
| `src/components/ResultsPanel.tsx` | Results display |
| `src/components/InputField.tsx` | Reusable labeled input |
