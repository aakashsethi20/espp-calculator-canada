import type { PurchaseLot, SaleTransaction, TransactionResult } from './types'

/**
 * Calculate ACB and proceeds for a single sale transaction.
 * ACB = FMV (not discounted price) because the ESPP discount is employment income on T4.
 */
export function calculateTransaction(
  lot: PurchaseLot,
  sale: SaleTransaction
): TransactionResult {
  const acbUSD = lot.fmvOnPurchaseDate * sale.sharesSold
  const acbCAD = acbUSD * lot.purchaseDateFxRate
  const proceedsUSD = sale.sellPricePerShare * sale.sharesSold
  const proceedsCAD = proceedsUSD * sale.sellDateFxRate
  const gainLossCAD = proceedsCAD - acbCAD

  return {
    saleId: sale.id,
    acbUSD: Math.round(acbUSD * 100) / 100,
    acbCAD: Math.round(acbCAD * 100) / 100,
    proceedsUSD: Math.round(proceedsUSD * 100) / 100,
    proceedsCAD: Math.round(proceedsCAD * 100) / 100,
    gainLossCAD: Math.round(gainLossCAD * 100) / 100,
  }
}

/**
 * Calculate results for all sales, looking up the lot for each sale.
 */
export function calculateAllTransactions(
  lots: PurchaseLot[],
  sales: SaleTransaction[]
): TransactionResult[] {
  const lotMap = new Map(lots.map((l) => [l.id, l]))
  return sales
    .map((sale) => {
      const lot = lotMap.get(sale.lotId)
      if (!lot) return null
      return calculateTransaction(lot, sale)
    })
    .filter((r): r is TransactionResult => r !== null)
}

/**
 * Get remaining unsold shares for a given lot.
 */
export function getRemainingShares(
  lotId: string,
  lot: PurchaseLot,
  sales: SaleTransaction[]
): number {
  const sold = sales
    .filter((s) => s.lotId === lotId)
    .reduce((sum, s) => sum + s.sharesSold, 0)
  return lot.sharesPurchased - sold
}

/**
 * Infer settlement date from sell date (T+1 for US equities since May 2024).
 * Skips weekends: if T+1 falls on Saturday, moves to Monday.
 */
export function inferSettlementDate(sellDate: string): string {
  const d = new Date(sellDate + 'T00:00:00')
  d.setDate(d.getDate() + 1)

  // Skip weekends
  const day = d.getDay()
  if (day === 6) d.setDate(d.getDate() + 2) // Saturday → Monday
  if (day === 0) d.setDate(d.getDate() + 1) // Sunday → Monday

  return d.toISOString().slice(0, 10)
}
