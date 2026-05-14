import { cn } from '@/lib/utils'
import { ORDER_TABS, type OrderFilterTab } from './orderHelpers'

type OrderTabsProps = {
  value: OrderFilterTab
  onChange: (value: OrderFilterTab) => void
}

export function OrderTabs({ value, onChange }: OrderTabsProps) {
  return (
    <div className="mb-6 overflow-x-auto border-b border-[#ccc3d8]">
      <div className="flex min-w-max items-center">
        {ORDER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              'border-b-2 px-5 py-3 text-sm font-semibold transition-colors md:px-6',
              value === tab.key
                ? 'border-[#630ed4] text-[#630ed4]'
                : 'border-transparent text-[#4a4455] hover:text-[#630ed4]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
