import type { PurchaseLot, SaleTransaction, TransactionResult } from './types'

const HEADERS = [
  'Purchase Date',
  'Shares Purchased',
  'FMV on Purchase Date (USD)',
  'Purchase Date FX Rate',
  'ACB (USD)',
  'ACB (CAD)',
  'Sell Date',
  'Sell Price (USD)',
  'Sell Date FX Rate',
  'Proceeds (USD)',
  'Proceeds (CAD)',
  'Gain/Loss (CAD)',
]

function escapeCSV(val: string | number): string {
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportTransactionsToCSV(
  lots: PurchaseLot[],
  sales: SaleTransaction[],
  results: TransactionResult[]
): string {
  const lotMap = new Map(lots.map((l) => [l.id, l]))
  const resultMap = new Map(results.map((r) => [r.saleId, r]))

  const rows = sales.map((sale) => {
    const lot = lotMap.get(sale.lotId)
    const result = resultMap.get(sale.id)

    return [
      lot?.purchaseDate ?? '',
      lot?.sharesPurchased ?? '',
      lot?.fmvOnPurchaseDate.toFixed(2) ?? '',
      lot?.purchaseDateFxRate.toFixed(4) ?? '',
      result?.acbUSD.toFixed(2) ?? '',
      result?.acbCAD.toFixed(2) ?? '',
      sale.sellDate,
      sale.sellPricePerShare.toFixed(2),
      sale.sellDateFxRate.toFixed(4),
      result?.proceedsUSD.toFixed(2) ?? '',
      result?.proceedsCAD.toFixed(2) ?? '',
      result?.gainLossCAD.toFixed(2) ?? '',
    ]
      .map(escapeCSV)
      .join(',')
  })

  return [HEADERS.map(escapeCSV).join(','), ...rows].join('\n')
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
