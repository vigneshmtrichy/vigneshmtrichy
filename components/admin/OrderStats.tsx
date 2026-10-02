type OrderStatsProps = {
  counts: {
    total: number
    pending: number
    confirmed: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
  }
  statusFilter: string
  selectStatusFilter: (status: string) => void
}

export function OrderStats({
  counts,
  statusFilter,
  selectStatusFilter,
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
/div>
    </>
  )
}
