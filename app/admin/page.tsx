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

type DashboardData = {
  todayOrders: number
  todaySales: number
  monthSales: number
  pendingOrders: number
  lowStock: Array<{ product_slug: string; stock_quantity: number; status: string }>
  retailerOutstanding: number
  retailerUnapplied: number
}

const EMPTY_DATA: DashboardData = {
  todayOrders: 0,
  todaySales: 0,
  monthSales: 0,
  pendingOrders: 0,
  lowStock: [],
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
        .select('product_slug, stock_quantity, status')
        .not('stock_quantity', 'is', null)
        .lte('stock_quantity', 10)
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

    setData({
      todayOrders: todayOrders.length + retailerTodayOrders.length,
      todaySales:
        todayOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0) +
        retailerTodayOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0),
      monthSales:
        monthOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0) +
        retailerMonthOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0),
      pendingOrders: orders.filter(
        (order: any) => (order.order_status || 'pending') === 'pending',
      ).length,
      lowStock: (stockResult.data || []).slice(0, 6).map((row: any) => ({
        product_slug: row.product_slug,
        stock_quantity: Number(row.stock_quantity),
        status: row.status || 'active',
      })),
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
        href: '/admin/orders',
      },
      {
        label: 'Sales today',
        value: money(data.todaySales),
        href: '/admin/orders',
      },
      {
        label: 'Sales this month',
        value: money(data.monthSales),
        href: '/admin/orders',
      },
      {
        label: 'Pending orders',
        value: String(data.pendingOrders),
        href: '/admin/orders?status=pending',
      },
      {
        label: 'Retailer outstanding',
        value: money(data.retailerOutstanding),
        href: '/admin/retailers',
      },
      {
        label: 'Unapplied retailer credit',
        value: money(data.retailerUnapplied),
        href: '/admin/retailers',
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

            <button
              type="button"
              onClick={() => void loadDashboard(true)}
              disabled={refreshing}
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-50"
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {cards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  {card.value}
                </p>
              </Link>
            ))}
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Low stock</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Products with 10 or fewer tracked units.
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
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Quick actions</h2>
              <div className="mt-4 grid gap-2">
                <Link
                  href="/admin/orders"
                  className="rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted"
                >
                  View customer orders
                </Link>
                <Link
                  href="/admin/products"
                  className="rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted"
                >
                  Manage products & stock
                </Link>
                <Link
                  href="/admin/retailers"
                  className="rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted"
                >
                  Manage retailers & collections
                </Link>
                <Link
                  href="/admin/retailer-orders"
                  className="rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted"
                >
                  Create retailer order
                </Link>
              </div>
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
