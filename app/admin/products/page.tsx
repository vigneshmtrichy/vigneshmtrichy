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
  AlertTriangle,
  Search,
} from 'lucide-react'

type ProductStatus =
  | 'active'
  | 'hidden'
  | 'coming-soon'
  | 'out-of-stock'

type StatusFilter = 'all' | ProductStatus

const LOW_STOCK_THRESHOLD = 5

type ProductControlDraft = {
  mrp: string
  price: string
  retailerPrice: string
  offerEnabled: boolean
  offerLabel: string
  featured: boolean
  shippingWeightKg: string
}

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

const STATUS_STYLES: Record<ProductStatus, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  'coming-soon': 'bg-amber-50 text-amber-700 border-amber-200',
  'out-of-stock': 'bg-red-50 text-red-700 border-red-200',
  hidden: 'bg-gray-100 text-gray-600 border-gray-200',
}

function getStatusLabel(status: ProductStatus) {
  return (
    STATUS_OPTIONS.find((option) => option.value === status)?.label || status
  )
}

function StatusIcon({ status }: { status: ProductStatus }) {
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
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [statuses, setStatuses] = useState<Record<string, ProductStatus>>({})
  const [stockQuantities, setStockQuantities] = useState<Record<string, number | null>>({})
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({})
  const [controlDrafts, setControlDrafts] = useState<
    Record<string, ProductControlDraft>
  >({})
  const [savingSlug, setSavingSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
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
        setStockDrafts({})
        setControlDrafts({})
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
        .select('product_slug, status, stock_quantity, mrp, price, retailer_price, offer_enabled, offer_label, featured, shipping_weight_kg')

      if (error) {
        console.error('Failed to load product statuses:', error)
        setMessage('Unable to load product statuses.')
        return
      }

      const statusMap: Record<string, ProductStatus> = {}
      const stockMap: Record<string, number | null> = {}
      const stockDraftMap: Record<string, string> = {}
      const controlDraftMap: Record<string, ProductControlDraft> = {}

      data?.forEach((item) => {
        statusMap[item.product_slug] = item.status as ProductStatus
        stockMap[item.product_slug] =
          item.stock_quantity === null ? null : Number(item.stock_quantity)
        stockDraftMap[item.product_slug] =
          item.stock_quantity === null ? '' : String(item.stock_quantity)
        controlDraftMap[item.product_slug] = {
          mrp: item.mrp === null || item.mrp === undefined ? '' : String(item.mrp),
          price: item.price === null || item.price === undefined ? '' : String(item.price),
          retailerPrice:
            item.retailer_price === null || item.retailer_price === undefined
              ? ''
              : String(item.retailer_price),
          offerEnabled: item.offer_enabled !== false,
          offerLabel: item.offer_label || '',
          featured: Boolean(item.featured),
          shippingWeightKg:
            item.shipping_weight_kg === null || item.shipping_weight_kg === undefined
              ? ''
              : String(item.shipping_weight_kg),
        }
      })

      setStatuses(statusMap)
      setStockQuantities(stockMap)
      setStockDrafts(stockDraftMap)
      setControlDrafts(controlDraftMap)
    } catch (error) {
      console.error('Failed to load product statuses:', error)
      setMessage('Unable to load product statuses.')
    } finally {
      setLoading(false)
    }
  }

  async function saveStatus(productSlug: string, status: ProductStatus) {
    if (status === 'active' && stockQuantities[productSlug] === 0) {
      setMessage('Add stock above zero before making this product active.')
      return
    }

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

  async function saveProductControls(productSlug: string) {
    const draft = controlDrafts[productSlug]

    if (!draft) {
      setMessage('Enter the product settings before saving.')
      return
    }

    const mrp = Number(draft.mrp)
    const price = Number(draft.price)
    const retailerPrice =
      draft.retailerPrice.trim() === '' ? null : Number(draft.retailerPrice)
    const shippingWeightKg =
      draft.shippingWeightKg.trim() === '' ? null : Number(draft.shippingWeightKg)
    const offerLabel = draft.offerLabel.trim() || null

    if (!Number.isFinite(mrp) || mrp <= 0 || !Number.isFinite(price) || price <= 0) {
      setMessage('Enter valid positive MRP and selling price.')
      return
    }

    if (price > mrp) {
      setMessage('Selling price cannot be higher than MRP.')
      return
    }

    if (retailerPrice !== null && (!Number.isFinite(retailerPrice) || retailerPrice <= 0)) {
      setMessage('Enter a valid retailer price or leave it empty.')
      return
    }

    if (shippingWeightKg !== null && (!Number.isFinite(shippingWeightKg) || shippingWeightKg <= 0)) {
      setMessage('Enter a valid shipping weight or leave it empty.')
      return
    }

    try {
      setSavingSlug(productSlug)
      setMessage('')

      const { error } = await supabase
        .from('product_status')
        .upsert(
          {
            product_slug: productSlug,
            mrp: Number(mrp.toFixed(2)),
            price: Number(price.toFixed(2)),
            retailer_price:
              retailerPrice === null ? null : Number(retailerPrice.toFixed(2)),
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
        console.error('Failed to save product controls:', error)
        setMessage('Failed to save product controls: ' + error.message)
        return
      }

      setControlDrafts((current) => ({
        ...current,
        [productSlug]: {
          ...draft,
          mrp: mrp.toFixed(2),
          price: price.toFixed(2),
          retailerPrice:
            retailerPrice === null ? '' : retailerPrice.toFixed(2),
          offerLabel: offerLabel || '',
          shippingWeightKg:
            shippingWeightKg === null ? '' : shippingWeightKg.toFixed(3),
        },
      }))
      setMessage('Product settings saved successfully.')
    } catch (error) {
      console.error('Failed to save product controls:', error)
      setMessage('Failed to save product settings.')
    } finally {
      setSavingSlug(null)
    }
  }

  async function saveStock(productSlug: string) {
    const rawQuantity = stockDrafts[productSlug] ?? ''

    if (!/^\d+$/.test(rawQuantity)) {
      setMessage('Enter a whole stock quantity of zero or more.')
      return
    }

    const stockQuantity = Number(rawQuantity)
    if (!Number.isSafeInteger(stockQuantity)) {
      setMessage('Enter a valid stock quantity.')
      return
    }

    const currentStatus = statuses[productSlug] || 'active'
    const nextStatus: ProductStatus =
      stockQuantity === 0
        ? 'out-of-stock'
        : currentStatus === 'out-of-stock'
          ? 'active'
          : currentStatus

    try {
      setSavingSlug(productSlug)
      setMessage('')

      const { error } = await supabase
        .from('product_status')
        .upsert(
          {
            product_slug: productSlug,
            status: nextStatus,
            stock_quantity: stockQuantity,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'product_slug',
          },
        )

      if (error) {
        console.error('Failed to save stock quantity:', error)
        setMessage('Failed to save stock quantity: ' + error.message)
        return
      }

      setStockQuantities((current) => ({
        ...current,
        [productSlug]: stockQuantity,
      }))
      setStatuses((current) => ({
        ...current,
        [productSlug]: nextStatus,
      }))
    } catch (error) {
      console.error('Failed to save stock quantity:', error)
      setMessage('Failed to save stock quantity.')
    } finally {
      setSavingSlug(null)
    }
  }

  const productData = useMemo(() => {
    return ALL_PRODUCTS.map((product) => ({
      ...product,
      status: statuses[product.slug] || 'active',
      stockQuantity: stockQuantities[product.slug] ?? null,
      controlDraft: controlDrafts[product.slug] || {
        mrp: product.mrp || '',
        price: product.price || '',
        retailerPrice: product.retailerPrice || '',
        offerEnabled: product.offerEnabled ?? true,
        offerLabel: product.offerLabel || '',
        featured: product.featured ?? false,
        shippingWeightKg:
          product.shippingWeightKg === undefined
            ? ''
            : String(product.shippingWeightKg),
      },
    }))
  }, [statuses, stockQuantities, controlDrafts])

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
                <div key={index} className="h-32 animate-pulse rounded-2xl bg-muted" />
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
              Sign in with the admin account to manage product status and stock.
            </p>
            <a href="/" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
              Back to store
            </a>
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Manage product availability and visibility.
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span> of {totalProducts} products
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            <button type="button" onClick={() => setStatusFilter('all')} className={`rounded-2xl border p-4 text-left transition hover:shadow-sm ${statusFilter === 'all' ? 'border-primary bg-primary/5' : 'bg-background'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Products</span>
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-semibold">{totalProducts}</p>
            </button>
            <button type="button" onClick={() => setStatusFilter('active')} className={`rounded-2xl border p-4 text-left transition hover:shadow-sm ${statusFilter === 'active' ? 'border-green-300 bg-green-50' : 'bg-background'}`}>
              <span className="text-sm text-muted-foreground">Active</span>
              <p className="mt-2 text-2xl font-semibold text-green-700">{activeCount}</p>
            </button>
            <button type="button" onClick={() => setStatusFilter('coming-soon')} className={`rounded-2xl border p-4 text-left transition hover:shadow-sm ${statusFilter === 'coming-soon' ? 'border-amber-300 bg-amber-50' : 'bg-background'}`}>
              <span className="text-sm text-muted-foreground">Coming Soon</span>
              <p className="mt-2 text-2xl font-semibold text-amber-700">{comingSoonCount}</p>
            </button>
            <button type="button" onClick={() => setStatusFilter('hidden')} className={`rounded-2xl border p-4 text-left transition hover:shadow-sm ${statusFilter === 'hidden' ? 'border-gray-300 bg-gray-100' : 'bg-background'}`}>
              <span className="text-sm text-muted-foreground">Hidden</span>
              <p className="mt-2 text-2xl font-semibold text-gray-600">{hiddenCount}</p>
            </button>
            <button type="button" onClick={() => setStatusFilter('out-of-stock')} className={`rounded-2xl border p-4 text-left transition hover:shadow-sm ${statusFilter === 'out-of-stock' ? 'border-red-300 bg-red-50' : 'bg-background'}`}>
              <span className="text-sm text-muted-foreground">Out of Stock</span>
              <p className="mt-2 text-2xl font-semibold text-red-700">{outOfStockCount}</p>
            </button>
          </div>

          {lowStockProducts.length > 0 && (
            <div role="alert" className="mt-6 flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Low stock: {lowStockProducts.length} product{lowStockProducts.length === 1 ? '' : 's'}</p>
                <p className="mt-1 text-sm">
                  {lowStockProducts.map((product) => product.name + ' (' + product.stockQuantity + ' left)').join(', ')}
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
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="h-12 w-full rounded-xl border bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="h-12 rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 sm:w-52">
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {message && <div className="mt-4 rounded-xl border bg-muted/40 px-4 py-3 text-sm">{message}</div>}

          <div className="mt-6 space-y-4">
            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl border bg-background p-10 text-center">
                <Package className="mx-auto h-8 w-8 text-muted-foreground" />
                <h2 className="mt-3 font-semibold">No products found</h2>
                <p className="mt-1 text-sm text-muted-foreground">Try a different search or status filter.</p>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const isSaving = savingSlug === product.slug

                return (
                  <div key={product.slug} className={`rounded-2xl border bg-background p-4 shadow-sm transition hover:shadow-md sm:p-5 ${product.status === 'hidden' ? 'opacity-70' : ''}`}>
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-muted">
                          <img src={product.image} alt={product.name} className="h-full w-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-semibold sm:text-lg">{product.name}</h2>
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[product.status]}`}>
                              <StatusIcon status={product.status} />
                              {getStatusLabel(product.status)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{product.slug}</p>
                          {product.packSize && <p className="mt-1 text-sm text-muted-foreground">{product.packSize}</p>}
                        </div>
                      </div>

                      <div className="flex w-full flex-col gap-2 sm:w-72">
                        <label className="text-xs font-medium text-muted-foreground">Product Status</label>
                        <select value={product.status} onChange={(e) => saveStatus(product.slug, e.target.value as ProductStatus)} disabled={isSaving} className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60">
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>

                        <div className="mt-2 border-t pt-3">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-xs font-medium text-muted-foreground">Product Settings</label>
                          </div>

                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <input type="number" inputMode="decimal" min="0.01" step="0.01" value={product.controlDraft.mrp} onChange={(e) => setControlDrafts((current) => ({ ...current, [product.slug]: { ...(current[product.slug] || { mrp: '', price: '', retailerPrice: '', offerEnabled: true, offerLabel: '', featured: false, shippingWeightKg: '' }), mrp: e.target.value } }))} disabled={isSaving} placeholder="MRP" aria-label={'MRP for ' + product.name} className="h-10 min-w-0 rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60" />
                            <input type="number" inputMode="decimal" min="0.01" step="0.01" value={product.controlDraft.price} onChange={(e) => setControlDrafts((current) => ({ ...current, [product.slug]: { ...(current[product.slug] || { mrp: '', price: '', retailerPrice: '', offerEnabled: true, offerLabel: '', featured: false, shippingWeightKg: '' }), price: e.target.value } }))} disabled={isSaving} placeholder="Selling price" aria-label={'Selling price for ' + product.name} className="h-10 min-w-0 rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60" />
                            <input type="number" inputMode="decimal" min="0.01" step="0.01" value={product.controlDraft.retailerPrice} onChange={(e) => setControlDrafts((current) => ({ ...current, [product.slug]: { ...(current[product.slug] || { mrp: '', price: '', retailerPrice: '', offerEnabled: true, offerLabel: '', featured: false, shippingWeightKg: '' }), retailerPrice: e.target.value } }))} disabled={isSaving} placeholder="Retailer price" aria-label={'Retailer price for ' + product.name} className="h-10 min-w-0 rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60" />
                            <input type="number" inputMode="decimal" min="0.001" step="0.001" value={product.controlDraft.shippingWeightKg} onChange={(e) => setControlDrafts((current) => ({ ...current, [product.slug]: { ...(current[product.slug] || { mrp: '', price: '', retailerPrice: '', offerEnabled: true, offerLabel: '', featured: false, shippingWeightKg: '' }), shippingWeightKg: e.target.value } }))} disabled={isSaving} placeholder="Weight (kg)" aria-label={'Shipping weight in kg for ' + product.name} className="h-10 min-w-0 rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60" />
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <button type="button" onClick={() => setControlDrafts((current) => ({ ...current, [product.slug]: { ...(current[product.slug] || { mrp: '', price: '', retailerPrice: '', offerEnabled: true, offerLabel: '', featured: false, shippingWeightKg: '' }), offerEnabled: !(current[product.slug]?.offerEnabled ?? true) } }))} disabled={isSaving} className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-60 ${product.controlDraft.offerEnabled ? 'bg-primary/5 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              Offer {product.controlDraft.offerEnabled ? 'ON' : 'OFF'}
                            </button>

                            <button type="button" onClick={() => setControlDrafts((current) => ({ ...current, [product.slug]: { ...(current[product.slug] || { mrp: '', price: '', retailerPrice: '', offerEnabled: true, offerLabel: '', featured: false, shippingWeightKg: '' }), featured: !(current[product.slug]?.featured ?? false) } }))} disabled={isSaving} className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-60 ${product.controlDraft.featured ? 'bg-primary/5 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              Featured {product.controlDraft.featured ? 'ON' : 'OFF'}
                            </button>
                          </div>

                          <input type="text" maxLength={80} value={product.controlDraft.offerLabel} onChange={(e) => setControlDrafts((current) => ({ ...current, [product.slug]: { ...(current[product.slug] || { mrp: '', price: '', retailerPrice: '', offerEnabled: true, offerLabel: '', featured: false, shippingWeightKg: '' }), offerLabel: e.target.value } }))} disabled={isSaving} placeholder="Offer label (optional)" aria-label={'Offer label for ' + product.name} className="mt-2 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60" />

                          <button type="button" onClick={() => saveProductControls(product.slug)} disabled={isSaving || product.controlDraft.mrp === '' || product.controlDraft.price === ''} className="mt-2 w-full rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
                            {isSaving ? 'Saving...' : 'Save Product Settings'}
                          </button>

                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Price, retailer price, offer, featured status and shipping weight save together.
                          </p>

                          <div className="mt-4 border-t pt-3">
                            <div className="flex items-center justify-between gap-2">
                              <label htmlFor={'stock-' + product.slug} className="text-xs font-medium text-muted-foreground">Stock quantity</label>
                              {product.stockQuantity !== null && product.stockQuantity > 0 && product.stockQuantity <= LOW_STOCK_THRESHOLD && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700"><AlertTriangle className="h-3.5 w-3.5" />Low stock</span>
                              )}
                            </div>
                            <div className="mt-2 flex gap-2">
                              <input id={'stock-' + product.slug} type="number" inputMode="numeric" min="0" step="1" value={stockDrafts[product.slug] ?? ''} onChange={(e) => setStockDrafts((current) => ({ ...current, [product.slug]: e.target.value }))} disabled={isSaving} placeholder="Not set" aria-label={'Stock quantity for ' + product.name} className="h-10 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60" />
                              <button type="button" onClick={() => saveStock(product.slug)} disabled={isSaving || stockDrafts[product.slug] === undefined || stockDrafts[product.slug] === (product.stockQuantity === null ? '' : String(product.stockQuantity))} className="rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
                                {isSaving ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">Orders reduce tracked stock automatically.</p>
                          </div>
                        </div>

                        {isSaving && <span className="text-xs text-muted-foreground">Saving changes...</span>}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </main>
    </>
  )
}
