import { useState, useEffect } from 'react'
import type { PurchaseLot, SaleTransaction } from '../lib/types'
import { calculateAllTransactions, getRemainingShares } from '../lib/transactions'
import { useFxRate } from '../hooks/useFxRate'
import { DateField } from './DateField'
import { exportTransactionsToCSV, downloadCSV } from '../lib/csv-export'

// ── Helpers ──

function fmtUSD(n: number) {
  return `US$${n.toFixed(2)}`
}
function fmtCAD(n: number) {
  return `CA$${n.toFixed(2)}`
}
function gainColor(n: number) {
  return n >= 0 ? 'text-accent' : 'text-error'
}

// ── Sub-components ──

interface LotRowProps {
  lot: PurchaseLot
  onChange: (updated: PurchaseLot) => void
  onDelete: () => void
}

function LotRow({ lot, onChange, onDelete }: LotRowProps) {
  const { rate, loading } = useFxRate(lot.purchaseDate)
  const [isAutoRate, setIsAutoRate] = useState(false)

  // When a new auto-rate comes in, populate the field
  useEffect(() => {
    if (rate !== null && lot.purchaseDateFxRate === 0) {
      onChange({ ...lot, purchaseDateFxRate: rate })
      setIsAutoRate(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate])

  const acbUSD = lot.fmvOnPurchaseDate * lot.sharesPurchased
  const acbCAD = lot.purchaseDateFxRate > 0 ? acbUSD * lot.purchaseDateFxRate : null

  function handleDateChange(date: string) {
    onChange({ ...lot, purchaseDate: date, purchaseDateFxRate: 0 })
    setIsAutoRate(false)
  }

  function handleFxChange(val: string) {
    setIsAutoRate(false)
    onChange({ ...lot, purchaseDateFxRate: parseFloat(val) || 0 })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-6 gap-3 py-4 border-b border-neutral-900 items-end group">
      {/* Purchase Date */}
      <DateField
        label="Purchase Date"
        value={lot.purchaseDate}
        onChange={handleDateChange}
        loading={loading}
      />

      {/* Shares */}
      <div>
        <label className="block text-[11px] font-medium tracking-[0.14em] uppercase text-muted mb-2">
          Shares
        </label>
        <div className="border-b border-neutral-800 focus-within:border-accent pb-2">
          <input
            type="number"
            value={lot.sharesPurchased || ''}
            onChange={(e) => onChange({ ...lot, sharesPurchased: parseInt(e.target.value) || 0 })}
            placeholder="0"
            min={1}
            className="w-full bg-transparent text-neutral-100 text-sm font-mono outline-none placeholder:text-neutral-700 caret-accent"
          />
        </div>
      </div>

      {/* FMV */}
      <div>
        <label className="block text-[11px] font-medium tracking-[0.14em] uppercase text-muted mb-2">
          FMV (USD)
        </label>
        <div className="flex items-baseline gap-1 border-b border-neutral-800 focus-within:border-accent pb-2">
          <span className="text-muted text-xs font-mono">US$</span>
          <input
            type="number"
            value={lot.fmvOnPurchaseDate || ''}
            onChange={(e) => onChange({ ...lot, fmvOnPurchaseDate: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            min={0}
            step="0.01"
            className="flex-1 bg-transparent text-neutral-100 text-sm font-mono outline-none placeholder:text-neutral-700 caret-accent"
          />
        </div>
      </div>

      {/* FX Rate */}
      <div>
        <label className="block text-[11px] font-medium tracking-[0.14em] uppercase text-muted mb-2">
          FX Rate
          {isAutoRate && (
            <span className="ml-1.5 text-[9px] tracking-widest text-accent border border-accent/30 rounded px-1 py-0.5 normal-case font-normal">
              auto
            </span>
          )}
        </label>
        <div className="border-b border-neutral-800 focus-within:border-accent pb-2">
          <input
            type="number"
            value={lot.purchaseDateFxRate || ''}
            onChange={(e) => handleFxChange(e.target.value)}
            placeholder={loading ? 'fetching…' : '1.4000'}
            step="0.0001"
            className="w-full bg-transparent text-neutral-100 text-sm font-mono outline-none placeholder:text-neutral-700 caret-accent"
          />
        </div>
      </div>

      {/* ACB USD */}
      <div>
        <label className="block text-[11px] font-medium tracking-[0.14em] uppercase text-muted mb-2">
          ACB (USD)
        </label>
        <p className="text-sm font-mono text-neutral-400 pb-2 border-b border-neutral-900">
          {acbUSD > 0 ? fmtUSD(acbUSD) : '—'}
        </p>
      </div>

      {/* ACB CAD */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="block text-[11px] font-medium tracking-[0.14em] uppercase text-muted mb-2">
            ACB (CAD)
          </label>
          <p className="text-sm font-mono text-neutral-400 pb-2 border-b border-neutral-900">
            {acbCAD !== null && acbCAD > 0 ? fmtCAD(acbCAD) : '—'}
          </p>
        </div>
        <button
          onClick={onDelete}
          title="Remove lot"
          className="pb-2 text-neutral-700 hover:text-error transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  )
}

interface SaleRowProps {
  sale: SaleTransaction
  lots: PurchaseLot[]
  onChange: (updated: SaleTransaction) => void
  onDelete: () => void
}

function SaleRow({ sale, lots, onChange, onDelete }: SaleRowProps) {
  const { rate: sellRate, loading: sellLoading } = useFxRate(sale.sellDate)
  const [isAutoRate, setIsAutoRate] = useState(false)

  useEffect(() => {
    if (sellRate !== null && sale.sellDateFxRate === 0) {
      onChange({ ...sale, sellDateFxRate: sellRate })
      setIsAutoRate(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellRate])

  const lot = lots.find((l) => l.id === sale.lotId)
  const proceedsUSD = sale.sellPricePerShare * sale.sharesSold
  const proceedsCAD = sale.sellDateFxRate > 0 ? proceedsUSD * sale.sellDateFxRate : null
  const acbCAD = lot && lot.purchaseDateFxRate > 0
    ? lot.fmvOnPurchaseDate * sale.sharesSold * lot.purchaseDateFxRate
    : null
  const gainLoss = proceedsCAD !== null && acbCAD !== null ? proceedsCAD - acbCAD : null

  function handleSellDateChange(date: string) {
    onChange({ ...sale, sellDate: date, sellDateFxRate: 0 })
    setIsAutoRate(false)
  }

  function handleFxChange(val: string) {
    setIsAutoRate(false)
    onChange({ ...sale, sellDateFxRate: parseFloat(val) || 0 })
  }

  const remainingByLot = lot
    ? getRemainingShares(lot.id, lot, []) // validated at add-time, display only
    : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-9 gap-3 py-4 border-b border-neutral-900 items-stretch">
      {/* Lot */}
      <div className="lg:col-span-2 relative flex flex-col">
        <label className="block text-[11px] font-medium tracking-[0.14em] uppercase text-muted mb-2 whitespace-nowrap">
          Lot
        </label>
        <div className="flex-1 flex items-end border-b border-neutral-800 focus-within:border-accent pb-2">
          <select
            value={sale.lotId}
            onChange={(e) => onChange({ ...sale, lotId: e.target.value })}
            className="w-full bg-transparent text-neutral-100 text-sm font-mono outline-none caret-accent appearance-none"
          >
            <option value="" className="bg-card">— select lot —</option>
            {lots.map((l) => (
              <option key={l.id} value={l.id} className="bg-card">
                {l.purchaseDate} — {l.sharesPurchased} shares @ US${l.fmvOnPurchaseDate.toFixed(2)}
              </option>
            ))}
          </select>
        </div>
        {lot && (
          <p className="absolute top-full text-[10px] text-muted mt-1">
            {getRemainingShares(lot.id, lot, [sale])} remaining
          </p>
        )}
      </div>

      {/* Shares Sold */}
      <div className="flex flex-col">
        <label className="block text-[11px] font-medium tracking-[0.14em] uppercase text-muted mb-2 whitespace-nowrap">
          Shares Sold
        </label>
        <div className="flex-1 flex items-end border-b border-neutral-800 focus-within:border-accent pb-2">
          <input
            type="number"
            value={sale.sharesSold || ''}
            onChange={(e) => onChange({ ...sale, sharesSold: parseInt(e.target.value) || 0 })}
            placeholder="0"
            min={1}
            max={remainingByLot}
            className="w-full bg-transparent text-neutral-100 text-sm font-mono outline-none placeholder:text-neutral-700 caret-accent"
          />
        </div>
      </div>

      {/* Sell Date */}
      <DateField
        label="Sell Date"
        value={sale.sellDate}
        onChange={handleSellDateChange}
      />

      {/* Sell Price */}
      <div className="flex flex-col">
        <label className="block text-[11px] font-medium tracking-[0.14em] uppercase text-muted mb-2 whitespace-nowrap">
          Sell Price
        </label>
        <div className="flex-1 flex items-end gap-1 border-b border-neutral-800 focus-within:border-accent pb-2">
          <span className="text-muted text-xs font-mono">US$</span>
          <input
            type="number"
            value={sale.sellPricePerShare || ''}
            onChange={(e) => onChange({ ...sale, sellPricePerShare: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            step="0.01"
            className="flex-1 bg-transparent text-neutral-100 text-sm font-mono outline-none placeholder:text-neutral-700 caret-accent"
          />
        </div>
      </div>

      {/* Sell Date FX */}
      <div className="flex flex-col">
        <label className="block text-[11px] font-medium tracking-[0.14em] uppercase text-muted mb-2 whitespace-nowrap">
          Sell Date FX
          {isAutoRate && (
            <span className="ml-1.5 text-[9px] tracking-widest text-accent border border-accent/30 rounded px-1 py-0.5 normal-case font-normal">
              auto
            </span>
          )}
        </label>
        <div className="flex-1 flex items-end border-b border-neutral-800 focus-within:border-accent pb-2">
          <input
            type="number"
            value={sale.sellDateFxRate || ''}
            onChange={(e) => handleFxChange(e.target.value)}
            placeholder={sellLoading ? 'fetching…' : '1.4000'}
            step="0.0001"
            className="w-full bg-transparent text-neutral-100 text-sm font-mono outline-none placeholder:text-neutral-700 caret-accent"
          />
        </div>
      </div>

      {/* Proceeds USD */}
      <div className="flex flex-col">
        <label className="block text-[11px] font-medium tracking-[0.14em] uppercase text-muted mb-2 whitespace-nowrap">
          Proceeds (USD)
        </label>
        <p className="flex-1 flex items-end text-sm font-mono text-neutral-400 pb-2 border-b border-neutral-900">
          {proceedsUSD > 0 ? fmtUSD(proceedsUSD) : '—'}
        </p>
      </div>

      {/* Proceeds CAD */}
      <div className="flex flex-col">
        <label className="block text-[11px] font-medium tracking-[0.14em] uppercase text-muted mb-2 whitespace-nowrap">
          Proceeds (CAD)
        </label>
        <p className="flex-1 flex items-end text-sm font-mono text-neutral-400 pb-2 border-b border-neutral-900">
          {proceedsCAD !== null && proceedsCAD > 0 ? fmtCAD(proceedsCAD) : '—'}
        </p>
      </div>

      {/* Gain/Loss */}
      <div className="flex flex-col">
        <label className="block text-[11px] font-medium tracking-[0.14em] uppercase text-muted mb-2 whitespace-nowrap">
          Gain / Loss
        </label>
        <div className="flex-1 flex items-end gap-2 pb-2 border-b border-neutral-900">
          <p className={`flex-1 text-sm font-mono ${gainLoss !== null ? gainColor(gainLoss) : 'text-neutral-600'}`}>
            {gainLoss !== null ? fmtCAD(gainLoss) : '—'}
          </p>
          <button
            onClick={onDelete}
            title="Remove sale"
            className="text-neutral-700 hover:text-error transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ──

interface TransactionTableProps {
  lots: PurchaseLot[]
  sales: SaleTransaction[]
  onLotsChange: (lots: PurchaseLot[]) => void
  onSalesChange: (sales: SaleTransaction[]) => void
}

export function TransactionTable({
  lots,
  sales,
  onLotsChange,
  onSalesChange,
}: TransactionTableProps) {
  const results = calculateAllTransactions(lots, sales)

  const totalACB = results.reduce((s, r) => s + r.acbCAD, 0)
  const totalProceeds = results.reduce((s, r) => s + r.proceedsCAD, 0)
  const totalGain = results.reduce((s, r) => s + r.gainLossCAD, 0)

  function addLot() {
    const newLot: PurchaseLot = {
      id: crypto.randomUUID(),
      purchaseDate: '',
      sharesPurchased: 0,
      fmvOnPurchaseDate: 0,
      purchaseDateFxRate: 0,
    }
    onLotsChange([...lots, newLot])
  }

  function addSale() {
    const newSale: SaleTransaction = {
      id: crypto.randomUUID(),
      lotId: lots[0]?.id ?? '',
      sellDate: '',
      sharesSold: 0,
      sellPricePerShare: 0,
      sellDateFxRate: 0,
    }
    onSalesChange([...sales, newSale])
  }

  function handleExport() {
    const csv = exportTransactionsToCSV(lots, sales, results)
    downloadCSV(csv, 'espp-transactions.csv')
  }

  return (
    <div className="space-y-10">
      {/* ── Purchase Lots ── */}
      <section>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-neutral-200">Purchase Lots</h2>
          {results.length > 0 && (
            <button
              onClick={handleExport}
              className="text-[11px] font-medium text-accent border border-accent/30 rounded px-3 py-1.5 hover:bg-accent/10 transition-colors"
            >
              Export CSV
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted mb-4">
          Each ESPP purchase period where you acquired shares.
        </p>

        {lots.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-neutral-800 rounded-lg">
            <p className="text-muted text-sm">No lots yet. Add your first purchase lot to get started.</p>
          </div>
        ) : (
          <div>
            <div className="hidden lg:grid lg:grid-cols-6 gap-3 pb-2 border-b border-neutral-800">
              {['Purchase Date', 'Shares', 'FMV (USD)', 'FX Rate', 'ACB (USD)', 'ACB (CAD)'].map((h) => (
                <span key={h} className="text-[10px] font-medium tracking-[0.14em] uppercase text-neutral-600">
                  {h}
                </span>
              ))}
            </div>
            {lots.map((lot) => (
              <LotRow
                key={lot.id}
                lot={lot}
                onChange={(updated) => onLotsChange(lots.map((l) => (l.id === updated.id ? updated : l)))}
                onDelete={() => {
                  onLotsChange(lots.filter((l) => l.id !== lot.id))
                  onSalesChange(sales.filter((s) => s.lotId !== lot.id))
                }}
              />
            ))}
          </div>
        )}

        <button
          onClick={addLot}
          className="mt-4 text-[11px] font-medium text-muted hover:text-accent border border-neutral-800 hover:border-accent/40 rounded px-3 py-1.5 transition-colors"
        >
          + Add Lot
        </button>
      </section>

      {/* ── Sales ── */}
      <section>
        <h2 className="text-base font-semibold text-neutral-200 mb-1">Sales</h2>
        <p className="text-[11px] text-muted mb-4">
          Each time you sold shares from a lot. One lot can have multiple sales.
        </p>

        {lots.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-neutral-800 rounded-lg">
            <p className="text-muted text-sm">Add a purchase lot first.</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-neutral-800 rounded-lg">
            <p className="text-muted text-sm">No sales yet.</p>
          </div>
        ) : (
          <div>
            <div className="hidden lg:grid lg:grid-cols-9 gap-3 pb-2 border-b border-neutral-800">
              <span className="lg:col-span-2 text-[10px] font-medium tracking-[0.14em] uppercase text-neutral-600 whitespace-nowrap">Lot</span>
              {['Shares Sold', 'Sell Date', 'Sell Price', 'Sell Date FX', 'Proceeds (USD)', 'Proceeds (CAD)', 'Gain / Loss'].map((h) => (
                <span key={h} className="text-[10px] font-medium tracking-[0.14em] uppercase text-neutral-600 whitespace-nowrap">{h}</span>
              ))}
            </div>
            {sales.map((sale) => (
              <SaleRow
                key={sale.id}
                sale={sale}
                lots={lots}
                onChange={(updated) => onSalesChange(sales.map((s) => (s.id === updated.id ? updated : s)))}
                onDelete={() => onSalesChange(sales.filter((s) => s.id !== sale.id))}
              />
            ))}
          </div>
        )}

        {lots.length > 0 && (
          <button
            onClick={addSale}
            className="mt-4 text-[11px] font-medium text-muted hover:text-accent border border-neutral-800 hover:border-accent/40 rounded px-3 py-1.5 transition-colors"
          >
            + Add Sale
          </button>
        )}
      </section>

      {/* ── Summary ── */}
      {results.length > 0 && (
        <section className="border border-neutral-800 rounded-lg p-5 bg-card">
          <h2 className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted mb-4">
            Summary
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[11px] text-muted mb-1">Total ACB</p>
              <p className="text-sm font-mono font-semibold text-neutral-300">{fmtCAD(totalACB)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted mb-1">Total Proceeds</p>
              <p className="text-sm font-mono font-semibold text-neutral-300">{fmtCAD(totalProceeds)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted mb-1">Total Gain / Loss</p>
              <p className={`text-lg font-mono font-bold ${gainColor(totalGain)}`}>{fmtCAD(totalGain)}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
