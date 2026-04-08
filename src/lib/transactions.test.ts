import { describe, it, expect } from 'vitest'
import {
  calculateTransaction,
  calculateAllTransactions,
  getRemainingShares,
  inferSettlementDate,
} from './transactions'
import type { PurchaseLot, SaleTransaction } from './types'

// ── User's actual PHR ESPP spreadsheet data ──

const lot1: PurchaseLot = {
  id: 'lot-1',
  purchaseDate: '2024-12-31',
  sharesPurchased: 321, // 100 + 221 sold in two batches
  fmvOnPurchaseDate: 25.16,
  purchaseDateFxRate: 1.4389,
}

const lot2: PurchaseLot = {
  id: 'lot-2',
  purchaseDate: '2025-06-30',
  sharesPurchased: 326,
  fmvOnPurchaseDate: 28.46,
  purchaseDateFxRate: 1.3643,
}

const sale1: SaleTransaction = {
  id: 'sale-1',
  lotId: 'lot-1',
  sellDate: '2025-01-17',
  sharesSold: 100,
  sellPricePerShare: 27.20,
  sellDateFxRate: 1.4435,
}

const sale2: SaleTransaction = {
  id: 'sale-2',
  lotId: 'lot-1',
  sellDate: '2025-01-24',
  sharesSold: 221,
  sellPricePerShare: 27.70,
  sellDateFxRate: 1.4336,
}

const sale3: SaleTransaction = {
  id: 'sale-3',
  lotId: 'lot-2',
  sellDate: '2025-07-08',
  sharesSold: 326,
  sellPricePerShare: 28.85,
  sellDateFxRate: 1.3677,
}

describe('calculateTransaction', () => {
  it('matches spreadsheet row 1: 100 shares Dec 31 → Jan 17', () => {
    const r = calculateTransaction(lot1, sale1)
    expect(r.acbUSD).toBe(2516.0)
    expect(r.acbCAD).toBe(3620.27)
    expect(r.proceedsUSD).toBe(2720.0)
    expect(r.proceedsCAD).toBe(3926.32)
    expect(r.gainLossCAD).toBe(306.05)
  })

  it('matches spreadsheet row 2: 221 shares Dec 31 → Jan 24', () => {
    const r = calculateTransaction(lot1, sale2)
    expect(r.acbUSD).toBe(5560.36)
    expect(r.acbCAD).toBe(8000.8)
    expect(r.proceedsUSD).toBe(6121.7)
    expect(r.proceedsCAD).toBe(8776.07)
    expect(r.gainLossCAD).toBe(775.27)
  })

  it('matches spreadsheet row 3: 326 shares Jun 30 → Jul 8', () => {
    const r = calculateTransaction(lot2, sale3)
    expect(r.acbUSD).toBe(9277.96)
    expect(r.acbCAD).toBe(12657.92)
    expect(r.proceedsUSD).toBe(9405.1)
    expect(r.proceedsCAD).toBe(12863.36)
    expect(r.gainLossCAD).toBe(205.43)
  })
})

describe('calculateAllTransactions', () => {
  it('calculates all three transactions', () => {
    const results = calculateAllTransactions(
      [lot1, lot2],
      [sale1, sale2, sale3]
    )
    expect(results).toHaveLength(3)
    expect(results[0].saleId).toBe('sale-1')
    expect(results[1].saleId).toBe('sale-2')
    expect(results[2].saleId).toBe('sale-3')
  })

  it('skips sales with missing lots', () => {
    const orphanSale: SaleTransaction = {
      ...sale1,
      id: 'orphan',
      lotId: 'nonexistent',
    }
    const results = calculateAllTransactions([lot1], [orphanSale])
    expect(results).toHaveLength(0)
  })

  it('returns empty array for no sales', () => {
    const results = calculateAllTransactions([lot1], [])
    expect(results).toHaveLength(0)
  })
})

describe('getRemainingShares', () => {
  it('returns full shares when no sales exist', () => {
    expect(getRemainingShares('lot-1', lot1, [])).toBe(321)
  })

  it('subtracts sold shares across multiple sales', () => {
    expect(getRemainingShares('lot-1', lot1, [sale1, sale2])).toBe(0)
  })

  it('ignores sales for other lots', () => {
    expect(getRemainingShares('lot-2', lot2, [sale1, sale2])).toBe(326)
  })
})

describe('inferSettlementDate', () => {
  it('adds 1 day for weekday sell', () => {
    // Friday Jan 17 2025 → Monday Jan 20 (T+1 = Saturday, skip to Monday)
    // Wait, Jan 17 is Friday. T+1 = Jan 18 (Saturday) → skip to Monday Jan 20
    expect(inferSettlementDate('2025-01-17')).toBe('2025-01-20')
  })

  it('adds 1 day for Monday sell', () => {
    // Monday Jan 20 → Tuesday Jan 21
    expect(inferSettlementDate('2025-01-20')).toBe('2025-01-21')
  })

  it('adds 1 day for Tuesday sell', () => {
    // Tuesday Jan 21 → Wednesday Jan 22
    expect(inferSettlementDate('2025-01-21')).toBe('2025-01-22')
  })

  it('adds 1 day for Wednesday sell', () => {
    expect(inferSettlementDate('2025-01-22')).toBe('2025-01-23')
  })

  it('adds 1 day for Thursday sell', () => {
    // Thursday Jan 23 → Friday Jan 24
    expect(inferSettlementDate('2025-01-23')).toBe('2025-01-24')
  })

  it('skips weekend for Friday sell', () => {
    // Friday Jan 24 → Saturday Jan 25 → Monday Jan 27
    expect(inferSettlementDate('2025-01-24')).toBe('2025-01-27')
  })
})
