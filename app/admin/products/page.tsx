'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  EyeOff,
  CircleAlert,
  AlertTriangle,
  Search,
  Settings2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ALL_PRODUCTS } from '@/lib/site'
import { SiteHeader } from '@/components/site-header'

type ProductStatus =
  | 'active'
  | 'hidden'
  | 'coming-soon'
  | 'out-of-stock'

type StatusFilter = 'all' | ProductStatus

const LOW_STOCK_THRESHOLD = 5

const STATUS_OPTIONS: Array<{ value: ProductStatus; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'coming-soon', label: 'Coming Soon' },
  { value: 'out-of-stock', label: 'Out of Stock' },
  { value: 'hidden', label: 'Hidden' },
]

const STATUS_STYLES: Record<ProductStatus, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  'coming-soon': 'bg-amber-50 text-amber-700 border-amber-200',
  'out-of-stock': 'bg-red-50 text-red-700 border-red-200',
  hidden: 'bg-gray-100 text-gray-600 border-gray-200',
}

function getStatusLabel(status: ProductStatus) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label || status
}

function StatusIcon({ status }: { status: ProductStatus }) {
  if (status === 'active') return <CheckCircle2 className="h-3.5 w-3.5" />
  if (status === 'coming-soon') return <Clock3 className="h-3.5 w-3.5" />
  if (status === 'out-of-stock') return <CircleAlert className="h-3.5 w-3.5" />
  return <EyeOff className="h-3.5 w-3.5" />
}

