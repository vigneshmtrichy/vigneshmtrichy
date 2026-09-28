'use client'

import { useState } from 'react'

type SalesOverviewProps = {
  todayOrderCount: number
  todaySales: number
  monthOrderCount: number
  monthSales: number
  money: (value: any) => string
}

export function SalesOverview({
  todayOrderCount,
  todaySales,
  monthOrderCount,
  monthSales,
  money,
}: SalesOverviewProps) {
  const [open, setOpen] = useState(false)

  const cards = [
    ['Orders today', String(todayOrderCount)],
    ['Sales today', money(todaySales)],
    ['Orders this month', String(monthOrderCount)],
    ['Sales this month', money(monthSales)],
  ]

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm font-semibold shadow-sm sm:hidden"
        aria-expanded={open}
      >
        <span>Sales Overview</span>
        <span className="text-xs text-muted-foreground">
          {open ? '▲' : '▼'}
        </span>
      </button>

      <section
        aria-label="Sales overview"
        className={[
          'mt-3 grid grid-cols-2 gap-3 sm:mt-0 sm:grid sm:grid-cols-4',
          open ? 'grid' : 'hidden',
        ].join(' ')}
      >
        {cards.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
          >
            <p className="text-xs font-medium text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {value}
            </p>
          </div>
        ))}

        <p className="col-span-2 text-xs text-muted-foreground sm:col-span-4">
          Sales exclude cancelled orders. Dates use India time.
        </p>
      </section>
    </div>
  )
}
