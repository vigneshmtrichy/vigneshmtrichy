'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, CheckCircle2, ChevronDown, Clock3, EyeOff, CircleAlert, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ALL_PRODUCTS } from '@/lib/site'
import { SiteHeader } from '@/components/site-header'

type ProductStatus =
  | 'active'
  | 'hidden'
  | 'coming-soon'
  | 'out-of-stock'

type ProductDraft = {
  displayName: string
  badges: string
  status: ProductStatus
  stock: string
  mrp: string
  price: string
  retailerPrice: string
  offerEnabled: boolean
  offerLabel: string
  featured: boolean
  featuredPriority: string
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
    displayName: product?.name || '',
    badges: product?.badges.join(', ') || '',
    status: 'active',
    stock: '',
    mrp: product?.mrp || '',
    price: product?.price || '',
    retailerPrice: product?.retailerPrice || '',
    offerEnabled: product?.offerEnabled ?? true,
    offerLabel: product?.offerLabel || '',
    featured: product?.featured ?? false,
    featuredPriority:
      product?.featuredPriority === undefined
        ? ''
        : String(product.featuredPriority),
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
  const [pickerOpen, setPickerOpen] = useState(false)
  const [statusPickerOpen, setStatusPickerOpen] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [drafts, setDrafts] = useState<Record<string, ProductDraft>>({})

  useEffect(() => {
    let mounted = true

    const requestedSlug = new URLSearchParams(window.location.search).get('product')
    if (requestedSlug && ALL_PRODUCTS.some((product) => product.slug === requestedSlug)) {
      setSelectedSlug(requestedSlug)
    }

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
          'product_slug, status, stock_quantity, mrp, price, retailer_price, offer_enabled, offer_label, featured, featured_priority, display_name, badges, shipping_weight_kg',
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
          displayName:
            item?.display_name === null || item?.display_name === undefined
              ? product.name
              : String(item.display_name),
          badges: Array.isArray(item?.badges)
            ? item.badges.join(', ')
            : product.badges.join(', '),
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
          featuredPriority:
            item?.featured_priority === null ||
            item?.featured_priority === undefined
              ? ''
              : String(item.featured_priority),
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

  const filteredProductOptions = useMemo(() => {
    const query = productSearch.trim().toLowerCase()
    if (!query) return ALL_PRODUCTS

    return ALL_PRODUCTS.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.slug.toLowerCase().includes(query),
    )
  }, [productSearch])

  const chooseProduct = (slug: string) => {
    setSelectedSlug(slug)
    setProductSearch('')
    setPickerOpen(false)
    setMessage('')

    const url = new URL(window.location.href)
    url.searchParams.set('product', slug)
    window.history.replaceState({}, '', url)
  }

  useEffect(() => {
    if (!pickerOpen && !statusPickerOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPickerOpen(false)
        setStatusPickerOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pickerOpen, statusPickerOpen])

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

    const displayName = draft.displayName.trim()
    const badges = draft.badges
      .split(',')
      .map((badge) => badge.trim())
      .filter(Boolean)
    const featuredPriority =
      draft.featuredPriority.trim() === ''
        ? null
        : Number(draft.featuredPriority)
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

    if (!displayName || displayName.length > 120) {
      setMessage('Product name must be between 1 and 120 characters.')
      return
    }

    if (badges.length > 6 || badges.some((badge) => badge.length > 80)) {
      setMessage('Use up to 6 badges, with each badge up to 80 characters.')
      return
    }

    if (
      featuredPriority !== null &&
      (!Number.isSafeInteger(featuredPriority) || featuredPriority <= 0)
    ) {
      setMessage('Featured priority must be a positive whole number or left empty.')
      return
    }

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
            display_name: displayName,
            badges,
            featured_priority:
              featuredPriority === null ? null : featuredPriority,
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
          displayName,
          badges: badges.join(', '),
          featuredPriority:
            featuredPriority === null ? '' : String(featuredPriority),
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

          <div className="mt-7 overflow-visible rounded-2xl border bg-background p-4 shadow-sm sm:p-5">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Select Product
            </label>

            <div className="mt-2 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setPickerOpen((open) => !open)}
                  aria-haspopup="listbox"
                  aria-expanded={pickerOpen}
                  className="flex h-12 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-background px-4 text-left text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                >
                  <span className="min-w-0 truncate">
                    {draft?.displayName || selectedProduct?.name || 'Select product'}
                  </span>
                  <ChevronDown
                    className={
                      'h-4 w-4 shrink-0 text-muted-foreground transition-transform ' +
                      (pickerOpen ? 'rotate-180' : '')
                    }
                  />
                </button>

                {pickerOpen && (
                  <div
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-50 mt-2 max-w-full overflow-hidden rounded-xl border bg-background p-2 shadow-xl"
                  >
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        autoFocus
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search products..."
                        aria-label="Search products"
                        className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </div>

                    <div className="mt-2 max-h-64 overflow-y-auto overscroll-contain">
                      {filteredProductOptions.length === 0 ? (
                        <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                          No products found.
                        </p>
                      ) : (
                        filteredProductOptions.map((product) => {
                          const isSelected = product.slug === selectedSlug

                          return (
                            <button
                              key={product.slug}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => chooseProduct(product.slug)}
                              className="flex w-full min-w-0 items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-muted"
                            >
                              <span className="min-w-0 truncate">
                                {drafts[product.slug]?.displayName || product.name}
                              </span>
                              {isSelected && (
                                <Check className="h-4 w-4 shrink-0 text-primary" />
                              )}
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {selectedProduct && draft && (
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border bg-muted">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {draft.displayName || selectedProduct.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
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
                  <h2 className="text-lg font-semibold">
                    {draft.displayName || selectedProduct.name}
                  </h2>
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
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Display Name
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={draft.displayName}
                    onChange={(e) =>
                      updateDraft({ displayName: e.target.value })
                    }
                    disabled={saving}
                    placeholder="Product name"
                    className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
                  />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Customer-facing name. Product URL slug stays locked.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Product Badges
                  </label>
                  <input
                    type="text"
                    value={draft.badges}
                    onChange={(e) => updateDraft({ badges: e.target.value })}
                    disabled={saving}
                    placeholder="Rich in Protein, New, Best Seller"
                    className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
                  />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Separate badges with commas. Up to 6 badges.
                  </p>
                </div>

                <div className="relative min-w-0">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Product Status
                  </label>

                  <button
                    type="button"
                    onClick={() => setStatusPickerOpen((open) => !open)}
                    disabled={saving}
                    aria-haspopup="listbox"
                    aria-expanded={statusPickerOpen}
                    className="flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-background px-3 text-left text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex min-w-0 items-center gap-2 truncate">
                      <StatusIcon status={draft.status} />
                      <span className="truncate">{getStatusLabel(draft.status)}</span>
                    </span>
                    <ChevronDown
                      className={
                        'h-4 w-4 shrink-0 text-muted-foreground transition-transform ' +
                        (statusPickerOpen ? 'rotate-180' : '')
                      }
                    />
                  </button>

                  {statusPickerOpen && (
                    <div
                      role="listbox"
                      className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border bg-background p-1.5 shadow-xl"
                    >
                      {STATUS_OPTIONS.map((option) => {
                        const isSelected = option.value === draft.status

                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              updateDraft({ status: option.value })
                              setStatusPickerOpen(false)
                              setMessage('')
                            }}
                            className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-muted"
                          >
                            <span className="flex min-w-0 items-center gap-2 truncate">
                              <StatusIcon status={option.value} />
                              <span className="truncate">{option.label}</span>
                            </span>
                            {isSelected && (
                              <Check className="h-4 w-4 shrink-0 text-primary" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
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

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Featured Priority
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={draft.featuredPriority}
                    onChange={(e) =>
                      updateDraft({ featuredPriority: e.target.value })
                    }
                    disabled={saving || !draft.featured}
                    placeholder="Optional — 1 shows first"
                    className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Lower number appears earlier among Featured products on Home.
                  </p>
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
                Name, badges, status, stock, pricing, offer, featured priority and shipping weight save together.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
