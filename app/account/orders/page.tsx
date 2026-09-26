'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { WHATSAPP_URL, getProductBySlug } from '@/lib/site'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

type OrderItem = {
  product_name?: string
  name?: string
  product_slug?: string
  quantity?: number
  unit_price?: number
  price?: number
  image?: string
  product?: {
    name?: string
    price?: number
  }
}

type Order = {
  id: number
  customer_name: string
  items: OrderItem[]
  product_total: number
  delivery_charge: number
  total: number
  order_status: string
  created_at: string
  tracking_number: string | null
  courier_name: string | null
  shipping_method: string | null
}

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

const STATUS_META: Record<
  string,
  {
    label: string
    className: string
    icon: string
    message: string
  }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800',
    icon: '⏳',
    message: "We're reviewing your order",
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-blue-100 text-blue-800',
    icon: '✓',
    message: 'Your order has been confirmed',
  },
  processing: {
    label: 'Processing',
    className: 'bg-purple-100 text-purple-800',
    icon: '⚙️',
    message: "We're preparing your order",
  },
  shipped: {
    label: 'Shipped',
    className: 'bg-orange-100 text-orange-800',
    icon: '🚚',
    message: 'Your order is on the way',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-green-100 text-green-800',
    icon: '✓',
    message: 'Your order has been delivered',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800',
    icon: '×',
    message: 'This order has been cancelled',
  },
}

function getStatusMeta(status: string) {
  return (
    STATUS_META[status.toLowerCase()] || {
      label: status,
      className: 'bg-muted text-foreground',
      icon: '•',
      message: 'Your order status has been updated',
    }
  )
}

function getStatusStep(status: string) {
  return STATUS_STEPS.indexOf(status.toLowerCase())
}

function getItemName(item: OrderItem) {
  return item.product_name || item.name || item.product?.name || 'Product'
}

function getItemPrice(item: OrderItem) {
  return Number(item.unit_price || item.price || item.product?.price || 0)
}

