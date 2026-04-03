import { useState, useEffect, useMemo } from 'react'
import { calculateESPP, type ESPPInputs, type FormValues } from './lib/espp'
import type { PurchaseLot, SaleTransaction } from './lib/types'
import { InputPanel } from './components/InputPanel'
import { ResultsPanel } from './components/ResultsPanel'
import { TabNav } from './components/TabNav'
import { TransactionTable } from './components/TransactionTable'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'

type Tab = 'calculator' | 'transactions'

const DEFAULT_FORM: FormValues = {
  companyDiscountPct: '15',
  contributionCAD: '',
  fxRate: '',
  periodStartPrice: '',
  exercisePrice: '',
  marginalTaxRateCapitalGains: '',
  marginalTaxRateIncome: '',
  sellPrice: '',
  wireFeePct: '2',
}

function useSessionStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = sessionStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : initialValue
  })

  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

function parseInputs(form: FormValues): ESPPInputs | null {
  const entries = Object.entries(form) as [keyof ESPPInputs, string][]
  const parsed = Object.fromEntries(
    entries.map(([k, v]) => [k, parseFloat(v)])
  ) as Record<keyof ESPPInputs, number>
  if (Object.values(parsed).some((v) => isNaN(v))) return null
  return parsed
}

export default function App() {
  const [activeTab, setActiveTab] = useSessionStorage<Tab>('active-tab', 'calculator')
  const [form, setForm] = useSessionStorage<FormValues>('espp-inputs', DEFAULT_FORM)
  const [lots, setLots] = useSessionStorage<PurchaseLot[]>('espp-lots', [])
  const [sales, setSales] = useSessionStorage<SaleTransaction[]>('espp-sales', [])

  const handleChange = (field: keyof ESPPInputs, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const inputs = useMemo(() => parseInputs(form), [form])
  const results = useMemo(() => (inputs ? calculateESPP(inputs) : null), [inputs])

  const lowerPrice = results?.lowerPrice

  return (
    <>
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-neutral-900 bg-surface-alt/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="block w-2 h-2 rounded-full bg-accent" />
            <span className="text-sm font-semibold tracking-wide text-neutral-200">
              ESPP Calculator
            </span>
            <span className="text-[10px] tracking-widest uppercase text-muted border border-neutral-800 rounded px-1.5 py-0.5">
              Canada
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-muted hidden sm:block">
              For employees receiving USD-denominated ESPP grants
            </span>
            <a
              href="https://github.com/aakashsethi20/espp-calculator-canada"
              target="_blank"
              rel="noreferrer"
              aria-label="View source on GitHub"
              className="text-neutral-600 hover:text-neutral-300 transition-colors"
            >
              <svg viewBox="0 0 16 16" width="17" height="17" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-[85rem] mx-auto px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-neutral-100 mb-2">
            Calculate your ESPP returns
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            For Canadian employees receiving USD-denominated ESPP grants.{' '}
            <span className="text-neutral-600">Fields marked </span>
            <span className="text-accent">*</span>
            <span className="text-neutral-600"> are required.</span>
          </p>
        </div>

        <TabNav activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <InputPanel form={form} onChange={handleChange} lowerPrice={lowerPrice} />
            <div className="lg:sticky lg:top-20">
              <ResultsPanel results={results} />
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <TransactionTable
            lots={lots}
            sales={sales}
            onLotsChange={setLots}
            onSalesChange={setSales}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-700">
          <p>Not financial advice — always verify with a tax professional.</p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a
              href="https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html"
              target="_blank"
              rel="noreferrer"
              className="text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              Tax rates reference: Canada Revenue Agency →
            </a>
            <span className="hidden sm:block text-neutral-800">·</span>
            <p>Built by KashMoney Productions.</p>
          </div>
        </div>
      </footer>
    </div>
    <Analytics />
    <SpeedInsights />
    </>
  )
}
