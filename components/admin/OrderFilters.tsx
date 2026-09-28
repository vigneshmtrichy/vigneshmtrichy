type OrderFiltersProps = {
  statusFilters: readonly string[]
  statusFilter: string
  selectStatusFilter: (status: string) => void
  getCountForFilter: (status: string) => number
}

const statusLabel = (status: string) => {
  const value = status || 'pending'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function OrderFilters({
  statusFilters,
  statusFilter,
  selectStatusFilter,
  getCountForFilter,
}: OrderFiltersProps) {
  return (
    <div className="sticky top-10 z-20 mt-5 rounded-2xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur sm:p-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusFilters.map((status) => {
          const active = statusFilter === status

          return (
            <button
              key={status}
              type="button"
              onClick={() => selectStatusFilter(status)}
              className={[
                'shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition sm:text-sm',
                active
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-foreground hover:bg-muted',
              ].join(' ')}
            >
              {statusLabel(status)}

              <span
                className={
                  active
                    ? 'ml-1 opacity-70'
                    : 'ml-1 text-muted-foreground'
                }
              >
                {getCountForFilter(status)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
