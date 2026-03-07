interface InputFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  prefix?: string
  suffix?: string
  required?: boolean
  placeholder?: string
  hint?: string
  min?: number
  max?: number
  step?: string
}

export function InputField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  required,
  placeholder = '—',
  hint,
  min,
  max,
  step = 'any',
}: InputFieldProps) {
  return (
    <div>
      <label className="block text-[11px] font-medium tracking-[0.14em] uppercase text-muted mb-2">
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </label>
      <div className="flex items-baseline gap-2 border-b border-neutral-800 focus-within:border-accent pb-2 transition-colors duration-200">
        {prefix && (
          <span className="text-muted text-xs font-mono shrink-0">{prefix}</span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent text-neutral-100 text-sm font-mono outline-none placeholder:text-neutral-700 caret-accent"
        />
        {suffix && (
          <span className="text-muted text-xs font-mono shrink-0">{suffix}</span>
        )}
      </div>
      {hint && (
        <p className="text-[11px] text-muted mt-1.5 leading-relaxed">{hint}</p>
      )}
    </div>
  )
}
