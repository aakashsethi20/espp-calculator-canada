/** Bank of Canada Valet API — USD/CAD exchange rate service with caching */

export type FxRateMap = Map<string, number>

const memoryCache = new Map<number, FxRateMap>()

const SESSION_KEY_PREFIX = 'fx-rates-'

/** Build the Bank of Canada API URL for a given year. */
function buildUrl(year: number): string {
  const start = `${year}-01-01`
  const end = `${year}-12-31`
  return `https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json?start_date=${start}&end_date=${end}`
}

interface BocObservation {
  d: string
  FXUSDCAD: { v: string }
}

interface BocResponse {
  observations: BocObservation[]
}

function parseObservations(data: BocResponse): FxRateMap {
  const map: FxRateMap = new Map()
  for (const obs of data.observations) {
    const rate = parseFloat(obs.FXUSDCAD.v)
    if (!isNaN(rate)) {
      map.set(obs.d, rate)
    }
  }
  return map
}

/** Hydrate a year's rates from sessionStorage if available */
function loadFromSession(year: number): FxRateMap | null {
  try {
    const raw = sessionStorage.getItem(`${SESSION_KEY_PREFIX}${year}`)
    if (!raw) return null
    const entries: [string, number][] = JSON.parse(raw)
    return new Map(entries)
  } catch {
    return null
  }
}

/** Persist a year's rates to sessionStorage */
function saveToSession(year: number, rates: FxRateMap): void {
  try {
    sessionStorage.setItem(
      `${SESSION_KEY_PREFIX}${year}`,
      JSON.stringify([...rates.entries()])
    )
  } catch {
    // sessionStorage full or unavailable — ignore
  }
}

/**
 * Fetch all daily USD/CAD rates for a given year from Bank of Canada.
 * Returns cached data if already fetched this session.
 */
export async function fetchYearRates(year: number): Promise<FxRateMap> {
  // Check memory cache first
  const cached = memoryCache.get(year)
  if (cached) return cached

  // Check sessionStorage
  const stored = loadFromSession(year)
  if (stored) {
    memoryCache.set(year, stored)
    return stored
  }

  // Fetch from API
  const res = await fetch(buildUrl(year))
  if (!res.ok) {
    throw new Error(`Bank of Canada API error: ${res.status}`)
  }
  const data: BocResponse = await res.json()
  const rates = parseObservations(data)

  // Cache
  memoryCache.set(year, rates)
  saveToSession(year, rates)

  return rates
}

/**
 * Get the USD/CAD exchange rate for a specific date.
 * If the date falls on a weekend or holiday, walks backward up to 7 days
 * to find the closest previous business day rate.
 * Returns null if no rate can be found.
 */
export async function getRateForDate(dateStr: string): Promise<number | null> {
  const date = new Date(dateStr + 'T00:00:00')
  const year = date.getFullYear()

  let rates: FxRateMap
  try {
    rates = await fetchYearRates(year)
  } catch {
    return null
  }

  // Walk backward up to 7 days to find the closest previous business day
  for (let i = 0; i < 7; i++) {
    const d = new Date(date)
    d.setDate(d.getDate() - i)

    // If we crossed into the previous year, fetch that year's rates too
    let yearRates = rates
    if (d.getFullYear() !== year) {
      try {
        yearRates = await fetchYearRates(d.getFullYear())
      } catch {
        return null
      }
    }

    const key = d.toISOString().slice(0, 10)
    const rate = yearRates.get(key)
    if (rate !== undefined) return rate
  }

  return null
}

/** Clear the in-memory cache (useful for testing) */
export function clearCache(): void {
  memoryCache.clear()

  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(SESSION_KEY_PREFIX)) {
        sessionStorage.removeItem(key)
      }
    }
  } catch {
    // sessionStorage unavailable — ignore
  }
}
