import { useState, useEffect } from 'react'
import { getRateForDate } from '../lib/fx-rates'

interface FxRateState {
  rate: number | null
  loading: boolean
  error: string | null
}

/**
 * Fetches the USD/CAD exchange rate for a given date from Bank of Canada.
 * Handles weekends/holidays by using the closest previous business day.
 */
export function useFxRate(dateStr: string): FxRateState {
  const [state, setState] = useState<FxRateState>({
    rate: null,
    loading: false,
    error: null,
  })

  useEffect(() => {
    if (!dateStr) {
      setState({ rate: null, loading: false, error: null })
      return
    }

    let cancelled = false
    setState((prev) => ({ ...prev, loading: true, error: null }))

    getRateForDate(dateStr)
      .then((rate) => {
        if (!cancelled) {
          setState({
            rate,
            loading: false,
            error: rate === null ? 'No rate available for this date' : null,
          })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ rate: null, loading: false, error: 'Failed to fetch rate' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [dateStr])

  return state
}
