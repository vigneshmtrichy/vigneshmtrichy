'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { SiteHeader } from '@/components/site-header'

const money = (value: number) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const INDIA_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const getIndiaDateKey = (value: string) =>
  INDIA_DATE_FORMATTER.format(new Date(value))

type DashboardChannel = {
  ordersToday: number
  ordersThisMonth: number
  salesToday: number
  salesThisMonth: number
}

type DashboardData = {
  todayOrders: number
  todaySales: number
  monthOrders: number
  monthSales: number
  online: DashboardChannel
  retailer: DashboardChannel
  pendingOrders: number
  lowStock: Array<{ product_slug: string; stock_quantity: number; status: string; stockValue: number }>
  stockValueTotal: number
  recentActivity: Array<{ channel: string; id: number; status: string; total: number; created_at: string }>
  retailerOutstanding: number
  retailerUnapplied: number
}

const EMPTY_DATA: DashboardData = {
  todayOrders: 0,
  todaySales: 0,
  monthOrders: 0,
  monthSales: 0,
  online: { ordersToday: 0, ordersThisMonth: 0, salesToday: 0, salesThisMonth: 0 },
  retailer: { ordersToday: 0, ordersThisMonth: 0, salesToday: 0, salesThisMonth: 0 },
  pendingOrders: 0,
  lowStock: [],
  stockValueTotal: 0,
  recentActivity: [],
  retailerOutstanding: 0,
  retailerUnapplied: 0,
}

