export type FormValues = Record<keyof ESPPInputs, string>

export interface ESPPInputs {
  companyDiscountPct: number
  contributionCAD: number
  fxRate: number
  periodStartPrice: number
  exercisePrice: number
  marginalTaxRateCapitalGains: number
  marginalTaxRateIncome: number
  sellPrice: number
  wireFeePct: number
}

export interface ESPPResults {
  lowerPrice: number
  purchasePrice: number
  contributionUSD: number
  numShares: number
  cashToBuyUSD: number
  immediateGainPct: number
  additionalIncomeUSD: number
  additionalIncomeCAD: number
  incomeTaxOwedCAD: number
  capitalGainsUSD: number
  capitalGainsCAD: number
  capitalGainsTaxOwedCAD: number
  sellValueUSD: number
  sellValueCAD: number
  sellValueAfterWireCAD: number
  moneyLeftAfterTaxesCAD: number
  netGainCAD: number
  roiPct: number
}

export function calculateESPP(inputs: ESPPInputs): ESPPResults {
  const {
    companyDiscountPct,
    contributionCAD,
    fxRate,
    periodStartPrice,
    exercisePrice,
    marginalTaxRateCapitalGains,
    marginalTaxRateIncome,
    sellPrice,
    wireFeePct,
  } = inputs

  const lowerPrice = Math.min(periodStartPrice, exercisePrice)
  const purchasePrice = lowerPrice * (1 - companyDiscountPct / 100)
  const contributionUSD = contributionCAD / fxRate
  const numShares = Math.floor(contributionUSD / purchasePrice)
  const cashToBuyUSD = numShares * purchasePrice
  const immediateGainPct = (exercisePrice / purchasePrice - 1) * 100

  const additionalIncomeUSD = (exercisePrice - purchasePrice) * numShares
  const additionalIncomeCAD = additionalIncomeUSD * fxRate
  const incomeTaxOwedCAD = additionalIncomeCAD * (marginalTaxRateIncome / 100)

  const capitalGainsUSD = (sellPrice - exercisePrice) * numShares
  const capitalGainsCAD = capitalGainsUSD * fxRate
  const capitalGainsTaxOwedCAD = capitalGainsCAD * (marginalTaxRateCapitalGains / 100)

  const sellValueUSD = sellPrice * numShares
  const sellValueCAD = sellValueUSD * fxRate
  const sellValueAfterWireCAD = sellValueCAD * (1 - wireFeePct / 100)
  const moneyLeftAfterTaxesCAD = sellValueAfterWireCAD - incomeTaxOwedCAD - capitalGainsTaxOwedCAD
  const netGainCAD = moneyLeftAfterTaxesCAD - contributionCAD
  const roiPct = (netGainCAD / contributionCAD) * 100

  return {
    lowerPrice,
    purchasePrice,
    contributionUSD,
    numShares,
    cashToBuyUSD,
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
  }
}
