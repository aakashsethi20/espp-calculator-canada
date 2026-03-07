import type { ESPPInputs, FormValues } from '../lib/espp'
import { InputField } from './InputField'

interface Props {
  form: FormValues
  onChange: (field: keyof ESPPInputs, value: string) => void
  lowerPrice?: number
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-accent/10 bg-card p-6">
      <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-accent mb-5 flex items-center gap-3">
        <span className="block w-4 h-px bg-accent shrink-0" />
        {title}
      </h2>
      <div className="space-y-5">{children}</div>
    </div>
  )
}

export function InputPanel({ form, onChange, lowerPrice }: Props) {
  return (
    <div className="space-y-4">
      <Card title="ESPP Setup">
        <InputField
          label="Company Discount"
          value={form.companyDiscountPct}
          onChange={(v) => onChange('companyDiscountPct', v)}
          suffix="%"
          min={0}
          max={100}
          step="0.1"
        />
        <InputField
          label="ESPP Contribution"
          value={form.contributionCAD}
          onChange={(v) => onChange('contributionCAD', v)}
          prefix="CA$"
          required
          min={0}
          step="0.01"
        />
        <InputField
          label="FX Rate (1 USD = ? CAD)"
          value={form.fxRate}
          onChange={(v) => onChange('fxRate', v)}
          min={0}
          step="0.0001"
          hint="e.g. 1.36"
        />
        <InputField
          label="Stock Price — Period Start"
          value={form.periodStartPrice}
          onChange={(v) => onChange('periodStartPrice', v)}
          prefix="US$"
          min={0}
          step="0.01"
        />
        <InputField
          label="Stock Price — Exercise Date"
          value={form.exercisePrice}
          onChange={(v) => onChange('exercisePrice', v)}
          prefix="US$"
          min={0}
          step="0.01"
        />

        {lowerPrice !== undefined && (
          <div className="flex items-center justify-between pt-1 border-t border-neutral-900">
            <span className="text-[11px] text-muted tracking-wide">
              Lower of the two prices (lookback, auto)
            </span>
            <span className="text-accent font-mono text-sm">
              US${lowerPrice.toFixed(2)}
            </span>
          </div>
        )}
      </Card>

      <Card title="Tax & Sale">
        <InputField
          label="Marginal Tax Rate — Capital Gains"
          value={form.marginalTaxRateCapitalGains}
          onChange={(v) => onChange('marginalTaxRateCapitalGains', v)}
          suffix="%"
          required
          min={0}
          max={100}
          step="0.1"
          hint="Typically ~50% of your marginal income rate in Canada"
        />
        <InputField
          label="Marginal Tax Rate — Income"
          value={form.marginalTaxRateIncome}
          onChange={(v) => onChange('marginalTaxRateIncome', v)}
          suffix="%"
          required
          min={0}
          max={100}
          step="0.1"
          hint="Your combined federal + provincial marginal income rate"
        />
        <InputField
          label="Stock Price — Sell Date"
          value={form.sellPrice}
          onChange={(v) => onChange('sellPrice', v)}
          prefix="US$"
          required
          min={0}
          step="0.01"
        />
        <InputField
          label="Wire / Transfer Fee"
          value={form.wireFeePct}
          onChange={(v) => onChange('wireFeePct', v)}
          suffix="%"
          min={0}
          max={100}
          step="0.01"
        />
        <div className="pt-1">
          <a
            href="https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-accent/60 hover:text-accent transition-colors underline underline-offset-2"
          >
            Look up your marginal tax rates (Canada Revenue Agency) →
          </a>
        </div>
      </Card>
    </div>
  )
}
