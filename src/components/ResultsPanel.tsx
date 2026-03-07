import type { ESPPResults } from '../lib/espp'

function fmtCAD(n: number): string {
  const abs = Math.abs(n)
  const f = abs.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${n < 0 ? '−' : ''}CA$${f}`
}

function fmtUSD(n: number): string {
  const abs = Math.abs(n)
  const f = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${n < 0 ? '−' : ''}US$${f}`
}

function fmtPct(n: number, sign = false): string {
  const prefix = sign && n > 0 ? '+' : ''
  return `${prefix}${n.toFixed(2)}%`
}

function numClass(n: number): string {
  return n < 0 ? 'text-error' : 'text-neutral-200'
}

interface RowProps {
  label: string
  value: string
  valueClass?: string
}

function Row({ label, value, valueClass }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-neutral-900 last:border-0">
      <span className="text-xs text-muted leading-snug">{label}</span>
      <span className={`font-mono text-sm tabular-nums text-right shrink-0 ${valueClass ?? 'text-neutral-200'}`}>
        {value}
      </span>
    </div>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-accent/50 mb-1">
      {children}
    </p>
  )
}

interface Props {
  results: ESPPResults | null
}

export function ResultsPanel({ results }: Props) {
  if (!results) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-800 flex flex-col items-center justify-center min-h-64 text-center p-10">
        <div className="w-9 h-9 rounded-full border border-accent/25 flex items-center justify-center mb-4">
          <span className="text-accent font-mono text-base leading-none select-none">?</span>
        </div>
        <p className="text-sm text-muted leading-relaxed max-w-xs">
          Fill in the fields on the left to calculate your ESPP returns and tax obligations.
        </p>
        <p className="text-[11px] text-neutral-700 mt-2">Required fields are marked with *</p>
      </div>
    )
  }

  const {
    cashToBuyUSD,
    purchasePrice,
    numShares,
    immediateGainPct,
    additionalIncomeUSD,
    additionalIncomeCAD,
    incomeTaxOwedCAD,
    capitalGainsUSD,
    capitalGainsCAD,
    capitalGainsTaxOwedCAD,
    sellValueUSD,
    sellValueCAD,
    sellValueAfterWireCAD,
    moneyLeftAfterTaxesCAD,
    netGainCAD,
    roiPct,
  } = results

  return (
    <div className="space-y-4">
      {/* Purchase Summary */}
      <div className="rounded-lg border border-accent/10 bg-card p-6">
        <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-accent mb-4 flex items-center gap-3">
          <span className="block w-4 h-px bg-accent shrink-0" />
          Purchase Summary
        </h2>
        <Row label="Cash Deployed" value={fmtUSD(cashToBuyUSD)} />
        <Row label="Purchase Price / Share" value={fmtUSD(purchasePrice)} />
        <Row label="Shares Purchased" value={numShares.toLocaleString('en-CA')} />
        <Row
          label="Immediate Gain in Value"
          value={fmtPct(immediateGainPct, true)}
          valueClass={immediateGainPct >= 0 ? 'text-accent font-semibold' : 'text-error font-semibold'}
        />
      </div>

      {/* Tax Breakdown */}
      <div className="rounded-lg border border-accent/10 bg-card p-6">
        <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-accent mb-4 flex items-center gap-3">
          <span className="block w-4 h-px bg-accent shrink-0" />
          Tax Breakdown
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <SectionLabel>Income Tax</SectionLabel>
            <p className="text-[10px] text-muted mb-2">Discount is taxed as employment income</p>
            <Row label="Additional Income (USD)" value={fmtUSD(additionalIncomeUSD)} />
            <Row label="Additional Income (CAD)" value={fmtCAD(additionalIncomeCAD)} />
            <Row
              label="Income Tax Owed"
              value={fmtCAD(incomeTaxOwedCAD)}
              valueClass="text-error"
            />
          </div>
          <div>
            <SectionLabel>Capital Gains</SectionLabel>
            <p className="text-[10px] text-muted mb-2">Gain above exercise price at sale</p>
            <Row label="Capital Gains (USD)" value={fmtUSD(capitalGainsUSD)} valueClass={numClass(capitalGainsUSD)} />
            <Row label="Capital Gains (CAD)" value={fmtCAD(capitalGainsCAD)} valueClass={numClass(capitalGainsCAD)} />
            <Row
              label="Capital Gains Tax"
              value={fmtCAD(capitalGainsTaxOwedCAD)}
              valueClass={capitalGainsTaxOwedCAD !== 0 ? 'text-error' : 'text-neutral-200'}
            />
          </div>
        </div>
      </div>

      {/* Net Result */}
      <div className="rounded-lg border border-accent/20 bg-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.04] to-transparent pointer-events-none" />
        <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-accent mb-4 flex items-center gap-3 relative">
          <span className="block w-4 h-px bg-accent shrink-0" />
          Net Result
        </h2>
        <div className="relative">
          <Row label="Sell Value (USD)" value={fmtUSD(sellValueUSD)} valueClass={numClass(sellValueUSD)} />
          <Row label="Sell Value (CAD)" value={fmtCAD(sellValueCAD)} valueClass={numClass(sellValueCAD)} />
          <Row label="After Wire / Transfer Fee" value={fmtCAD(sellValueAfterWireCAD)} valueClass={numClass(sellValueAfterWireCAD)} />
          <Row label="After All Taxes" value={fmtCAD(moneyLeftAfterTaxesCAD)} valueClass={numClass(moneyLeftAfterTaxesCAD)} />

          <div className="mt-5 pt-5 border-t border-neutral-800">
            <div className="flex items-end justify-between gap-4 mb-3">
              <span className="text-sm text-muted">Net Gain (CAD)</span>
              <span
                className={`font-mono text-2xl font-semibold tabular-nums ${netGainCAD >= 0 ? 'text-accent' : 'text-error'}`}
                style={
                  netGainCAD >= 0
                    ? { textShadow: '0 0 28px rgba(74, 131, 128, 0.45)' }
                    : undefined
                }
              >
                {fmtCAD(netGainCAD)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted">Return on Investment</span>
              <span
                className={`font-mono text-lg font-medium tabular-nums ${roiPct >= 0 ? 'text-accent' : 'text-error'}`}
              >
                {fmtPct(roiPct, true)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
