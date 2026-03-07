import { useState, useMemo } from 'react'
import { calculateESPP, type ESPPInputs } from './lib/espp'
import { InputPanel } from './components/InputPanel'
import { ResultsPanel } from './components/ResultsPanel'
import './index.css'

type FormValues = Record<keyof ESPPInputs, string>

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

function parseInputs(form: FormValues): ESPPInputs | null {
  const entries = Object.entries(form) as [keyof ESPPInputs, string][]
  const parsed = Object.fromEntries(
    entries.map(([k, v]) => [k, parseFloat(v)])
  ) as Record<keyof ESPPInputs, number>
  if (Object.values(parsed).some((v) => isNaN(v))) return null
  return parsed
}

export default function App() {
  const [form, setForm] = useState<FormValues>(DEFAULT_FORM)

  const handleChange = (field: keyof ESPPInputs, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const inputs = useMemo(() => parseInputs(form), [form])
  const results = useMemo(() => (inputs ? calculateESPP(inputs) : null), [inputs])

  const lowerPrice = useMemo(() => {
    const p = parseFloat(form.periodStartPrice)
    const e = parseFloat(form.exercisePrice)
    if (isNaN(p) || isNaN(e)) return undefined
    return Math.min(p, e)
  }, [form.periodStartPrice, form.exercisePrice])

  return (
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
          <span className="text-[11px] text-muted hidden sm:block">
            For employees receiving USD-denominated ESPP grants
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-100 mb-2">
            Calculate your ESPP returns
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            Enter your ESPP parameters to see tax obligations, net gain, and ROI as a Canadian
            employee.{' '}
            <span className="text-neutral-600">Fields marked </span>
            <span className="text-accent">*</span>
            <span className="text-neutral-600"> are required.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <InputPanel form={form} onChange={handleChange} lowerPrice={lowerPrice} />
          <div className="lg:sticky lg:top-20">
            <ResultsPanel results={results} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-700">
          <p>Not financial advice — always verify with a tax professional.</p>
          <a
            href="https://www.mackenzieinvestments.com/en/investments/tax-centre"
            target="_blank"
            rel="noreferrer"
            className="text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            Tax rates reference: Mackenzie Investments →
          </a>
        </div>
      </footer>
    </div>
  )
}
