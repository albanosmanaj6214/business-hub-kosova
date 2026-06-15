'use client'

import { Children, useState, useEffect } from 'react'
import { Plus } from 'lucide-react'

interface Props {
  children: React.ReactNode
  initialCount?: number
  step?: number
  gridClassName?: string
  resetKey?: string
  itemNoun?: string
}

export function PaginatedGrid({
  children,
  initialCount = 12,
  step = 12,
  gridClassName = 'grid grid-cols-1 md:grid-cols-2 gap-4',
  resetKey,
  itemNoun = 'të tjerë',
}: Props) {
  const items = Children.toArray(children)
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    setCount(initialCount)
  }, [resetKey, initialCount])

  const visible = items.slice(0, count)
  const remaining = items.length - count
  const nextStep = Math.min(step, remaining)

  return (
    <>
      <div className={gridClassName}>{visible}</div>
      {remaining > 0 && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setCount((c) => c + step)}
            className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-6 py-2.5 text-sm font-medium text-[#1B4F72] hover:bg-[#1B4F72]/5 hover:border-[#1B4F72] shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            Shfaq {nextStep} {itemNoun} ({remaining} të mbetur)
          </button>
          <p className="text-xs text-gray-500">{visible.length} nga {items.length}</p>
        </div>
      )}
    </>
  )
}
