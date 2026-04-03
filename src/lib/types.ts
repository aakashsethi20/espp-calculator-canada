/** A single ESPP purchase lot */
export interface PurchaseLot {
  id: string
  purchaseDate: string          // "YYYY-MM-DD"
  sharesPurchased: number
  fmvOnPurchaseDate: number     // USD — Fair Market Value
  purchaseDateFxRate: number    // 1 USD = X CAD, auto-fetched or manual
}

/** A sale of shares from a specific lot */
export interface SaleTransaction {
  id: string
  lotId: string                 // links to PurchaseLot.id
  sellDate: string              // "YYYY-MM-DD"
  sharesSold: number
  sellPricePerShare: number     // USD
  settlementDate: string        // "YYYY-MM-DD" (auto: sellDate + T+1, editable)
  settlementDateFxRate: number  // 1 USD = X CAD, auto-fetched or manual
}

/** Computed result for a single sale transaction */
export interface TransactionResult {
  saleId: string
  acbUSD: number                // FMV × shares
  acbCAD: number                // acbUSD × purchase FX rate
  proceedsUSD: number           // sell price × shares
  proceedsCAD: number           // proceedsUSD × settlement FX rate
  gainLossCAD: number           // proceedsCAD − acbCAD
}
