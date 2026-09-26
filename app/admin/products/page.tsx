'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ALL_PRODUCTS } from '@/lib/site'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

type ProductStatus =
  | 'active'
  | 'hidden'
  | 'coming-soon'
  | 'out-of-stock'

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

export default function AdminProductsPage() {
  const [statuses, setStatuses] = useState<
    Record<string, ProductStatus>
  >({})

  const [savingSlug, setSavingSlug] = useState<string | null>(
    null,
  )

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatuses()
  }, [])

  async function loadStatuses() {
    try {
      const { data, error } = await supabase
        .from('product_status')
        .select('product_slug, status')

      if (error) {
        console.error('Failed to load product statuses:', error)
        return
      }

      const statusMap: Record<string, ProductStatus> = {}

      data?.forEach((item) => {
        statusMap[item.product_slug] =
          item.status as ProductStatus
      })

      setStatuses(statusMap)
    } catch (error) {
      console.error('Failed to load product statuses:', error)
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

      const { error } = await supabase
        .from('product_status')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('product_slug', productSlug)

      if (error) {
        console.error('Failed to save product status:', error)
        alert('Failed to save product status.')
        return
      }

      setStatuses((current) => ({
        ...current,
        [productSlug]: status,
      }))

      alert('Product status updated.')
    } catch (error) {
      console.error('Failed to save product status:', error)
      alert('Failed to save product status.')
    } finally {
      setSavingSlug(null)
    }
  }

 if (loading) {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-muted-foreground">
          Loading products...
        </p>
      </main>

      <SiteFooter />
    </>
  )
}

 return (
  <>
    <SiteHeader />

    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">
          Products
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Manage product availability and visibility.
        </p>
      </div>

      <div className="space-y-4">
        {ALL_PRODUCTS.map((product) => {
          const currentStatus =
            statuses[product.slug] || 'active'

          const isSaving = savingSlug === product.slug

          return (
            <div
              key={product.slug}
              className="flex flex-col gap-5 rounded-2xl border bg-background p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-xl border bg-muted">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-contain"
                  />
                </div>

                <div>
                  <h2 className="font-semibold">
                    {product.name}
                  </h2>

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

              <div className="flex items-center gap-3">
                <select
                  value={currentStatus}
                  onChange={(e) =>
                    saveStatus(
                      product.slug,
                      e.target.value as ProductStatus,
                    )
                  }
                  disabled={isSaving}
                  className="rounded-xl border bg-background px-4 py-3 text-sm outline-none"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>

                {isSaving && (
                  <span className="text-xs text-muted-foreground">
                    Saving...
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </main>

    <SiteFooter />
  </>
)
}