export default function AdminProductsPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [statuses, setStatuses] = useState<Record<string, ProductStatus>>({})
  const [stockQuantities, setStockQuantities] = useState<Record<string, number | null>>({})
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({})
  const [productImages, setProductImages] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let mounted = true

    const applyAccess = (user: { email?: string } | null) => {
      if (!mounted) return

      const authorized = user?.email === 'info@tenoo.in'
      setIsAdmin(authorized)
      setAuthChecked(true)

      if (authorized) {
        setLoading(true)
        void loadStatuses()
      } else {
        setLoading(false)
        setStatuses({})
        setStockQuantities({})
        setDisplayNames({})
        setProductImages({})
      }
    }

    void supabase.auth.getUser().then(({ data: { user } }) => {
      applyAccess(user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        applyAccess(session?.user ?? null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function loadStatuses() {
    try {
      const { data, error } = await supabase
        .from('product_status')
        .select('product_slug, status, stock_quantity, display_name, image_url, image_urls')

      if (error) {
        console.error('Failed to load product statuses:', error)
        setMessage('Unable to load product statuses.')
        return
      }

      const statusMap: Record<string, ProductStatus> = {}
      const stockMap: Record<string, number | null> = {}
      const nameMap: Record<string, string> = {}
      const imageMap: Record<string, string> = {}

      data?.forEach((item) => {
        statusMap[item.product_slug] = item.status as ProductStatus
        stockMap[item.product_slug] =
          item.stock_quantity === null ? null : Number(item.stock_quantity)
        if (item.display_name) {
          nameMap[item.product_slug] = String(item.display_name)
        }
        const imageUrl =
          item.image_url ||
          (Array.isArray(item.image_urls) ? item.image_urls[0] : null)
        if (imageUrl) {
          imageMap[item.product_slug] = String(imageUrl)
        }
      })

      setStatuses(statusMap)
      setStockQuantities(stockMap)
      setDisplayNames(nameMap)
      setProductImages(imageMap)
    } catch (error) {
      console.error('Failed to load product statuses:', error)
      setMessage('Unable to load product statuses.')
    } finally {
      setLoading(false)
    }
  }

  const productData = useMemo(() => {
    return ALL_PRODUCTS.map((product) => ({
      ...product,
      name: displayNames[product.slug] || product.name,
      status: statuses[product.slug] || 'active',
      stockQuantity: stockQuantities[product.slug] ?? null,
    }))
  }, [statuses, stockQuantities])

  const lowStockProducts = productData.filter(
    (product) =>
      product.stockQuantity !== null &&
      product.stockQuantity > 0 &&
      product.stockQuantity <= LOW_STOCK_THRESHOLD,
  )

  const untrackedStockCount = productData.filter(
    (product) => product.stockQuantity === null,
  ).length

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()

    return productData.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.slug.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'all' || product.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [productData, search, statusFilter])

  const totalProducts = productData.length
  const activeCount = productData.filter((product) => product.status === 'active').length
  const comingSoonCount = productData.filter((product) => product.status === 'coming-soon').length
  const hiddenCount = productData.filter((product) => product.status === 'hidden').length
  const outOfStockCount = productData.filter((product) => product.status === 'out-of-stock').length

  if (!authChecked || (isAdmin && loading)) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen bg-background">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="h-9 w-48 animate-pulse rounded-xl bg-muted" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
            <div className="mt-8 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          </div>
        </main>
      </>
    )
  }

  if (!isAdmin) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen bg-background px-4 py-16">
          <section className="mx-auto max-w-xl rounded-2xl border bg-background p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold">Admin access only</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Sign in with the admin account to manage products.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Back to store
            </Link>
          </section>
        </main>
      </>
    )
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Product overview, availability and inventory status.
              </p>
            </div>

            <Link
              href="/admin/products/settings"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Settings2 className="h-4 w-4" />
              Product Settings
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={
                'rounded-2xl border p-4 text-left transition hover:shadow-sm ' +
                (statusFilter === 'all'
                  ? 'border-primary bg-primary/5'
                  : 'bg-background')
              }
            >
              <span className="text-sm text-muted-foreground">Total Products</span>
              <p className="mt-2 text-2xl font-semibold">{totalProducts}</p>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={
                'rounded-2xl border p-4 text-left transition hover:shadow-sm ' +
                (statusFilter === 'active'
                  ? 'border-green-300 bg-green-50'
                  : 'bg-background')
              }
            >
              <span className="text-sm text-muted-foreground">Active</span>
              <p className="mt-2 text-2xl font-semibold text-green-700">{activeCount}</p>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('coming-soon')}
              className={
                'rounded-2xl border p-4 text-left transition hover:shadow-sm ' +
                (statusFilter === 'coming-soon'
                  ? 'border-amber-300 bg-amber-50'
                  : 'bg-background')
              }
            >
              <span className="text-sm text-muted-foreground">Coming Soon</span>
              <p className="mt-2 text-2xl font-semibold text-amber-700">{comingSoonCount}</p>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('hidden')}
              className={
                'rounded-2xl border p-4 text-left transition hover:shadow-sm ' +
                (statusFilter === 'hidden'
                  ? 'border-gray-300 bg-gray-100'
                  : 'bg-background')
              }
            >
              <span className="text-sm text-muted-foreground">Hidden</span>
              <p className="mt-2 text-2xl font-semibold text-gray-600">{hiddenCount}</p>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('out-of-stock')}
              className={
                'rounded-2xl border p-4 text-left transition hover:shadow-sm ' +
                (statusFilter === 'out-of-stock'
                  ? 'border-red-300 bg-red-50'
                  : 'bg-background')
              }
            >
              <span className="text-sm text-muted-foreground">Out of Stock</span>
              <p className="mt-2 text-2xl font-semibold text-red-700">{outOfStockCount}</p>
            </button>
          </div>

          {lowStockProducts.length > 0 && (
            <div
              role="alert"
              className="mt-6 flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">
                  Low stock: {lowStockProducts.length} product{lowStockProducts.length === 1 ? '' : 's'}
                </p>
                <p className="mt-1 text-sm">
                  {lowStockProducts
                    .map(
                      (product) =>
                        product.name + ' (' + product.stockQuantity + ' left)',
                    )
                    .join(', ')}
                </p>
              </div>
            </div>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            Low stock alert threshold: {LOW_STOCK_THRESHOLD}. Inventory has not been set for {untrackedStockCount} product{untrackedStockCount === 1 ? '' : 's'}.
          </p>

          <div className="mt-4 rounded-2xl border bg-background p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="h-12 w-full rounded-xl border bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="h-12 rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 sm:w-52"
              >
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {message && (
            <div className="mt-4 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
              {message}
            </div>
          )}

          <div className="mt-6 space-y-3">
            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl border bg-background p-10 text-center">
                <h2 className="font-semibold">No products found</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a different search or status filter.
                </p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.slug}
                  className={
                    'rounded-2xl border bg-background p-4 shadow-sm transition hover:shadow-md sm:p-5 ' +
                    (product.status === 'hidden' ? 'opacity-70' : '')
                  }
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-muted sm:h-20 sm:w-20">
                        <img
                          src={productImages[product.slug] || '/placeholder.svg'}
                          alt={product.name}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold sm:text-lg">
                            {product.name}
                          </h2>
                          <span
                            className={
                              'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ' +
                              STATUS_STYLES[product.status]
                            }
                          >
                            <StatusIcon status={product.status} />
                            {getStatusLabel(product.status)}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {product.packSize || product.slug}
                          {product.stockQuantity !== null
                            ? ' · ' + product.stockQuantity + ' in stock'
                            : ' · Stock not set'}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={
                        '/admin/products/settings?product=' +
                        encodeURIComponent(product.slug)
                      }
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 ease-out hover:scale-[1.03] hover:shadow-md active:scale-[0.99]"
                    >
                      Manage Settings
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  )
}