export default function AdminDashboardPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [data, setData] = useState<DashboardData>(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadDashboard = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    if (user.email !== 'info@tenoo.in') {
      setAuthorized(false)
      setLoading(false)
      setRefreshing(false)
      return
    }

    setAuthorized(true)

    const [ordersResult, retailerOrdersResult, stockResult, balanceResult] = await Promise.all([
      supabase
        .from('orders')
        .select('id, created_at, total, order_status')
        .order('created_at', { ascending: false }),
      supabase
        .from('retailer_orders')
        .select('id, created_at, total, order_status'),
      supabase
        .from('product_status')
        .select('product_slug, stock_quantity, status, price')
        .not('stock_quantity', 'is', null)
        .order('stock_quantity', { ascending: true }),
      supabase
        .from('retailer_balances')
        .select('outstanding_balance, unapplied_credit'),
    ])

    if (ordersResult.error) {
      console.error('Failed to load dashboard orders:', ordersResult.error)
    }

    if (retailerOrdersResult.error) {
      console.error('Failed to load dashboard retailer orders:', retailerOrdersResult.error)
    }

    if (stockResult.error) {
      console.error('Failed to load dashboard stock:', stockResult.error)
    }

    if (balanceResult.error) {
      console.error('Failed to load dashboard retailer balances:', balanceResult.error)
    }

    const orders = ordersResult.data || []
    const todayKey = getIndiaDateKey(new Date().toISOString())
    const monthKey = todayKey.slice(0, 7)

    const activeOrders = orders.filter(
      (order: any) => order.order_status !== 'cancelled',
    )
    const retailerOrders = (retailerOrdersResult.data || []).filter(
      (order: any) => order.order_status !== 'cancelled',
    )

    const todayOrders = activeOrders.filter(
      (order: any) =>
        order.created_at && getIndiaDateKey(order.created_at) === todayKey,
    )

    const monthOrders = activeOrders.filter(
      (order: any) =>
        order.created_at &&
        getIndiaDateKey(order.created_at).startsWith(monthKey),
    )
    const retailerTodayOrders = retailerOrders.filter(
      (order: any) => order.created_at && getIndiaDateKey(order.created_at) === todayKey,
    )
    const retailerMonthOrders = retailerOrders.filter(
      (order: any) => order.created_at && getIndiaDateKey(order.created_at).startsWith(monthKey),
    )

    const recentActivity = [
      ...activeOrders.map((order: any) => ({ channel: 'Online', id: Number(order.id), status: order.order_status || 'pending', total: Number(order.total || 0), created_at: order.created_at })),
      ...retailerOrders.map((order: any) => ({ channel: 'Retailer', id: Number(order.id), status: order.order_status || 'confirmed', total: Number(order.total || 0), created_at: order.created_at })),
    ]
      .filter((item) => item.created_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6)

    const stockRows = stockResult.data || []
    const stockValueTotal = stockRows.reduce((sum: number, row: any) => sum + Number(row.stock_quantity || 0) * Number(row.price || 0), 0)

    setData({
      todayOrders: todayOrders.length + retailerTodayOrders.length,
      todaySales:
        todayOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0) +
        retailerTodayOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0),
      monthOrders: monthOrders.length + retailerMonthOrders.length,
      monthSales:
        monthOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0) +
        retailerMonthOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0),
      online: {
        ordersToday: todayOrders.length,
        ordersThisMonth: monthOrders.length,
        salesToday: todayOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0),
        salesThisMonth: monthOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0),
      },
      retailer: {
        ordersToday: retailerTodayOrders.length,
        ordersThisMonth: retailerMonthOrders.length,
        salesToday: retailerTodayOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0),
        salesThisMonth: retailerMonthOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0),
      },
      pendingOrders: orders.filter(
        (order: any) => (order.order_status || 'pending') === 'pending',
      ).length,
      lowStock: stockRows.filter((row: any) => Number(row.stock_quantity) <= 10).slice(0, 6).map((row: any) => ({
        product_slug: row.product_slug,
        stock_quantity: Number(row.stock_quantity),
        status: row.status || 'active',
        stockValue: Number(row.stock_quantity || 0) * Number(row.price || 0),
      })),
      stockValueTotal,
      recentActivity,
      retailerOutstanding: (balanceResult.data || []).reduce(
        (sum: number, row: any) => sum + Number(row.outstanding_balance || 0),
        0,
      ),
      retailerUnapplied: (balanceResult.data || []).reduce(
        (sum: number, row: any) => sum + Number(row.unapplied_credit || 0),
        0,
      ),
    })

    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const cards = useMemo(
    () => [
      {
        label: 'Orders today',
        value: String(data.todayOrders),
      },
      {
        label: 'Sales today',
        value: money(data.todaySales),
      },
      {
        label: 'Orders this month',
        value: String(data.monthOrders),
      },
      {
        label: 'Sales this month',
        value: money(data.monthSales),
      },
      {
        label: 'Retailer outstanding',
        value: money(data.retailerOutstanding),
      },
      {
        label: 'Unapplied retailer credit',
        value: money(data.retailerUnapplied),
      },
    ],
    [data],
  )

  if (authorized === null || loading) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen bg-muted/20 px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-7xl text-center text-sm text-muted-foreground">
            Loading dashboard…
          </div>
        </main>
      </>
    )
  }

  if (!authorized) {
    return (
      <>
        <SiteHeader />
        <main className="p-10 text-center">Admin access only.</main>
      </>
    )
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-muted/20 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Dashboard</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                A quick view of Tenoo orders, sales, stock and retailer balances.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void loadDashboard(true)}
                disabled={refreshing}
                className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 ease-out hover:scale-[1.03] hover:shadow-md active:scale-[0.99] hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>

            </div>
          </div>

          <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
            >
              <p className="text-xs font-medium text-muted-foreground">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {card.value}
              </p>
            </div>
          ))}
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold">Sales by channel</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Online customer orders and retailer orders, excluding cancelled orders.
              </p>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-3 font-medium">Channel</th>
                    <th className="pb-3 text-right font-medium">Orders today</th>
                    <th className="pb-3 text-right font-medium">Orders this month</th>
                    <th className="pb-3 text-right font-medium">Sales today</th>
                    <th className="pb-3 text-right font-medium">Sales this month</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 font-medium">Online</td>
                    <td className="py-3 text-right">{data.online.ordersToday}</td>
                    <td className="py-3 text-right">{data.online.ordersThisMonth}</td>
                    <td className="py-3 text-right">{money(data.online.salesToday)}</td>
                    <td className="py-3 text-right">{money(data.online.salesThisMonth)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 font-medium">Retailer</td>
                    <td className="py-3 text-right">{data.retailer.ordersToday}</td>
                    <td className="py-3 text-right">{data.retailer.ordersThisMonth}</td>
                    <td className="py-3 text-right">{money(data.retailer.salesToday)}</td>
                    <td className="py-3 text-right">{money(data.retailer.salesThisMonth)}</td>
                  </tr>
                  <tr>
                    <td className="pt-3 font-bold">Total</td>
                    <td className="pt-3 text-right font-bold">{data.todayOrders}</td>
                    <td className="pt-3 text-right font-bold">{data.monthOrders}</td>
                    <td className="pt-3 text-right font-bold">{money(data.todaySales)}</td>
                    <td className="pt-3 text-right font-bold">{money(data.monthSales)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Low stock</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Products with 10 or fewer tracked units. Stock value uses current selling price.
                  </p>
                </div>
                <Link
                  href="/admin/products"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View products
                </Link>
              </div>

              {data.lowStock.length > 0 ? (
                <div className="mt-4 divide-y divide-border rounded-xl border border-border">
                  {data.lowStock.map((product) => (
                    <div
                      key={product.product_slug}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <p className="min-w-0 truncate text-sm font-medium">
                        {product.product_slug}
                      </p>
                      <span
                        className={
                          product.stock_quantity === 0
                            ? 'shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700'
                            : product.stock_quantity <= 3
                              ? 'shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700'
                              : 'shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700'
                        }
                      >
                        {product.stock_quantity} left
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No products are currently at or below 10 tracked units.
                </div>
              )}
              {data.lowStock.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Total tracked stock value: {money(data.stockValueTotal)}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Quick actions</h2>
              <div className="mt-4 grid gap-2">
                <Link
                  href="/admin/orders"
                  className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:border-primary/30 hover:bg-secondary hover:shadow-md active:scale-[0.99]"
                >
                  View customer orders
                </Link>
                <Link
                  href="/admin/products"
                  className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:border-primary/30 hover:bg-secondary hover:shadow-md active:scale-[0.99]"
                >
                  Manage products & stock
                </Link>
                <Link
                  href="/admin/retailers"
                  className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:border-primary/30 hover:bg-secondary hover:shadow-md active:scale-[0.99]"
                >
                  Manage retailers & collections
                </Link>
                <Link
                  href="/admin/retailer-orders"
                  className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:border-primary/30 hover:bg-secondary hover:shadow-md active:scale-[0.99]"
                >
                  Create retailer order
                </Link>
                <Link
                  href="/admin/gst-reports"
                  className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:border-primary/30 hover:bg-secondary hover:shadow-md active:scale-[0.99]"
                >
                  GST Reports & quarter closing
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold">Recent activity</h2>
              <p className="mt-1 text-xs text-muted-foreground">Latest customer and retailer orders, excluding cancelled orders.</p>
            </div>
            <div className="mt-4 divide-y divide-border rounded-xl border border-border">
              {data.recentActivity.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No recent orders.</p>
              ) : data.recentActivity.map((item) => (
                <Link
                  key={item.channel + '-' + item.id}
                  href={item.channel === 'Online'
                    ? `/admin/orders?order=${item.id}`
                    : `/admin/retailer-orders?order=${item.id}`}
                  className="group flex items-center justify-between gap-3 px-4 py-3 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.005] hover:bg-secondary/70 hover:shadow-md hover:text-foreground"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium group-hover:text-primary">
                      {item.channel} order #{item.id}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString('en-IN')} · {item.status}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">
                    {money(item.total)}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <p className="mt-5 text-xs text-muted-foreground">
            Sales exclude cancelled customer orders. Dashboard dates use India time.
          </p>
        </div>
      </main>
    </>
  )
}
