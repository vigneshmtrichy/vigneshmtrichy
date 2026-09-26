'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ALL_PRODUCTS } from '@/lib/site'
import { SiteHeader } from '@/components/site-header'
import {
  Package,
  CheckCircle2,
  Clock3,
  EyeOff,
  CircleAlert,
  Search,
} from 'lucide-react'

type ProductStatus =
  | 'active'
  | 'hidden'
  | 'coming-soon'
  | 'out-of-stock'

type StatusFilter = 'all' | ProductStatus

const STATUS_OPTIONS: {
  value: ProductStatus
  label: string
}[] = [
  {
    value: 'active',
    label: 'Active',
  },
  {
    value: 'coming-soon',
    label: 'Coming Soon',
  },
  {
    value: 'out-of-stock',
    label: 'Out of Stock',
  },
  {
    value: 'hidden',
    label: 'Hidden',
  },
]

const STATUS_STYLES: Record<
  ProductStatus,
  string
> = {
  active:
    'bg-green-50 text-green-700 border-green-200',
  'coming-soon':
    'bg-amber-50 text-amber-700 border-amber-200',
  'out-of-stock':
    'bg-red-50 text-red-700 border-red-200',
  hidden:
    'bg-gray-100 text-gray-600 border-gray-200',
}

function getStatusLabel(status: ProductStatus) {
  return (
    STATUS_OPTIONS.find(
      (option) => option.value === status,
    )?.label || status
  )
}

function StatusIcon({
  status,
}: {
  status: ProductStatus
}) {
  if (status === 'active') {
    return <CheckCircle2 className="h-3.5 w-3.5" />
  }

  if (status === 'coming-soon') {
    return <Clock3 className="h-3.5 w-3.5" />
  }

  if (status === 'out-of-stock') {
    return <CircleAlert className="h-3.5 w-3.5" />
  }

  return <EyeOff className="h-3.5 w-3.5" />
}

