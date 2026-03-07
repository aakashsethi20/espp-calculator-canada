import { describe, it, expect } from 'vitest'
import { calculateESPP, type ESPPInputs } from './espp'

// Baseline inputs from the plan example. Note: at FX 1.36 this yields 318 shares,
// not 306 — the plan's expected outputs were from an inconsistent FX rate (~1.42).
const BASE: ESPPInputs = {
  companyDiscountPct: 15,
  contributionCAD: 9375.12,
  fxRate: 1.36,
  periodStartPrice: 25.45,
  exercisePrice: 32.36,
  marginalTaxRateCapitalGains: 21.5,
  marginalTaxRateIncome: 43,
  sellPrice: 35,
  wireFeePct: 2,
}

describe('calculateESPP — purchase mechanics', () => {
  it('uses the lower of period start vs exercise price (lookback)', () => {
    // periodStart (25.45) < exercisePrice (32.36), so lowerPrice = 25.45
    expect(calculateESPP(BASE).lowerPrice).toBe(25.45)
  })

  it('uses exercise price as lower when it is cheaper than period start', () => {
    const r = calculateESPP({ ...BASE, periodStartPrice: 40, exercisePrice: 28 })
    expect(r.lowerPrice).toBe(28)
  })

  it('applies the company discount to the lower price', () => {
    // 25.45 × (1 - 0.15) = 21.6325
    expect(calculateESPP(BASE).purchasePrice).toBeCloseTo(21.6325, 4)
  })

  it('converts CAD contribution to USD via FX rate', () => {
    // 9375.12 / 1.36 = 6893.4706...
    expect(calculateESPP(BASE).contributionUSD).toBeCloseTo(9375.12 / 1.36, 4)
  })

  it('floors the number of shares (no partial shares)', () => {
    // floor(6893.47 / 21.6325) = floor(318.64) = 318
    expect(calculateESPP(BASE).numShares).toBe(318)
  })

  it('cash to buy equals shares × purchase price', () => {
    // 318 × 21.6325 = 6879.135
    expect(calculateESPP(BASE).cashToBuyUSD).toBeCloseTo(318 * 21.6325, 4)
  })

  it('immediate gain reflects discount advantage relative to exercise price', () => {
    // (32.36 / 21.6325 - 1) × 100 ≈ 49.57%
    const expected = (32.36 / 21.6325 - 1) * 100
    expect(calculateESPP(BASE).immediateGainPct).toBeCloseTo(expected, 4)
  })
})

describe('calculateESPP — income tax (discount benefit)', () => {
  it('computes additional income in USD from the discount', () => {
    // (32.36 - 21.6325) × 318 = 10.7275 × 318 = 3411.345
    expect(calculateESPP(BASE).additionalIncomeUSD).toBeCloseTo(3411.345, 2)
  })

  it('converts additional income to CAD', () => {
    // 3411.345 × 1.36 = 4639.4292
    expect(calculateESPP(BASE).additionalIncomeCAD).toBeCloseTo(4639.4292, 2)
  })

  it('applies marginal income tax rate to additional income in CAD', () => {
    // 4639.4292 × 0.43 = 1994.9546
    expect(calculateESPP(BASE).incomeTaxOwedCAD).toBeCloseTo(1994.95, 1)
  })
})

describe('calculateESPP — capital gains tax', () => {
  it('computes capital gains in USD from appreciation above exercise price', () => {
    // (35 - 32.36) × 318 = 2.64 × 318 = 839.52
    expect(calculateESPP(BASE).capitalGainsUSD).toBeCloseTo(839.52, 2)
  })

  it('converts capital gains to CAD', () => {
    // 839.52 × 1.36 = 1141.7472
    expect(calculateESPP(BASE).capitalGainsCAD).toBeCloseTo(1141.7472, 2)
  })

  it('applies marginal capital gains tax rate', () => {
    // 1141.7472 × 0.215 = 245.4756
    expect(calculateESPP(BASE).capitalGainsTaxOwedCAD).toBeCloseTo(245.48, 1)
  })

  it('produces zero capital gains when selling at exercise price', () => {
    const r = calculateESPP({ ...BASE, sellPrice: 32.36 })
    expect(r.capitalGainsUSD).toBe(0)
    expect(r.capitalGainsTaxOwedCAD).toBe(0)
  })

  it('produces negative capital gains when selling below exercise price', () => {
    const r = calculateESPP({ ...BASE, sellPrice: 30 })
    expect(r.capitalGainsUSD).toBeLessThan(0)
    expect(r.capitalGainsTaxOwedCAD).toBeLessThan(0)
  })
})

describe('calculateESPP — net result', () => {
  it('computes sell value in USD', () => {
    // 35 × 318 = 11130
    expect(calculateESPP(BASE).sellValueUSD).toBe(11130)
  })

  it('converts sell value to CAD', () => {
    // 11130 × 1.36 = 15136.8
    expect(calculateESPP(BASE).sellValueCAD).toBeCloseTo(15136.8, 2)
  })

  it('deducts wire fee from sell value', () => {
    // 15136.8 × 0.98 = 14834.064
    expect(calculateESPP(BASE).sellValueAfterWireCAD).toBeCloseTo(14834.064, 2)
  })

  it('deducts both tax obligations from sell value after wire', () => {
    // 14834.064 - 1994.9546 - 245.4756 = 12593.634
    expect(calculateESPP(BASE).moneyLeftAfterTaxesCAD).toBeCloseTo(12593.63, 1)
  })

  it('net gain is money left minus original contribution', () => {
    // 12593.634 - 9375.12 = 3218.514
    expect(calculateESPP(BASE).netGainCAD).toBeCloseTo(3218.51, 1)
  })

  it('ROI is net gain over original contribution as a percentage', () => {
    // 3218.514 / 9375.12 × 100 ≈ 34.33%
    expect(calculateESPP(BASE).roiPct).toBeCloseTo(34.33, 1)
  })

  it('ROI is positive even when selling at exercise price (discount is still a gain)', () => {
    const r = calculateESPP({ ...BASE, sellPrice: 32.36 })
    expect(r.roiPct).toBeGreaterThan(0)
  })
})

describe('calculateESPP — edge cases', () => {
  it('numShares is 0 when contribution is too small to buy one share', () => {
    const r = calculateESPP({ ...BASE, contributionCAD: 1 })
    expect(r.numShares).toBe(0)
  })

  it('all dollar outputs are 0 when numShares is 0', () => {
    const r = calculateESPP({ ...BASE, contributionCAD: 1 })
    expect(r.cashToBuyUSD).toBe(0)
    expect(r.additionalIncomeUSD).toBe(0)
    expect(r.sellValueUSD).toBe(0)
    expect(r.incomeTaxOwedCAD).toBe(0)
    expect(r.capitalGainsTaxOwedCAD).toBe(0)
  })

  it('zero wire fee passes sell value through unchanged', () => {
    const r = calculateESPP({ ...BASE, wireFeePct: 0 })
    expect(r.sellValueAfterWireCAD).toBeCloseTo(r.sellValueCAD, 6)
  })

  it('zero discount means purchase price equals lower price', () => {
    const r = calculateESPP({ ...BASE, companyDiscountPct: 0 })
    expect(r.purchasePrice).toBeCloseTo(r.lowerPrice, 6)
  })
})
