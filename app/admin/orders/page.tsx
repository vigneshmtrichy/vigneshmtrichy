'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

const STATUS_FILTERS = [
  'all',
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const

const STATUS_STYLES: Record<string, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  confirmed: 'border-blue-200 bg-blue-50 text-blue-700',
  processing: 'border-violet-200 bg-violet-50 text-violet-700',
  shipped: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  delivered: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  cancelled: 'border-red-200 bg-red-50 text-red-700',
}

const SHIPPING_LABELS: Record<string, string> = {
  not_selected: 'Not Selected',
  shiprocket: 'Shiprocket',
  other_courier: 'Other Courier',
  local_delivery: 'Local Delivery',
  self_pickup: 'Self Pickup',
}

const money = (value: any) =>
  `₹${Number(value || 0).toLocaleString('en-IN')}`

const money2 = (value: any) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const statusLabel = (status?: string) => {
  const value = status || 'pending'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const getStatusStyle = (status?: string) =>
  STATUS_STYLES[status || 'pending'] || STATUS_STYLES.pending

export default function AdminOrdersPage() {
  const searchParams = new URLSearchParams(
  typeof window !== 'undefined' ? window.location.search : ''
)

  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Pagination is applied after search + status filtering so existing
  // order actions continue to work exactly as before.
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null)
  const [openStatusOrderId, setOpenStatusOrderId] = useState<number | null>(null)
  const [openShippingOrderId, setOpenShippingOrderId] = useState<number | null>(null)

  const [updatingOrder, setUpdatingOrder] = useState<number | null>(null)
  const [savingShipping, setSavingShipping] = useState<number | null>(null)
  const [creatingShipment, setCreatingShipment] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadOrders = useCallback(async (showRefreshLoader = false) => {
    if (showRefreshLoader) setRefreshing(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    if (user.email !== 'info@tenoo.in') {
      setIsAdmin(false)
      setLoading(false)
      setRefreshing(false)
      return
    }

    setIsAdmin(true)

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to load orders:', error)
      alert('Failed to load orders. Please try again.')
      setLoading(false)
      setRefreshing(false)
      return
    }

    setOrders(data || [])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Sync the global admin header search with this page's existing search.
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '')
    setCurrentPage(1)
  }, [searchParams])

  const updateOrderStatus = async (
    orderId: number,
    newStatus: string,
  ) => {
    const previousOrder = orders.find((order) => order.id === orderId)
    if (!previousOrder) return

    setUpdatingOrder(orderId)

    const { error } = await supabase
      .from('orders')
      .update({
        order_status: newStatus,
      })
      .eq('id', orderId)

    if (error) {
      console.error('Failed to update order status:', error)
      alert('Failed to update order status. Please try again.')
      setUpdatingOrder(null)
      return
    }

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? { ...order, order_status: newStatus }
          : order,
      ),
    )

    setUpdatingOrder(null)
  }

  const updateLocalOrder = (
    orderId: number,
    patch: Record<string, any>,
  ) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? { ...order, ...patch }
          : order,
      ),
    )
  }

  const saveShipping = async (order: any) => {
    setSavingShipping(order.id)

    const shippingMethod =
      order.shipping_method || 'not_selected'

    const { error } = await supabase
      .from('orders')
      .update({
        shipping_method: shippingMethod,
        courier_name: order.courier_name || null,
        tracking_number: order.tracking_number || null,
      })
      .eq('id', order.id)

    if (error) {
      console.error('Failed to save shipping details:', error)
      alert('Failed to save shipping details. Please try again.')
      setSavingShipping(null)
      return
    }

    updateLocalOrder(order.id, {
      shipping_method: shippingMethod,
      courier_name: order.courier_name || null,
      tracking_number: order.tracking_number || null,
    })

    setSavingShipping(null)
  }

  const createShiprocketOrder = async (order: any) => {
    setCreatingShipment(order.id)

    try {
      /*
       * Keep the existing Shiprocket API flow, but make sure the selected
       * shipping method is persisted before creating the shipment.
       */
      if (order.shipping_method !== 'shiprocket') {
        const { error: shippingError } = await supabase
          .from('orders')
          .update({
            shipping_method: 'shiprocket',
          })
          .eq('id', order.id)

        if (shippingError) {
          console.error(
            'Failed to save Shiprocket shipping method:',
            shippingError,
          )
          alert('Failed to save shipping method. Please try again.')
          return
        }

        updateLocalOrder(order.id, {
          shipping_method: 'shiprocket',
        })
      }

      const response = await fetch(
        '/api/shiprocket/create-order',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: order.id,
          }),
        },
      )

      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.success) {
        console.error(
          'Shiprocket order creation failed:',
          data,
        )
        alert(
          data?.message ||
            'Failed to create Shiprocket order.',
        )
        return
      }

      updateLocalOrder(order.id, {
        shipping_method: 'shiprocket',
        shiprocket_order_id:
          data.data?.order_id || null,
        shiprocket_shipment_id:
          data.data?.shipment_id || null,
        tracking_number:
          data.data?.awb_code ||
          data.data?.tracking_number ||
          order.tracking_number ||
          null,
        courier_name:
          data.data?.courier_name ||
          order.courier_name ||
          null,
      })

      alert('Shiprocket order created successfully.')
    } catch (error) {
      console.error(
        'Shiprocket order creation error:',
        error,
      )
      alert('Unable to create Shiprocket order.')
    } finally {
      setCreatingShipment(null)
    }
  }

  const counts = useMemo(() => {
    const count = (status: string) =>
      orders.filter(
        (order) =>
          (order.order_status || 'pending') === status,
      ).length

    return {
      total: orders.length,
      pending: count('pending'),
      confirmed: count('confirmed'),
      processing: count('processing'),
      shipped: count('shipped'),
      delivered: count('delivered'),
      cancelled: count('cancelled'),
      sales: orders
        .filter(
          (order) =>
            order.order_status !== 'cancelled',
        )
        .reduce(
          (total, order) =>
            total + Number(order.total || 0),
          0,
        ),
    }
  }, [orders])

  const filteredOrders = useMemo(() => {
    const rawQuery = searchQuery.trim().toLowerCase()
    // Allow both "7" and "#7" when searching for an order.
    const query = rawQuery.replace(/^#/, '')

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (order.order_status || 'pending') ===
          statusFilter

      const productSearchText = Array.isArray(order.items)
        ? order.items
            .map((item: any) => String(item?.product_name || ''))
            .join(' ')
            .toLowerCase()
        : ''

      const matchesSearch =
        !query ||
        String(order.id).includes(query) ||
        String(order.customer_name || '')
          .toLowerCase()
          .includes(rawQuery) ||
        String(order.phone || '').includes(rawQuery) ||
        String(order.customer_email || '')
          .toLowerCase()
          .includes(rawQuery) ||
        String(order.tracking_number || '')
          .toLowerCase()
          .includes(rawQuery) ||
        String(order.courier_name || '')
          .toLowerCase()
          .includes(rawQuery) ||
        productSearchText.includes(rawQuery)

      return matchesStatus && matchesSearch
    })
  }, [orders, searchQuery, statusFilter])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / pageSize),
  )

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredOrders.slice(start, start + pageSize)
  }, [filteredOrders, currentPage, pageSize])

  const pageStart =
    filteredOrders.length === 0
      ? 0
      : (currentPage - 1) * pageSize + 1

  const pageEnd = Math.min(
    currentPage * pageSize,
    filteredOrders.length,
  )

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const scrollToOrdersTop = () => {
    document
      .getElementById('orders-results')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const goToPage = (page: number) => {
    const nextPage = Math.min(
      Math.max(page, 1),
      totalPages,
    )
    setCurrentPage(nextPage)

    window.requestAnimationFrame(() => {
      scrollToOrdersTop()
    })
  }

  const clearSearch = () => {
    setSearchQuery('')
    setCurrentPage(1)

    if (searchParams.get('search')) {
      window.history.replaceState({}, '', '/admin/orders')
    }
  }

  const selectStatusFilter = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
    setOpenStatusOrderId(null)
  }

  const changePageSize = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const getCountForFilter = (status: string) => {
    if (status === 'all') return counts.total
    return (counts as Record<string, number>)[status] || 0
  }

  const renderPagination = () => {
    if (filteredOrders.length <= pageSize) return null

    const pages: (number | 'ellipsis')[] = []

    if (totalPages <= 7) {
      for (let page = 1; page <= totalPages; page += 1) {
        pages.push(page)
      }
    } else {
      pages.push(1)

      if (currentPage > 4) {
        pages.push('ellipsis')
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(
        totalPages - 1,
        currentPage + 1,
      )

      for (let page = start; page <= end; page += 1) {
        pages.push(page)
      }

      if (currentPage < totalPages - 3) {
        pages.push('ellipsis')
      }

      pages.push(totalPages)
    }

    return (
      <div className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground sm:text-sm">
            Showing{' '}
            <span className="font-semibold text-foreground">
              {pageStart}-{pageEnd}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-foreground">
              {filteredOrders.length}
            </span>{' '}
            orders
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="mr-1 flex items-center gap-2 text-xs text-muted-foreground">
              Per page
              <select
                value={pageSize}
                onChange={(event) =>
                  changePageSize(Number(event.target.value))
                }
                className="rounded-lg border border-border bg-background px-2.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>

            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              ← Prev
            </button>

            {pages.map((page, index) =>
              page === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1 text-sm text-muted-foreground"
                >
                  …
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  className={`min-w-9 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    currentPage === page
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background text-foreground hover:bg-muted'
                  }`}
                  aria-current={
                    currentPage === page
                      ? 'page'
                      : undefined
                  }
                >
                  {page}
                </button>
              )
            )}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => goToPage(currentPage + 1)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <>
        <SiteHeader />

        <main className="min-h-screen bg-muted/30 px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-7xl animate-pulse space-y-5">
            <div className="h-10 w-72 rounded-xl bg-muted" />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 rounded-2xl bg-card"
                />
              ))}
            </div>

            <div className="h-28 rounded-2xl bg-card" />
            <div className="h-32 rounded-2xl bg-card" />
          </div>
        </main>

        <SiteFooter />
      </>
    )
  }

  if (!isAdmin) {
    return (
      <>
        <SiteHeader />

        <main className="min-h-screen bg-muted/30 px-4 py-20">
          <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-foreground">
              Access Denied
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              You do not have permission to access the admin orders page.
            </p>

            <a
              href="/"
              className="mt-6 inline-flex rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background"
            >
              Back to Home
            </a>
          </div>
        </main>

        <SiteFooter />
      </>
    )
  }

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-muted/30 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">

          {/* PAGE HEADER */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Admin Dashboard
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                TENOO Orders
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Manage customer orders, payments & shipping
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadOrders(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? 'Refreshing...' : '↻ Refresh Orders'}
            </button>
          </div>

          {/* STATS */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ['Total Orders', counts.total, 'all'],
              ['Pending', counts.pending, 'pending'],
              ['Confirmed', counts.confirmed, 'confirmed'],
              ['Processing', counts.processing, 'processing'],
              ['Shipped', counts.shipped, 'shipped'],
              ['Delivered', counts.delivered, 'delivered'],
            ].map(([label, value, filter]) => {
              const active =
                statusFilter === String(filter)

              return (
                <button
                  key={String(label)}
                  type="button"
                  onClick={() =>
                    selectStatusFilter(String(filter))
                  }
                  className={`rounded-2xl border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${
                    active
                      ? 'border-foreground ring-1 ring-foreground/10'
                      : 'border-border'
                  }`}
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

          {/* CANCELLED + SALES */}
          <div className="mt-3 grid gap-3 sm:mt-4 lg:grid-cols-[1fr_2fr]">
            <button
              type="button"
              onClick={() =>
                selectStatusFilter('cancelled')
              }
              className={`rounded-2xl border bg-card p-5 text-left shadow-sm transition hover:shadow-md ${
                statusFilter === 'cancelled'
                  ? 'border-foreground ring-1 ring-foreground/10'
                  : 'border-border'
              }`}
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

          {/* SEARCH + FILTERS */}
          <div className="sticky top-10 z-20 mt-5 rounded-2xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur sm:p-5">
            

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {STATUS_FILTERS.map((status) => {
                const active =
                  statusFilter === status

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      selectStatusFilter(status)
                    }
                    className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition sm:text-sm ${
                      active
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-background text-foreground hover:bg-muted'
                    }`}
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

          {/* ORDER HEADER */}
          <div
            id="orders-results"
            className="scroll-mt-24 mt-7 flex items-end justify-between border-b border-border pb-3 sm:mt-8"
          >
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Orders
              </h2>

              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Newest orders first
              </p>
            </div>

            <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
              {filteredOrders.length}{' '}
              {filteredOrders.length === 1
                ? 'order'
                : 'orders'}
              {filteredOrders.length > pageSize && (
                <span className="ml-1">
                  · Page {currentPage}/{totalPages}
                </span>
              )}
            </span>
          </div>

          {/* ORDER LIST */}
          {filteredOrders.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <div className="text-4xl">⌕</div>

              <p className="mt-3 font-semibold">
                No orders found
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Try another search or status filter.
              </p>

              {(searchQuery || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    clearSearch()
                    selectStatusFilter('all')
                  }}
                  className="mt-5 rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mt-5 space-y-4">
              {paginatedOrders.map((order) => {
                const items = Array.isArray(order.items)
                  ? order.items
                  : []

                const status =
                  order.order_status || 'pending'

                const expanded =
                  expandedOrderId === order.id

                const shippingMethod =
                  order.shipping_method ||
                  'not_selected'

                return (
                  <article
                    key={order.id}
                    className="overflow-visible rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md"
                  >
                    {/* COMPACT ORDER HEADER */}
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-lg font-bold text-foreground">
                              Order #{order.id}
                            </span>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusStyle(
                                status,
                              )}`}
                            >
                              {statusLabel(status)}
                            </span>
                          </div>

                          <p className="mt-1 font-medium text-foreground">
                            {order.customer_name ||
                              'Customer'}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {order.created_at
                              ? new Date(
                                  order.created_at,
                                ).toLocaleString(
                                  'en-IN',
                                )
                              : ''}
                          </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
                          <div className="sm:mr-3 sm:text-right">
                            <p className="text-xs text-muted-foreground">
                              Order Total
                            </p>

                            <p className="text-xl font-bold text-primary">
                              {money(order.total)}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <a
                              href={`/admin/orders/invoice/${order.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted"
                            >
                              Invoice
                            </a>

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedOrderId(
                                  expanded
                                    ? null
                                    : order.id,
                                )
                              }
                              className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90"
                            >
                              {expanded
                                ? 'Hide Details'
                                : 'View Details'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* QUICK ACTIONS */}
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                        {/* STATUS */}
                        <div className="relative">
                          <button
                            type="button"
                            disabled={
                              updatingOrder === order.id
                            }
                            onClick={() =>
                              setOpenStatusOrderId(
                                (current) =>
                                  current === order.id
                                    ? null
                                    : order.id,
                              )
                            }
                            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingOrder === order.id
                              ? 'Updating...'
                              : 'Change Status ▾'}
                          </button>

                          {openStatusOrderId ===
                            order.id && (
                            <div className="absolute left-0 top-full z-50 mt-2 w-48 rounded-xl border border-border bg-card p-1.5 shadow-xl">
                              {STATUS_FILTERS.filter(
                                (value) =>
                                  value !== 'all',
                              ).map(
                                (nextStatus) => (
                                  <button
                                    key={nextStatus}
                                    type="button"
                                    disabled={
                                      updatingOrder ===
                                      order.id
                                    }
                                    onClick={async () => {
                                      await updateOrderStatus(
                                        order.id,
                                        nextStatus,
                                      )
                                      setOpenStatusOrderId(
                                        null,
                                      )
                                    }}
                                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50 ${
                                      status ===
                                      nextStatus
                                        ? 'bg-muted font-semibold'
                                        : ''
                                    }`}
                                  >
                                    {statusLabel(
                                      nextStatus,
                                    )}
                                  </button>
                                ),
                              )}
                            </div>
                          )}
                        </div>

                        {/* WHATSAPP */}
                        {order.phone && (
                          <a
                            href={`https://wa.me/91${String(
                              order.phone,
                            ).replace(
                              /\D/g,
                              '',
                            )}?text=${encodeURIComponent(
                              `Hi ${order.customer_name || ''},

Your TENOO Order #${order.id} has been received.

Products:
${items
  .map(
    (item: any) =>
      `• ${item.product_name} × ${item.quantity}`,
  )
  .join('\n')}

Order Total: ${money(order.total)}

We will confirm your order shortly.

Thank you for choosing TENOO.`,
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                          >
                            WhatsApp Customer
                          </a>
                        )}

                        {/* TRACKING */}
                        {order.tracking_number && (
                          <span className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                            Tracking:{' '}
                            <strong className="text-foreground">
                              {order.tracking_number}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* EXPANDED DETAILS */}
                    {expanded && (
                      <div className="border-t border-border bg-muted/20 p-4 sm:p-5">
                        {/* CUSTOMER + PAYMENT */}
                        <div className="grid gap-4 lg:grid-cols-2">
                          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                              <h3 className="font-semibold">
                                Customer Details
                              </h3>

                              {order.phone && (
                                <a
                                  href={`tel:${order.phone}`}
                                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                                >
                                  Call
                                </a>
                              )}
                            </div>

                            <div className="mt-3 space-y-1.5 text-sm">
                              <p>
                                <span className="text-muted-foreground">
                                  Name:
                                </span>{' '}
                                {order.customer_name ||
                                  '-'}
                              </p>

                              <p>
                                <span className="text-muted-foreground">
                                  Phone:
                                </span>{' '}
                                {order.phone || '-'}
                              </p>

                              {order.customer_email && (
                                <p className="break-all">
                                  <span className="text-muted-foreground">
                                    Email:
                                  </span>{' '}
                                  {
                                    order.customer_email
                                  }
                                </p>
                              )}

                              <p>
                                <span className="text-muted-foreground">
                                  Address:
                                </span>{' '}
                                {order.address || '-'}
                              </p>

                              <p>
                                <span className="text-muted-foreground">
                                  Location:
                                </span>{' '}
                                {order.city || '-'}
                                {order.state
                                  ? `, ${order.state}`
                                  : ''}
                                {order.pincode
                                  ? ` - ${order.pincode}`
                                  : ''}
                              </p>
                            </div>

                            {order.phone && (
                              <a
                                href={`https://wa.me/91${String(
                                  order.phone,
                                ).replace(
                                  /\D/g,
                                  '',
                                )}?text=${encodeURIComponent(
                                  `Hi ${order.customer_name || ''},

Your TENOO Order #${order.id} has been received.

Order Total: ${money(order.total)}

Thank you for choosing TENOO.`,
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-flex rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                              >
                                WhatsApp Customer
                              </a>
                            )}
                          </section>

                          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                            <h3 className="font-semibold">
                              Payment
                            </h3>

                            <div className="mt-3 rounded-xl bg-muted/50 p-4">
                              <div className="flex items-center justify-between gap-4 text-sm">
                                <span className="text-muted-foreground">
                                  Payment Method
                                </span>

                                <strong>
                                  {order.payment_method ||
                                    'WhatsApp'}
                                </strong>
                              </div>

                              <div className="mt-3 flex items-center justify-between gap-4 border-t border-border pt-3 text-sm">
                                <span className="text-muted-foreground">
                                  Order Status
                                </span>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                                    status,
                                  )}`}
                                >
                                  {statusLabel(
                                    status,
                                  )}
                                </span>
                              </div>
                            </div>
                          </section>
                        </div>

                        {/* PRODUCTS */}
                        <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">
                              Products
                            </h3>

                            <span className="text-xs text-muted-foreground">
                              {items.length}{' '}
                              {items.length === 1
                                ? 'item'
                                : 'items'}
                            </span>
                          </div>

                          <div className="mt-3 overflow-hidden rounded-xl border border-border">
                            {items.length === 0 ? (
                              <p className="p-4 text-sm text-muted-foreground">
                                No product details found.
                              </p>
                            ) : (
                              items.map(
                                (
                                  item: any,
                                  index: number,
                                ) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between gap-4 border-b border-border p-3 last:border-b-0 sm:p-4"
                                  >
                                    <div className="min-w-0">
                                      <p className="font-medium">
                                        {
                                          item.product_name
                                        }
                                      </p>

                                      <p className="mt-1 text-xs text-muted-foreground">
                                        Qty{' '}
                                        {
                                          item.quantity
                                        }{' '}
                                        ×{' '}
                                        {money(
                                          item.unit_price,
                                        )}
                                      </p>
                                    </div>

                                    <p className="shrink-0 font-semibold">
                                      {money(
                                        Number(
                                          item.unit_price ||
                                            0,
                                        ) *
                                          Number(
                                            item.quantity ||
                                              0,
                                          ),
                                      )}
                                    </p>
                                  </div>
                                ),
                              )
                            )}
                          </div>
                        </section>

                        {/* ORDER SUMMARY */}
                        <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
                          <h3 className="font-semibold">
                            Order Summary
                          </h3>

                          <div className="mt-4 ml-auto max-w-md space-y-2.5 text-sm">
                            <div className="flex justify-between gap-6">
                              <span>MRP Total</span>
                              <span>
                                {money(
                                  order.mrp_total,
                                )}
                              </span>
                            </div>

                            <div className="flex justify-between gap-6">
                              <span>Product Total</span>
                              <span>
                                {money(
                                  order.product_total,
                                )}
                              </span>
                            </div>

                            <div className="flex justify-between gap-6">
                              <span>Taxable Value</span>
                              <span>
                                {money2(
                                  order.taxable_value,
                                )}
                              </span>
                            </div>

                            {Number(
                              order.cgst || 0,
                            ) > 0 && (
                              <div className="flex justify-between gap-6">
                                <span>CGST</span>
                                <span>
                                  {money2(order.cgst)}
                                </span>
                              </div>
                            )}

                            {Number(
                              order.sgst || 0,
                            ) > 0 && (
                              <div className="flex justify-between gap-6">
                                <span>SGST</span>
                                <span>
                                  {money2(order.sgst)}
                                </span>
                              </div>
                            )}

                            {Number(
                              order.igst || 0,
                            ) > 0 && (
                              <div className="flex justify-between gap-6">
                                <span>IGST</span>
                                <span>
                                  {money2(order.igst)}
                                </span>
                              </div>
                            )}

                            <div className="flex justify-between gap-6">
                              <span>Delivery</span>
                              <span>
                                {money(
                                  order.delivery_charge,
                                )}
                              </span>
                            </div>

                            <div className="flex justify-between gap-6 border-t border-border pt-3 text-base font-bold">
                              <span>Final Total</span>

                              <span className="text-primary">
                                {money(order.total)}
                              </span>
                            </div>
                          </div>
                        </section>

                        {/* SHIPPING */}
                        <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h3 className="font-semibold">
                                Shipping
                              </h3>

                              <p className="mt-1 text-xs text-muted-foreground">
                                Select courier and manage tracking.
                              </p>
                            </div>

                            {order.shiprocket_order_id && (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                Shiprocket Created
                              </span>
                            )}
                          </div>

                          {/* SHIPPING METHOD */}
                          <div className="mt-4">
                            <label className="mb-2 block text-xs font-medium text-muted-foreground">
                              Shipping Method
                            </label>

                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenShippingOrderId(
                                    (current) =>
                                      current ===
                                      order.id
                                        ? null
                                        : order.id,
                                  )
                                }
                                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-left text-sm hover:bg-muted"
                              >
                                <span className="flex items-center justify-between gap-4">
                                  <span>
                                    {SHIPPING_LABELS[
                                      shippingMethod
                                    ] ||
                                      'Not Selected'}
                                  </span>

                                  <span>
                                    ▼
                                  </span>
                                </span>
                              </button>

                              {openShippingOrderId ===
                                order.id && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-border bg-card p-1.5 shadow-xl">
                                  {Object.entries(
                                    SHIPPING_LABELS,
                                  ).map(
                                    ([
                                      value,
                                      label,
                                    ]) => (
                                      <button
                                        key={value}
                                        type="button"
                                        onClick={() => {
                                          updateLocalOrder(
                                            order.id,
                                            {
                                              shipping_method:
                                                value,
                                            },
                                          )

                                          setOpenShippingOrderId(
                                            null,
                                          )
                                        }}
                                        className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted ${
                                          shippingMethod ===
                                          value
                                            ? 'bg-muted font-semibold'
                                            : ''
                                        }`}
                                      >
                                        {label}
                                      </button>
                                    ),
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* OTHER COURIER */}
                          {shippingMethod ===
                            'other_courier' && (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                                  Courier Name
                                </label>

                                <input
                                  type="text"
                                  value={
                                    order.courier_name ||
                                    ''
                                  }
                                  onChange={(event) =>
                                    updateLocalOrder(
                                      order.id,
                                      {
                                        courier_name:
                                          event.target
                                            .value,
                                      },
                                    )
                                  }
                                  placeholder="e.g. DTDC, Blue Dart"
                                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                />
                              </div>

                              <div>
                                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                                  Tracking Number
                                </label>

                                <input
                                  type="text"
                                  value={
                                    order.tracking_number ||
                                    ''
                                  }
                                  onChange={(event) =>
                                    updateLocalOrder(
                                      order.id,
                                      {
                                        tracking_number:
                                          event.target
                                            .value,
                                      },
                                    )
                                  }
                                  placeholder="Enter tracking number"
                                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                />
                              </div>
                            </div>
                          )}

                          {/* SHIPROCKET */}
                          {shippingMethod ===
                            'shiprocket' && (
                            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
                              <p className="text-sm font-medium">
                                Shiprocket
                              </p>

                              {order.shiprocket_order_id ? (
                                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                                  <p>
                                    Shiprocket Order ID:{' '}
                                    <span className="font-medium text-foreground">
                                      {
                                        order.shiprocket_order_id
                                      }
                                    </span>
                                  </p>

                                  {order.shiprocket_shipment_id && (
                                    <p>
                                      Shipment ID:{' '}
                                      <span className="font-medium text-foreground">
                                        {
                                          order.shiprocket_shipment_id
                                        }
                                      </span>
                                    </p>
                                  )}

                                  {order.tracking_number && (
                                    <p>
                                      Tracking / AWB:{' '}
                                      <span className="font-medium text-foreground">
                                        {
                                          order.tracking_number
                                        }
                                      </span>
                                    </p>
                                  )}

                                  {order.courier_name && (
                                    <p>
                                      Courier:{' '}
                                      <span className="font-medium text-foreground">
                                        {
                                          order.courier_name
                                        }
                                      </span>
                                    </p>
                                  )}

                                  <p className="pt-1 text-xs">
                                    Shiprocket order already created.
                                  </p>
                                </div>
                              ) : (
                                <div className="mt-3">
                                  <button
                                    type="button"
                                    disabled={
                                      creatingShipment ===
                                      order.id
                                    }
                                    onClick={() =>
                                      createShiprocketOrder(
                                        order,
                                      )
                                    }
                                    className="w-full rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                  >
                                    {creatingShipment ===
                                    order.id
                                      ? 'Creating Shiprocket Order...'
                                      : 'Create Shiprocket Order'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* SAVE SHIPPING */}
                          {!(
                            shippingMethod ===
                              'shiprocket' &&
                            order.shiprocket_order_id
                          ) && (
                            <button
                              type="button"
                              disabled={
                                savingShipping ===
                                order.id
                              }
                              onClick={() =>
                                saveShipping(order)
                              }
                              className="mt-4 w-full rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                              {savingShipping ===
                              order.id
                                ? 'Saving...'
                                : 'Save Shipping Details'}
                            </button>
                          )}
                        </section>

                        {/* INVOICE */}
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                          <a
                            href={`/admin/orders/invoice/${order.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl border border-border bg-background px-4 py-2.5 text-center text-sm font-medium hover:bg-muted"
                          >
                            Open Full Invoice →
                          </a>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedOrderId(null)
                            }
                            className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90"
                          >
                            Hide Details ▲
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
              </div>

              {renderPagination()}
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
