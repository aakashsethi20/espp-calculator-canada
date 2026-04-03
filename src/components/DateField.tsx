interface DateFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  loading?: boolean
  hint?: string
}

export function DateField({
  label,
  value,
  onChange,
  loading = false,
  hint,
}: DateFieldProps) {
  return (
    <div className="flex flex-col">
      <label className="block text-[11px] font-medium tracking-[0.14em] uppercase text-muted mb-2 whitespace-nowrap">
        {label}
      </label>
      <div className="flex-1 flex items-end gap-2 border-b border-neutral-800 focus-within:border-accent pb-2 transition-colors duration-200">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 bg-transparent text-neutral-100 text-sm font-mono outline-none caret-accent [color-scheme:dark]"
        />
        {loading && (
          <span className="text-muted text-[10px] shrink-0 animate-pulse">fetching…</span>
        )}
      </div>
      {hint && (
        <p className="text-[11px] text-muted mt-1.5 leading-relaxed">{hint}</p>
      )}
    </div>
  )
}
