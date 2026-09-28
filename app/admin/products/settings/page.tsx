'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, Clock3, EyeOff, CircleAlert } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ALL_PRODUCTS } from '@/lib/site'
import { SiteHeader } from '@/components/site-header'

type ProductStatus =
  | 'active'
  | 'hidden'
  | 'coming-soon'
  | 'out-of-stock'

type ProductDraft = {
  status: ProductStatus
  stock: string
  mrp: string
  price: string
  retailerPrice: string
  offerEnabled: boolean
  offerLabel: string
  featured: boolean
  shippingWeightKg: string
}

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

function buildDefaultDraft(slug: string): ProductDraft {
  const product = ALL_PRODUCTS.find((item) => item.slug === slug)

  return {
    status: 'active',
    stock: '',
    mrp: product?.mrp || '',
    price: product?.price || '',
    retailerPrice: product?.retailerPrice || '',
    offerEnabled: product?.offerEnabled ?? true,
    offerLabel: product?.offerLabel || '',
    featured: product?.featured ?? false,
    shippingWeightKg:
      product?.shippingWeightKg === undefined
        ? ''
        : String(product.shippingWeightKg),
  }
}

export default function AdminProductSettingsPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedSlug, setSelectedSlug] = useState(ALL_PRODUCTS[0]?.slug || '')
  const [drafts, setDrafts] = useState<Record<string, ProductDraft>>({})

  useEffect(() => {
    let mounted = true

    const applyAccess = (user: { email?: string } | null) => {
      if (!mounted) return

      const authorized = user?.email === 'info@tenoo.in'
      setIsAdmin(authorized)
      setAuthChecked(true)

      if (authorized) {
        setLoading(true)
        void loadProductSettings()
      } else {
        setLoading(false)
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

  async function loadProductSettings() {
    try {
      const { data, error } = await supabase
        .from('product_status')
        .select(
          'product_slug, status, stock_quantity, mrp, price, retailer_price, offer_enabled, offer_label, featured, shipping_weight_kg',
        )

      if (error) {
        console.error('Failed to load product settings:', error)
        setMessage('Unable to load product settings.')
        return
      }

      const nextDrafts: Record<string, ProductDraft> = {}

      for (const product of ALL_PRODUCTS) {
        const item = data?.find((row) => row.product_slug === product.slug)

        nextDrafts[product.slug] = {
          status: (item?.status as ProductStatus) || 'active',
          stock:
            item?.stock_quantity === null ||
            item?.stock_quantity === undefined
              ? ''
              : String(item.stock_quantity),
          mrp:
            item?.mrp === null || item?.mrp === undefined
              ? product.mrp || ''
              : String(item.mrp),
          price:
            item?.price === null || item?.price === undefined
              ? product.price || ''
              : String(item.price),
          retailerPrice:
            item?.retailer_price === null || item?.retailer_price === undefined
              ? ''
              : String(item.retailer_price),
          offerEnabled: item?.offer_enabled !== false,
          offerLabel: item?.offer_label || '',
          featured: Boolean(item?.featured),
          shippingWeightKg:
            item?.shipping_weight_kg === null ||
            item?.shipping_weight_kg === undefined
              ? ''
              : String(item.shipping_weight_kg),
        }
      }

      setDrafts(nextDrafts)
    } catch (error) {
      console.error('Failed to load product settings:', error)
      setMessage('Unable to load product settings.')
    } finally {
      setLoading(false)
    }
  }

  const selectedProduct = useMemo(
    () => ALL_PRODUCTS.find((product) => product.slug === selectedSlug) || null,
    [selectedSlug],
  )

  const draft =
    drafts[selectedSlug] ||
    (selectedSlug ? buildDefaultDraft(selectedSlug) : null)

  const updateDraft = (patch: Partial<ProductDraft>) => {
    if (!selectedSlug || !draft) return

    setDrafts((current) => ({
      ...current,
      [selectedSlug]: {
        ...draft,
        ...patch,
      },
    }))
  }

  async function saveChanges() {
    if (!selectedSlug || !draft) return

    const mrp = Number(draft.mrp)
    const price = Number(draft.price)
    const retailerPrice =
      draft.retailerPrice.trim() === '' ? null : Number(draft.retailerPrice)
    const shippingWeightKg =
      draft.shippingWeightKg.trim() === ''
        ? null
        : Number(draft.shippingWeightKg)
    const stock = draft.stock.trim() === '' ? null : Number(draft.stock)
    const offerLabel = draft.offerLabel.trim() || null

    if (
      !Number.isFinite(mrp) ||
      mrp <= 0 ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setMessage('Enter valid positive MRP and selling price.')
      return
    }

    if (price > mrp) {
      setMessage('Selling price cannot be higher than MRP.')
      return
    }

    if (
      retailerPrice !== null &&
      (!Number.isFinite(retailerPrice) || retailerPrice <= 0)
    ) {
      setMessage('Enter a valid retailer price or leave it empty.')
      return
    }

    if (
      shippingWeightKg !== null &&
      (!Number.isFinite(shippingWeightKg) || shippingWeightKg <= 0)
    ) {
      setMessage('Enter a valid shipping weight or leave it empty.')
      return
    }

    if (
      stock !== null &&
      (!/^\d+$/.test(draft.stock) || !Number.isSafeInteger(stock))
    ) {
      setMessage('Enter a whole stock quantity or leave it empty.')
      return
    }

    if (draft.status === 'active' && stock === 0) {
      setMessage('Add stock above zero before making this product active.')
      return
    }

    const nextStatus: ProductStatus =
      stock === 0
        ? 'out-of-stock'
        : draft.status === 'out-of-stock' && stock !== 0
          ? 'active'
          : draft.status

    try {
      setSaving(true)
      setMessage('')

      const { error } = await supabase
        .from('product_status')
        .upsert(
          {
            product_slug: selectedSlug,
            status: nextStatus,
            stock_quantity: stock,
            mrp: Number(mrp.toFixed(2)),
            price: Number(price.toFixed(2)),
            retailer_price:
              retailerPrice === null
                ? null
                : Number(retailerPrice.toFixed(2)),
            offer_enabled: draft.offerEnabled,
            offer_label: offerLabel,
            featured: draft.featured,
            shipping_weight_kg:
              shippingWeightKg === null
                ? null
                : Number(shippingWeightKg.toFixed(3)),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'product_slug',
          },
        )

      if (error) {
        console.error('Failed to save product settings:', error)
        setMessage('Failed to save product settings: ' + error.message)
        return
      }

      setDrafts((current) => ({
        ...current,
        [selectedSlug]: {
          ...draft,
          status: nextStatus,
          stock: stock === null ? '' : String(stock),
          mrp: mrp.toFixed(2),
          price: price.toFixed(2),
          retailerPrice:
            retailerPrice === null ? '' : retailerPrice.toFixed(2),
          offerLabel: offerLabel || '',
          shippingWeightKg:
            shippingWeightKg === null
              ? ''
              : shippingWeightKg.toFixed(3),
        },
      }))

      setMessage('Product changes saved successfully.')
    } catch (error) {
      console.error('Failed to save product settings:', error)
      setMessage('Failed to save product changes.')
    } finally {
      setSaving(false)
    }
  }

  if (!authChecked || (isAdmin && loading)) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen bg-background">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="h-9 w-56 animate-pulse rounded-xl bg-muted" />
            <div className="mt-6 h-14 animate-pulse rounded-xl bg-muted" />
            <div className="mt-4 h-96 animate-pulse rounded-2xl bg-muted" />
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
              Sign in with the admin account to manage product settings.
            </p>
            <Link
              href="/admin/products"
              className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Back to products
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
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Products
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Product Settings
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Select a product and manage all of its store settings in one place.
            </p>
          </div>

          <div className="mt-7 rounded-2xl border bg-background p-4 shadow-sm sm:p-5">
            <label
              htmlFor="product-selector"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
            >
              Select Product
            </label>

            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center">
              <select
                id="product-selector"
                value={selectedSlug}
                onChange={(e) => {
                  setSelectedSlug(e.target.value)
                  setMessage('')
                }}
                className="h-12 w-full rounded-xl border bg-background px-4 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                {ALL_PRODUCTS.map((product) => (
                  <option key={product.slug} value={product.slug}>
                    {product.name}
                  </option>
                ))}
              </select>

              {selectedProduct && draft && (
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-xl border bg-muted">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedProduct.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedProduct.packSize || selectedProduct.slug}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedProduct && draft && (
            <div className="mt-5 rounded-2xl border bg-background p-4 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{selectedProduct.name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    All changes below save together.
                  </p>
                </div>

                <span
                  className={
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ' +
                    STATUS_STYLES[draft.status]
                  }
                >
                  <StatusIcon status={draft.status} />
                  {getStatusLabel(draft.status)}
                </span>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Product Status
                  </label>
                  <select
                    value={draft.status}
                    onChange={(e) =>
                      updateDraft({ status: e.target.value as ProductStatus })
                    }
                    disabled={saving}
                    className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={draft.stock}
                    onChange={(e) => updateDraft({ stock: e.target.value })}
                    disabled={saving}
                    placeholder="Optional"
                    className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    MRP
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    value={draft.mrp}
                    onChange={(e) => updateDraft({ mrp: e.target.value })}
                    disabled={saving}
                    className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Selling Price
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    value={draft.price}
                    onChange={(e) => updateDraft({ price: e.target.value })}
                    disabled={saving}
                    className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Retailer Price
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    value={draft.retailerPrice}
                    onChange={(e) =>
                      updateDraft({ retailerPrice: e.target.value })
                    }
                    disabled={saving}
                    placeholder="Optional"
                    className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Shipping Weight (kg)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0.001"
                    step="0.001"
                    value={draft.shippingWeightKg}
                    onChange={(e) =>
                      updateDraft({ shippingWeightKg: e.target.value })
                    }
                    disabled={saving}
                    placeholder="Optional"
                    className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Offer Label
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    value={draft.offerLabel}
                    onChange={(e) => updateDraft({ offerLabel: e.target.value })}
                    disabled={saving}
                    placeholder="Optional"
                    className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
                  />
                </div>

                <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateDraft({ offerEnabled: !draft.offerEnabled })
                    }
                    disabled={saving}
                    className={
                      'rounded-xl border px-4 py-3 text-sm font-semibold transition ' +
                      (draft.offerEnabled
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'bg-muted text-muted-foreground')
                    }
                  >
                    Offer {draft.offerEnabled ? 'ON' : 'OFF'}
                  </button>

                  <button
                    type="button"
                    onClick={() => updateDraft({ featured: !draft.featured })}
                    disabled={saving}
                    className={
                      'rounded-xl border px-4 py-3 text-sm font-semibold transition ' +
                      (draft.featured
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'bg-muted text-muted-foreground')
                    }
                  >
                    Featured {draft.featured ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {message && (
                <div className="mt-5 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
                  {message}
                </div>
              )}

              <button
                type="button"
                onClick={saveChanges}
                disabled={saving}
                className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </button>

              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Status, stock, pricing, retailer rate, offer, featured setting and shipping weight save together.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
