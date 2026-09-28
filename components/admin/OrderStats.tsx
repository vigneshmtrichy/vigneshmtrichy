type OrderStatsProps = {
  counts: {
    total: number
    pending: number
    confirmed: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
    sales: number
  }
  statusFilter: string
  selectStatusFilter: (status: string) => void
  money: (value: any) => string
}

export function OrderStats({
  counts,
  statusFilter,
  selectStatusFilter,
  money,
}: OrderStatsProps) {
  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ['Total Orders', counts.total, 'all'],
          ['Pending', counts.pending, 'pending'],
          ['Confirmed', counts.confirmed, 'confirmed'],
          ['Processing', counts.processing, 'processing'],
          ['Shipped', counts.shipped, 'shipped'],
          ['Delivered', counts.delivered, 'delivered'],
        ].map(([label, value, filter]) => {
          const active = statusFilter === String(filter)

          return (
            <button
              key={String(label)}
              type="button"
              onClick={() => selectStatusFilter(String(filter))}
              className={[
                'rounded-2xl border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5',
                active
                  ? 'border-foreground ring-1 ring-foreground/10'
                  : 'border-border',
              ].join(' ')}
            >
              <p className="text-xs font-medium text-muted-foreground">
                {label}
              </p>

              <p className="mt-2 text-2xl font-bold text-foreground">
                {value}
              </p>
            </button>
          )
        })}
      </div>

      <div className="mt-3 grid gap-3 sm:mt-4 lg:grid-cols-[1fr_2fr]">
        <button
          type="button"
          onClick={() => selectStatusFilter('cancelled')}
          className={[
            'rounded-2xl border bg-card p-5 text-left shadow-sm transition hover:shadow-md',
            statusFilter === 'cancelled'
              ? 'border-foreground ring-1 ring-foreground/10'
              : 'border-border',
          ].join(' ')}
        >
          <p className="text-sm font-medium text-muted-foreground">
            Cancelled
          </p>

          <p className="mt-1 text-2xl font-bold text-foreground">
            {counts.cancelled}
          </p>
        </button>

        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total Sales
            </p>

            <p className="mt-1 text-3xl font-bold tracking-tight text-primary">
              {money(counts.sales)}
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Excludes cancelled orders
          </p>
        </div>
      </div>
    </>
  )
}
