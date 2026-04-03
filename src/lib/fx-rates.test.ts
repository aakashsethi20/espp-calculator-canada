import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchYearRates, getRateForDate, clearCache } from './fx-rates'

const mockObservations = {
  observations: [
    { d: '2025-01-02', FXUSDCAD: { v: '1.4400' } },
    { d: '2025-01-03', FXUSDCAD: { v: '1.4389' } },
    // Jan 4-5 are Sat-Sun (no data)
    { d: '2025-01-06', FXUSDCAD: { v: '1.4410' } },
    { d: '2025-01-07', FXUSDCAD: { v: '1.4435' } },
  ],
}

beforeEach(() => {
  clearCache()
  vi.restoreAllMocks()
})

describe('fetchYearRates', () => {
  it('parses Bank of Canada JSON correctly', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockObservations),
      })
    )

    const rates = await fetchYearRates(2025)
    expect(rates.get('2025-01-02')).toBe(1.44)
    expect(rates.get('2025-01-03')).toBe(1.4389)
    expect(rates.get('2025-01-06')).toBe(1.441)
    expect(rates.size).toBe(4)
  })

  it('returns cached data on second call', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockObservations),
    })
    vi.stubGlobal('fetch', mockFetch)

    await fetchYearRates(2025)
    await fetchYearRates(2025)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('throws on API error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 })
    )

    await expect(fetchYearRates(2025)).rejects.toThrow('Bank of Canada API error: 500')
  })
})

describe('getRateForDate', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockObservations),
      })
    )
  })

  it('returns exact match for business day', async () => {
    const rate = await getRateForDate('2025-01-03')
    expect(rate).toBe(1.4389)
  })

  it('returns Friday rate for Saturday (weekend fallback)', async () => {
    const rate = await getRateForDate('2025-01-04')
    expect(rate).toBe(1.4389) // Falls back to Jan 3 (Friday)
  })

  it('returns Friday rate for Sunday (weekend fallback)', async () => {
    const rate = await getRateForDate('2025-01-05')
    expect(rate).toBe(1.4389) // Falls back to Jan 3 (Friday)
  })

  it('returns null when API fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error'))
    )
    const rate = await getRateForDate('2025-01-03')
    expect(rate).toBeNull()
  })
})