function getItemTotal(item: OrderItem) {
  return getItemPrice(item) * Number(item.quantity || 0)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getQuantity(items: OrderItem[]) {
  return Array.isArray(items)
    ? items.reduce((total, item) => total + Number(item.quantity || 0), 0)
    : 0
}

function getEstimatedDelivery(order: Order) {
  const created = new Date(order.created_at)
  const daysToAdd =
    order.order_status.toLowerCase() === 'shipped'
      ? 3
      : order.order_status.toLowerCase() === 'processing'
        ? 5
        : 6

  const start = new Date(created)
  start.setDate(start.getDate() + Math.max(daysToAdd - 1, 1))

  const end = new Date(created)
  end.setDate(end.getDate() + daysToAdd + 1)

  return `${start.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  })} – ${end.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  })}`
}

function getDeliveredDate(order: Order) {
  const delivered = new Date(order.created_at)
  delivered.setDate(delivered.getDate() + 4)
  return delivered.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function MyOrdersPage() {
  const router = useRouter()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [animateProgress, setAnimateProgress] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({})
  const [copiedTracking, setCopiedTracking] = useState<number | null>(null)

  useEffect(() => {
    const loadOrders = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          customer_name,
          items,
          product_total,
          delivery_charge,
          total,
          order_status,
          created_at,
          tracking_number,
          courier_name,
          shipping_method
        `,
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load orders:', error)
      } else {
        setOrders(data || [])
      }

      setLoading(false)

      requestAnimationFrame(() => {
        setAnimateProgress(true)
      })
    }

    loadOrders()
  }, [router])

  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.order_status.toLowerCase() === 'pending').length,
      processing: orders.filter((o) => o.order_status.toLowerCase() === 'processing').length,
      shipped: orders.filter((o) => o.order_status.toLowerCase() === 'shipped').length,
      delivered: orders.filter((o) => o.order_status.toLowerCase() === 'delivered').length,
    }
  }, [orders])

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase()

    return orders.filter((order) => {
      const status = order.order_status.toLowerCase()

      const matchesFilter = filter === 'all' || status === filter

      const productText = Array.isArray(order.items)
        ? order.items.map(getItemName).join(' ').toLowerCase()
        : ''

      const matchesSearch =
        !query ||
        String(order.id).includes(query) ||
        `order #${order.id}`.includes(query) ||
        productText.includes(query) ||
        (order.tracking_number || '').toLowerCase().includes(query)

      return matchesFilter && matchesSearch
    })
  }, [orders, filter, search])

  const toggleOrder = (id: number) => {
    setExpandedOrders((current) => ({
      ...current,
      [id]: !(current[id] ?? true),
    }))
  }

  const copyTracking = async (order: Order) => {
    if (!order.tracking_number) return

    try {
      await navigator.clipboard.writeText(order.tracking_number)
      setCopiedTracking(order.id)

      window.setTimeout(() => {
        setCopiedTracking((current) => (current === order.id ? null : current))
      }, 1800)
    } catch {
      // Clipboard may be unavailable in some browsers.
    }
  }

  const handleBuyAgain = (order: Order) => {
    // The current project does not expose the cart API/store in this page.
    // Send the customer to Products rather than pretending the cart was updated.
    router.push('/products')
  }

  const openWhatsApp = (order: Order, message: string) => {
    window.open(
      `${WHATSAPP_URL}?text=${encodeURIComponent(
        `Hi TENOO, I need help with order #${order.id}. ${message}`,
      )}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="animate-pulse space-y-5">
              <div className="h-10 w-48 rounded-xl bg-muted" />
              <div className="h-5 w-80 rounded bg-muted" />
              <div className="h-12 rounded-xl bg-muted" />
              <div className="h-64 rounded-2xl bg-muted" />
              <div className="h-64 rounded-2xl bg-muted" />
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    )
  }

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-background px-3 py-6 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-5xl">
          {/* PAGE HEADER */}
          <div className="mb-5 sm:mb-7">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">
              My Orders
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground sm:mt-2 sm:text-base">
              View your order history and delivery details.
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-2xl border bg-background p-10 text-center shadow-sm">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">
                🛍️
              </div>

              <h2 className="text-xl font-semibold">No orders yet</h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Your Tenoo orders will appear here after you place your first order.
              </p>

              <Link
                href="/products"
                className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                Explore Products
              </Link>
            </div>
          ) : (
            <>
              {/* SEARCH */}
              <div className="mb-3 sm:mb-4">
                <label className="relative block">
                  <span className="sr-only">Search orders</span>
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
                    🔍
                  </span>

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by order number, product or tracking number..."
                    className="h-11 w-full rounded-xl border bg-background pl-11 pr-4 text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 sm:h-12 sm:text-sm"
                  />
                </label>
              </div>

              {/* FILTERS */}
              <div className="mb-5 flex gap-2 overflow-x-auto pb-1 sm:mb-7">
                {[
                  ['all', 'All', counts.all],
                  ['pending', 'Pending', counts.pending],
                  ['processing', 'Processing', counts.processing],
                  ['shipped', 'Shipped', counts.shipped],
                  ['delivered', 'Delivered', counts.delivered],
                ].map(([value, label, count]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(String(value))}
                    className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition sm:px-4 sm:py-2 sm:text-sm ${
                      filter === value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {label} <span className="ml-1 opacity-80">({count})</span>
                  </button>
                ))}
              </div>

              {filteredOrders.length === 0 ? (
                <div className="rounded-2xl border bg-background p-10 text-center shadow-sm">
                  <div className="text-3xl">🔎</div>
                  <h2 className="mt-3 text-lg font-semibold">No matching orders</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try another search term or change the filter.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch('')
                      setFilter('all')
                    }}
                    className="mt-5 rounded-xl border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {filteredOrders.map((order) => {
                    const status = order.order_status.toLowerCase()
                    const meta = getStatusMeta(status)
                    const currentStep = getStatusStep(status)
                    const isExpanded = expandedOrders[order.id] ?? true
                    const quantity = getQuantity(order.items || [])

                    return (
                      <article
                        key={order.id}
                        className="overflow-hidden rounded-2xl border bg-background shadow-sm transition-shadow hover:shadow-md"
                      >
                        {/* ORDER HEADER */}
                        <div className="p-4 sm:p-6">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-base font-semibold sm:text-lg">
                                  Order #{order.id}
                                </h2>

                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs ${meta.className}`}
                                >
                                  <span>{meta.icon}</span>
                                  {meta.label}
                                </span>
                              </div>

                              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                                Placed on {formatDate(order.created_at)}
                              </p>

                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:mt-2 sm:gap-2 sm:text-sm">
                                <span>
                                  {quantity} {quantity === 1 ? 'item' : 'items'}
                                </span>
                                <span>•</span>
                                <span className="font-semibold text-foreground">
                                  ₹{Number(order.total).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleOrder(order.id)}
                              className="inline-flex w-fit items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition hover:bg-muted sm:gap-2 sm:px-4 sm:text-sm"
                            >
                              {isExpanded ? 'Hide Details' : 'View Details'}
                              <span>{isExpanded ? '↑' : '↓'}</span>
                            </button>
                          </div>

                          {/* PROGRESS */}
                          {status !== 'cancelled' && (
                            <div className="mt-5 sm:mt-7">
                              <div className="w-full">
                                <div className="flex items-start">
                                  {STATUS_STEPS.map((step, index) => {
                                    const isCompleted = index <= currentStep
                                    const isCurrent = index === currentStep

                                    return (
                                      <div
                                        key={step}
                                        className="flex min-w-0 flex-1 items-start"
                                      >
                                        <div className="flex min-w-0 flex-1 flex-col items-center">
                                          <div
                                            className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold transition sm:h-9 sm:w-9 sm:text-xs ${
                                              isCompleted
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground'
                                            } ${
                                              isCurrent
                                                ? 'ring-4 ring-primary/10'
                                                : ''
                                            }`}
                                          >
                                            {isCompleted && index < currentStep
                                              ? '✓'
                                              : index + 1}
                                          </div>

                                          <span
                                            className={`mt-1.5 text-center text-[9px] capitalize leading-tight sm:mt-2 sm:text-xs ${
                                              isCompleted
                                                ? 'font-medium text-foreground'
                                                : 'text-muted-foreground'
                                            }`}
                                          >
                                            {step}
                                          </span>
                                        </div>

                                        {index < STATUS_STEPS.length - 1 && (
                                          <div className="relative mt-4 h-0.5 min-w-[8px] flex-1 overflow-hidden bg-border sm:mt-[17px]">
                                            {index < currentStep && (
                                              <div
                                                className={`absolute inset-y-0 left-0 w-full bg-primary ${
                                                  animateProgress
                                                    ? 'animate-[progressLine_1.2s_ease-out_forwards]'
                                                    : ''
                                                }`}
                                              />
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>

                              <div className="mt-3 rounded-xl bg-muted/50 px-3 py-2.5 text-center sm:mt-4 sm:px-4 sm:py-3">
                                <p className="text-xs font-medium sm:text-sm">
                                  {meta.message}
                                </p>

                                {status === 'shipped' && (
                                  <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
                                    Expected delivery: {getEstimatedDelivery(order)}
                                  </p>
                                )}

                                {status === 'processing' && (
                                  <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
                                    Estimated delivery: {getEstimatedDelivery(order)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {status === 'cancelled' && (
                            <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
                              This order has been cancelled.
                            </div>
                          )}
                        </div>

                        {isExpanded && (
                          <>
                            {/* TRACKING — shown before products for shipped orders */}
                            {status === 'shipped' && order.tracking_number && (
                              <div className="mx-5 mb-5 rounded-2xl border bg-muted/30 p-4 sm:mx-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="font-semibold">
                                      🚚 Your order is on the way
                                    </p>

                                    {order.courier_name && (
                                      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                                        Courier: {order.courier_name}
                                      </p>
                                    )}

                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                                      <span className="text-muted-foreground">
                                        Tracking:
                                      </span>

                                      <span className="font-semibold">
                                        {order.tracking_number}
                                      </span>

                                      <button
                                        type="button"
                                        onClick={() => copyTracking(order)}
                                        className="rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-background"
                                      >
                                        {copiedTracking === order.id
                                          ? 'Copied ✓'
                                          : 'Copy'}
                                      </button>
                                    </div>
                                  </div>

                                  <a
                                    href="https://nageen-order-track.shiprocket.co/tracking"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 sm:w-auto"
                                  >
                                    Track Shipment →
                                  </a>
                                </div>
                              </div>
                            )}

                            {/* PRODUCTS */}
                            <div className="border-t px-4 py-4 sm:px-6 sm:py-5">
                              <div className="space-y-4">
                                {Array.isArray(order.items) &&
                                  order.items.map((item, index) => (
                                    <div
                                      key={`${order.id}-${index}`}
                                      className="flex items-center justify-between gap-4"
                                    >
                                      <div className="flex min-w-0 items-center gap-3">
                                        {item.image ? (
                                          <Link
                                            href={
                                              item.product_slug
                                                ? `/products/${item.product_slug}`
                                                : '/products'
                                            }
                                            className="shrink-0"
                                          >
                                            <img
  src={
    item.product_slug
      ? getProductBySlug(item.product_slug)?.image || item.image || ''
      : item.image || ''
  }
  alt={getItemName(item)}
  className="h-16 w-16 rounded-xl border bg-white object-contain transition-transform hover:scale-105"
/>
                                          </Link>
                                        ) : (
                                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border bg-muted text-xl">
                                            🛍️
                                          </div>
                                        )}

                                        <div className="min-w-0">
                                          {item.product_slug ? (
                                            <Link
                                              href={`/products/${item.product_slug}`}
                                              className="line-clamp-2 text-sm font-medium hover:text-primary hover:underline sm:text-base"
                                            >
                                              {getItemName(item)}
                                            </Link>
                                          ) : (
                                            <p className="line-clamp-2 text-sm font-medium sm:text-base">
                                              {getItemName(item)}
                                            </p>
                                          )}

                                          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                                            Qty: {item.quantity}
                                          </p>
                                        </div>
                                      </div>

                                      <p className="shrink-0 text-sm font-semibold sm:text-base">
                                        ₹{getItemTotal(item).toLocaleString('en-IN')}
                                      </p>
                                    </div>
                                  ))}
                              </div>
                            </div>

                            {/* PRICE SUMMARY */}
                            <div className="border-t px-4 py-4 sm:px-6 sm:py-5">
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    Product Total
                                  </span>
                                  <span>
                                    ₹{Number(order.product_total).toLocaleString('en-IN')}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    Delivery
                                  </span>
                                  <span>
                                    {Number(order.delivery_charge) === 0
                                      ? 'FREE'
                                      : `₹${Number(order.delivery_charge).toLocaleString(
                                          'en-IN',
                                        )}`}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between border-t pt-3">
                                  <span className="font-semibold">Total</span>
                                  <span className="text-xl font-semibold text-primary">
                                    ₹{Number(order.total).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>

                              {/* ACTIONS */}
                              <div className="mt-4 grid grid-cols-1 gap-2 sm:mt-5 sm:flex sm:flex-row sm:justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    router.push(
                                      `/account/orders/invoice/${order.id}`,
                                    )
                                  }
                                  className="w-full rounded-xl border px-5 py-2.5 text-sm font-semibold transition hover:bg-muted sm:w-auto"
                                >
                                  View Invoice
                                </button>

                                {status === 'delivered' && (
                                  <button
                                    type="button"
                                    onClick={() => handleBuyAgain(order)}
                                    className="w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 sm:w-auto"
                                  >
                                    🛒 Buy Again
                                  </button>
                                )}

                                {status === 'delivered' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openWhatsApp(
                                        order,
                                        'I would like to share feedback about my delivered order.',
                                      )
                                    }
                                    className="w-full rounded-xl border border-green-600 px-5 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-50 sm:w-auto"
                                  >
                                    ⭐ Give Feedback
                                  </button>
                                )}

                                {status === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openWhatsApp(
                                        order,
                                        'I would like to request cancellation of this order.',
                                      )
                                    }
                                    className="w-full rounded-xl border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 sm:w-auto"
                                  >
                                    Cancel Request
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    openWhatsApp(
                                      order,
                                      'I need help with this order.',
                                    )
                                  }
                                  className="rounded-xl border border-green-600 px-5 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-50"
                                >
                                  WhatsApp Help
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </article>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