export default function AdminProductsPage() {
  const [statuses, setStatuses] = useState<
    Record<string, ProductStatus>
  >({})

  const [savingSlug, setSavingSlug] = useState<
    string | null
  >(null)

  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('all')

  const [message, setMessage] = useState('')

  useEffect(() => {
    loadStatuses()
  }, [])

  async function loadStatuses() {
    try {
      const { data, error } = await supabase
        .from('product_status')
        .select('product_slug, status')

      if (error) {
        console.error(
          'Failed to load product statuses:',
          error,
        )
        setMessage('Unable to load product statuses.')
        return
      }

      const statusMap: Record<
        string,
        ProductStatus
      > = {}

      data?.forEach((item) => {
        statusMap[item.product_slug] =
          item.status as ProductStatus
      })

      setStatuses(statusMap)
    } catch (error) {
      console.error(
        'Failed to load product statuses:',
        error,
      )

      setMessage('Unable to load product statuses.')
    } finally {
      setLoading(false)
    }
  }

 async function saveStatus(
  productSlug: string,
  status: ProductStatus,
) {
  try {
    setSavingSlug(productSlug)
    setMessage('')

    const { error } = await supabase
      .from('product_status')
      .upsert(
        {
          product_slug: productSlug,
          status,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'product_slug',
        },
      )

    if (error) {
      console.error('Failed to save product status:', error)
      setMessage(`Failed to save product status: ${error.message}`)
      return
    }

    setStatuses((current) => ({
      ...current,
      [productSlug]: status,
    }))
  } catch (error) {
    console.error('Failed to save product status:', error)
    setMessage('Failed to save product status.')
  } finally {
    setSavingSlug(null)
  }
}
  const productData = useMemo(() => {
    return ALL_PRODUCTS.map((product) => ({
      ...product,
      status:
        statuses[product.slug] || 'active',
    }))
  }, [statuses])

  const filteredProducts = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase()

    return productData.filter((product) => {
      const matchesSearch =
        !query ||
        product.name
          .toLowerCase()
          .includes(query) ||
        product.slug
          .toLowerCase()
          .includes(query)

      const matchesStatus =
        statusFilter === 'all' ||
        product.status === statusFilter

      return (
        matchesSearch &&
        matchesStatus
      )
    })
  }, [
    productData,
    search,
    statusFilter,
  ])

  const totalProducts =
    productData.length

  const activeCount =
    productData.filter(
      (product) =>
        product.status === 'active',
    ).length

  const comingSoonCount =
    productData.filter(
      (product) =>
        product.status ===
        'coming-soon',
    ).length

  const hiddenCount =
    productData.filter(
      (product) =>
        product.status === 'hidden',
    ).length

  const outOfStockCount =
    productData.filter(
      (product) =>
        product.status ===
        'out-of-stock',
    ).length

  if (loading) {
    return (
      <>
        <SiteHeader />

        <main className="min-h-screen bg-background">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="h-9 w-48 animate-pulse rounded-xl bg-muted" />

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 5 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-2xl bg-muted"
                  />
                ),
              )}
            </div>

            <div className="mt-8 space-y-4">
              {Array.from({ length: 4 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-32 animate-pulse rounded-2xl bg-muted"
                  />
                ),
              )}
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

          {/* HEADER */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Products
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Manage product availability and visibility.
              </p>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing{' '}
              <span className="font-semibold text-foreground">
                {filteredProducts.length}
              </span>{' '}
              of {totalProducts} products
            </div>
          </div>

          {/* SUMMARY CARDS */}
          <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">

            <button
              type="button"
              onClick={() =>
                setStatusFilter('all')
              }
              className={`rounded-2xl border p-4 text-left transition hover:shadow-sm ${
                statusFilter === 'all'
                  ? 'border-primary bg-primary/5'
                  : 'bg-background'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Products
                </span>

                <Package className="h-4 w-4 text-muted-foreground" />
              </div>

              <p className="mt-2 text-2xl font-semibold">
                {totalProducts}
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter('active')
              }
              className={`rounded-2xl border p-4 text-left transition hover:shadow-sm ${
                statusFilter === 'active'
                  ? 'border-green-300 bg-green-50'
                  : 'bg-background'
              }`}
            >
              <span className="text-sm text-muted-foreground">
                Active
              </span>

              <p className="mt-2 text-2xl font-semibold text-green-700">
                {activeCount}
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  'coming-soon',
                )
              }
              className={`rounded-2xl border p-4 text-left transition hover:shadow-sm ${
                statusFilter ===
                'coming-soon'
                  ? 'border-amber-300 bg-amber-50'
                  : 'bg-background'
              }`}
            >
              <span className="text-sm text-muted-foreground">
                Coming Soon
              </span>

              <p className="mt-2 text-2xl font-semibold text-amber-700">
                {comingSoonCount}
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter('hidden')
              }
              className={`rounded-2xl border p-4 text-left transition hover:shadow-sm ${
                statusFilter === 'hidden'
                  ? 'border-gray-300 bg-gray-100'
                  : 'bg-background'
              }`}
            >
              <span className="text-sm text-muted-foreground">
                Hidden
              </span>

              <p className="mt-2 text-2xl font-semibold text-gray-600">
                {hiddenCount}
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  'out-of-stock',
                )
              }
              className={`rounded-2xl border p-4 text-left transition hover:shadow-sm ${
                statusFilter ===
                'out-of-stock'
                  ? 'border-red-300 bg-red-50'
                  : 'bg-background'
              }`}
            >
              <span className="text-sm text-muted-foreground">
                Out of Stock
              </span>

              <p className="mt-2 text-2xl font-semibold text-red-700">
                {outOfStockCount}
              </p>
            </button>

          </div>

          {/* SEARCH + FILTER */}
          <div className="mt-7 rounded-2xl border bg-background p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row">

              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search products..."
                  className="h-12 w-full rounded-xl border bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as StatusFilter,
                  )
                }
                className="h-12 rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 sm:w-52"
              >
                <option value="all">
                  All Statuses
                </option>

                {STATUS_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>

            </div>
          </div>

          {/* MESSAGE */}
          {message && (
            <div className="mt-4 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
              {message}
            </div>
          )}

          {/* PRODUCTS */}
          <div className="mt-6 space-y-4">

            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl border bg-background p-10 text-center">
                <Package className="mx-auto h-8 w-8 text-muted-foreground" />

                <h2 className="mt-3 font-semibold">
                  No products found
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Try a different search or status filter.
                </p>
              </div>
            ) : (
              filteredProducts.map(
                (product) => {
                  const isSaving =
                    savingSlug ===
                    product.slug

                  return (
                    <div
                      key={product.slug}
                      className={`rounded-2xl border bg-background p-4 shadow-sm transition hover:shadow-md sm:p-5 ${
                        product.status ===
                        'hidden'
                          ? 'opacity-70'
                          : ''
                      }`}
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                        {/* PRODUCT INFO */}
                        <div className="flex min-w-0 items-center gap-4">

                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-muted">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display =
                                  'none'
                              }}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-base font-semibold sm:text-lg">
                                {product.name}
                              </h2>

                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[product.status]}`}
                              >
                                <StatusIcon
                                  status={
                                    product.status
                                  }
                                />

                                {getStatusLabel(
                                  product.status,
                                )}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {product.slug}
                            </p>

                            {product.packSize && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {product.packSize}
                              </p>
                            )}
                          </div>

                        </div>

                        {/* STATUS CONTROL */}
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-48">
                          <label className="text-xs font-medium text-muted-foreground">
                            Product Status
                          </label>

                          <select
                            value={
                              product.status
                            }
                            onChange={(e) =>
                              saveStatus(
                                product.slug,
                                e.target.value as ProductStatus,
                              )
                            }
                            disabled={
                              isSaving
                            }
                            className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {STATUS_OPTIONS.map(
                              (
                                option,
                              ) => (
                                <option
                                  key={
                                    option.value
                                  }
                                  value={
                                    option.value
                                  }
                                >
                                  {
                                    option.label
                                  }
                                </option>
                              ),
                            )}
                          </select>

                          {isSaving && (
                            <span className="text-xs text-muted-foreground">
                              Saving changes...
                            </span>
                          )}
                        </div>

                      </div>
                    </div>
                  )
                },
              )
            )}

          </div>
        </div>
      </main>
    </>
  )
}