type Tab = 'calculator' | 'transactions'

interface TabNavProps {
  activeTab: Tab
  onChange: (tab: Tab) => void
}

export function TabNav({ activeTab, onChange }: TabNavProps) {
  return (
    <div className="flex gap-6 border-b border-neutral-900 mb-8">
      {(
        [
          { id: 'calculator', label: 'Quick Calculator' },
          { id: 'transactions', label: 'Transaction Log' },
        ] as { id: Tab; label: string }[]
      ).map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={[
            'pb-3 text-sm font-medium transition-colors duration-150',
            activeTab === id
              ? 'text-accent border-b-2 border-accent -mb-px'
              : 'text-muted hover:text-neutral-300',
          ].join(' ')}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
