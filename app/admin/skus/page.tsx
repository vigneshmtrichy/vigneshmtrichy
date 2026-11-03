'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Barcode, PackagePlus, RefreshCw, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ALL_PRODUCTS } from '@/lib/site'
import { SiteHeader } from '@/components/site-header'

type ProductSku = {
  id: string
  product_slug: string
  sku_code: string
  barcode: string | null
  pack_size_value: number
  pack_size_unit: string
  mrp: number
  online_price: number
  retailer_price: number | null
  gst_rate: number
  shipping_weight_kg: number | null
  status: 'active' | 'inactive' | 'archived'
  is_default: boolean
  sku_inventory?: { stock_quantity: number | null; reorder_level: number }[] | null
}

type FormState = {
  product_slug: string
  sku_code: string
  barcode: string
  pack_size_value: string
  pack_size_unit: string
  mrp: string
  online_price: string
  retailer_price: string
  gst_rate: string
  shipping_weight_kg: string
  stock_quantity: string
  reorder_level: string
  status: 'active' | 'inactive'
  is_default: boolean
}

const emptyForm = (slug = ALL_PRODUCTS[0]?.slug || ''): FormState => ({
  product_slug: slug, sku_code: '', barcode: '', pack_size_value: '200',
  pack_size_unit: 'g', mrp: '', online_price: '', retailer_price: '',
  gst_rate: '5', shipping_weight_kg: '', stock_quantity: '', reorder_level: '10',
  status: 'active', is_default: false,
})

const money = (value: number | null | undefined) =>
  value == null ? '—' : '₹' + Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })

export default function AdminSkuManagementPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<ProductSku[]>([])
  const [query, setQuery] = useState('')
  const [productFilter, setProductFilter] = useState('all')
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('product_skus')
      .select('id, product_slug, sku_code, barcode, pack_size_value, pack_size_unit, mrp, online_price, retailer_price, gst_rate, shipping_weight_kg, status, is_default, sku_inventory(stock_quantity, reorder_level)')
      .order('created_at', { ascending: false })
    if (error) {
      setMessage('SKU data could not be loaded. Apply the new SKU database migration first. ' + error.message)
      setItems([])
    } else {
      setItems((data || []) as ProductSku[])
      setMessage('')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return
      const isAllowed = user?.email === 'info@tenoo.in'
      setAuthorized(isAllowed)
      if (isAllowed) void load()
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT')) return
      const isAllowed = session?.user?.email === 'info@tenoo.in'
      setAuthorized(isAllowed)
      if (isAllowed) void load()
      else { setItems([]); setLoading(false) }
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [load])

  const filtered = useMemo(() => items.filter((item) => {
    const product = ALL_PRODUCTS.find((entry) => entry.slug === item.product_slug)
    const text = (item.sku_code + ' ' + (item.barcode || '') + ' ' + (product?.name || item.product_slug)).toLowerCase()
    return text.includes(query.toLowerCase()) && (productFilter === 'all' || item.product_slug === productFilter)
  }), [items, query, productFilter])

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((item) => item.status === 'active').length,
    low: items.filter((item) => {
      const inv = item.sku_inventory?.[0]
      return inv?.stock_quantity != null && inv.stock_quantity <= inv.reorder_level
    }).length,
    noBarcode: items.filter((item) => !item.barcode).length,
  }), [items])

  const startCreate = () => {
    setEditingId(null)
    setForm(emptyForm(productFilter === 'all' ? undefined : productFilter))
    setShowForm(true)
    setMessage('')
  }

  const startEdit = (item: ProductSku) => {
    const inv = item.sku_inventory?.[0]
    setEditingId(item.id)
    setForm({
      product_slug: item.product_slug, sku_code: item.sku_code, barcode: item.barcode || '',
      pack_size_value: String(item.pack_size_value), pack_size_unit: item.pack_size_unit,
      mrp: String(item.mrp), online_price: String(item.online_price),
      retailer_price: item.retailer_price == null ? '' : String(item.retailer_price),
      gst_rate: String(item.gst_rate),
      shipping_weight_kg: item.shipping_weight_kg == null ? '' : String(item.shipping_weight_kg),
      stock_quantity: inv?.stock_quantity == null ? '' : String(inv.stock_quantity),
      reorder_level: String(inv?.reorder_level ?? 10), status: item.status === 'archived' ? 'inactive' : item.status,
      is_default: item.is_default,
    })
    setShowForm(true)
    setMessage('')
  }

  const save = async () => {
    const pack = Number(form.pack_size_value)
    const mrp = Number(form.mrp)
    const price = Number(form.online_price)
    const retailer = form.retailer_price.trim() ? Number(form.retailer_price) : null
    const stock = form.stock_quantity.trim() ? Number(form.stock_quantity) : null
    const reorder = Number(form.reorder_level)
    const weight = form.shipping_weight_kg.trim() ? Number(form.shipping_weight_kg) : null
    if (!form.product_slug || !form.sku_code.trim() || form.sku_code.trim().length < 3) return setMessage('Enter a SKU code with at least 3 characters.')
    if (!Number.isFinite(pack) || pack <= 0 || !Number.isFinite(mrp) || mrp <= 0 || !Number.isFinite(price) || price <= 0 || price > mrp) return setMessage('Enter valid pack size, MRP and online price (online price cannot exceed MRP).')
    if (retailer != null && (!Number.isFinite(retailer) || retailer <= 0)) return setMessage('Enter a valid retailer price or leave it empty.')
    if (stock != null && (!Number.isSafeInteger(stock) || stock < 0)) return setMessage('Stock must be a whole number zero or above.')
    if (!Number.isSafeInteger(reorder) || reorder < 0) return setMessage('Reorder level must be a whole number zero or above.')
    if (weight != null && (!Number.isFinite(weight) || weight <= 0)) return setMessage('Enter a valid shipping weight.')
    if (form.barcode.trim() && !/^(?:[0-9]{8}|[0-9]{12}|[0-9]{13}|[0-9]{14})$/.test(form.barcode.trim())) return setMessage('Enter a valid 8, 12, 13 or 14 digit barcode.')
    setSaving(true); setMessage('')
    const payload = {
      product_slug: form.product_slug, sku_code: form.sku_code.trim().toUpperCase(),
      barcode: form.barcode.trim() || null, pack_size_value: pack, pack_size_unit: form.pack_size_unit,
      mrp, online_price: price, retailer_price: retailer, gst_rate: Number(form.gst_rate),
      shipping_weight_kg: weight, status: form.status, is_default: form.is_default,
      updated_at: new Date().toISOString(),
    }
    let skuId = editingId
    if (form.is_default) {
      const { error: clearError } = await supabase.from('product_skus').update({ is_default: false }).eq('product_slug', form.product_slug)
      if (clearError) { setSaving(false); return setMessage(clearError.message) }
    }
    const result = editingId
      ? await supabase.from('product_skus').update(payload).eq('id', editingId).select('id').single()
      : await supabase.from('product_skus').insert(payload).select('id').single()
    if (result.error || !result.data) { setSaving(false); return setMessage(result.error?.message || 'Unable to save SKU.') }
    skuId = result.data.id
    const { error: inventoryError } = await supabase.rpc('tenoo_admin_set_sku_stock', {
      p_sku_id: skuId,
      p_stock_quantity: stock,
      p_reorder_level: reorder,
      p_notes: editingId ? 'SKU stock updated from admin' : 'Opening stock entered during SKU creation',
    })
    if (inventoryError) { setSaving(false); return setMessage('SKU saved, but inventory save failed: ' + inventoryError.message) }
    setSaving(false); setShowForm(false); setEditingId(null); setMessage('SKU saved successfully. Existing order stock flows remain unchanged until Phase 2 integration.')
    await load()
  }

  const changeStatus = async (item: ProductSku, status: 'active' | 'inactive') => {
    const { error } = await supabase.from('product_skus').update({ status, updated_at: new Date().toISOString() }).eq('id', item.id)
    if (error) setMessage(error.message)
    else { setMessage('SKU status updated.'); await load() }
  }

  if (authorized === null || (authorized && loading && items.length === 0 && !message)) return <><SiteHeader /><main className="mx-auto max-w-6xl px-4 py-12 text-center text-sm text-muted-foreground">Loading SKU management…</main></>
  if (authorized === false) return <><SiteHeader /><main className="mx-auto max-w-3xl px-4 py-16 text-center"><h1 className="text-xl font-semibold">Admin access required</h1><p className="mt-2 text-sm text-muted-foreground">Sign in with your Tenoo admin account to manage SKUs.</p></main></>

  return <>
    <SiteHeader />
    <main className="min-h-screen bg-muted/20 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Admin dashboard</Link>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Tenoo inventory</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">SKU Management</h1><p className="mt-1 text-sm text-muted-foreground">One parent product · Multiple pack-size SKUs</p></div>
          <button onClick={startCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><PackagePlus className="h-4 w-4" /> Add SKU</button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[['Total SKUs', stats.total], ['Active', stats.active], ['Low stock', stats.low], ['Missing barcode', stats.noBarcode]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p></div>)}
        </div>
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search product, SKU or barcode" className="h-11 w-full rounded-xl border bg-background pl-9 pr-3 text-sm" /></div>
          <select value={productFilter} onChange={e=>setProductFilter(e.target.value)} className="h-11 rounded-xl border bg-background px-3 text-sm"><option value="all">All parent products</option>{ALL_PRODUCTS.map(p=><option key={p.slug} value={p.slug}>{p.name}</option>)}</select>
          <button onClick={()=>void load()} className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm"><RefreshCw className="h-4 w-4" /> Refresh</button>
        </div>
        {message && <div className="mt-4 rounded-xl border bg-card px-4 py-3 text-sm" role="status">{message}</div>}
        {showForm && <section className="mt-5 rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{editingId ? 'Edit SKU' : 'Create SKU'}</h2><button onClick={()=>setShowForm(false)} className="text-sm text-muted-foreground">Close</button></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs font-medium text-muted-foreground">Parent product<select value={form.product_slug} onChange={e=>setForm({...form,product_slug:e.target.value})} disabled={Boolean(editingId)} className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground">{ALL_PRODUCTS.map(p=><option key={p.slug} value={p.slug}>{p.name}</option>)}</select></label>
            <label className="text-xs font-medium text-muted-foreground">SKU code<input value={form.sku_code} onChange={e=>setForm({...form,sku_code:e.target.value.toUpperCase()})} maxLength={64} placeholder="TEN-MEL-200" className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground" /></label>
            <label className="text-xs font-medium text-muted-foreground">Barcode / EAN<input value={form.barcode} onChange={e=>setForm({...form,barcode:e.target.value})} inputMode="numeric" placeholder="Optional 8–14 digits" className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground" /></label>
            <div className="grid grid-cols-[1fr_110px] gap-2"><label className="text-xs font-medium text-muted-foreground">Pack size<input type="number" min="0.001" step="0.001" value={form.pack_size_value} onChange={e=>setForm({...form,pack_size_value:e.target.value})} className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground" /></label><label className="text-xs font-medium text-muted-foreground">Unit<select value={form.pack_size_unit} onChange={e=>setForm({...form,pack_size_unit:e.target.value})} className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground">{['g','kg','ml','l','unit'].map(u=><option key={u}>{u}</option>)}</select></label></div>
            <label className="text-xs font-medium text-muted-foreground">MRP (₹)<input type="number" min="0.01" step="0.01" value={form.mrp} onChange={e=>setForm({...form,mrp:e.target.value})} className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground" /></label>
            <label className="text-xs font-medium text-muted-foreground">Online price (₹)<input type="number" min="0.01" step="0.01" value={form.online_price} onChange={e=>setForm({...form,online_price:e.target.value})} className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground" /></label>
            <label className="text-xs font-medium text-muted-foreground">Retailer price excl. GST (₹)<input type="number" min="0.01" step="0.01" value={form.retailer_price} onChange={e=>setForm({...form,retailer_price:e.target.value})} className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground" /></label>
            <label className="text-xs font-medium text-muted-foreground">GST rate<select value={form.gst_rate} onChange={e=>setForm({...form,gst_rate:e.target.value})} className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground">{[0,5,12,18,28].map(v=><option key={v} value={v}>{v}%</option>)}</select></label>
            <label className="text-xs font-medium text-muted-foreground">Shipping weight (kg)<input type="number" min="0.001" step="0.001" value={form.shipping_weight_kg} onChange={e=>setForm({...form,shipping_weight_kg:e.target.value})} placeholder="Optional" className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground" /></label>
            <label className="text-xs font-medium text-muted-foreground">Opening / current stock<input type="number" min="0" step="1" value={form.stock_quantity} onChange={e=>setForm({...form,stock_quantity:e.target.value})} placeholder="Leave blank for untracked" className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground" /></label>
            <label className="text-xs font-medium text-muted-foreground">Reorder alert quantity<input type="number" min="0" step="1" value={form.reorder_level} onChange={e=>setForm({...form,reorder_level:e.target.value})} className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground" /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_default} onChange={e=>setForm({...form,is_default:e.target.checked})} /> Default pack for this product</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.status==='active'} onChange={e=>setForm({...form,status:e.target.checked?'active':'inactive'})} /> SKU active</label>
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-2"><button onClick={()=>setShowForm(false)} className="rounded-xl border px-4 py-2.5 text-sm font-semibold">Cancel</button><button onClick={()=>void save()} disabled={saving} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving?'Saving…':'Save SKU'}</button></div>
        </section>}
        <section className="mt-5 overflow-hidden rounded-2xl border bg-card">
          <div className="border-b px-4 py-3"><h2 className="font-semibold">SKU directory</h2><p className="text-xs text-muted-foreground">Pack variants are children of the existing product record.</p></div>
          {loading ? <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p> : filtered.length === 0 ? <div className="p-10 text-center"><Barcode className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm font-medium">No SKUs found</p><p className="mt-1 text-xs text-muted-foreground">Create a SKU for an existing Tenoo product.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr>{['Parent product','Pack size','SKU code','Barcode','MRP','Online','Retailer','Stock','Status',''].map(h=><th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{filtered.map(item=>{const product=ALL_PRODUCTS.find(p=>p.slug===item.product_slug);const inv=item.sku_inventory?.[0];return <tr key={item.id} className="border-t"><td className="px-4 py-3 font-medium">{product?.name||item.product_slug}{item.is_default&&<span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">Default</span>}</td><td className="px-4 py-3">{item.pack_size_value}{item.pack_size_unit}</td><td className="px-4 py-3 font-mono text-xs">{item.sku_code}</td><td className="px-4 py-3 font-mono text-xs">{item.barcode||'—'}</td><td className="px-4 py-3">{money(item.mrp)}</td><td className="px-4 py-3">{money(item.online_price)}</td><td className="px-4 py-3">{money(item.retailer_price)}</td><td className="px-4 py-3">{inv?.stock_quantity??'Not tracked'}{inv?.stock_quantity!=null&&inv.stock_quantity<=inv.reorder_level&&<span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">Low</span>}</td><td className="px-4 py-3">{item.status}</td><td className="px-4 py-3"><div className="flex gap-2"><button onClick={()=>startEdit(item)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold">Edit</button>{item.status==='active'?<button onClick={()=>void changeStatus(item,'inactive')} className="rounded-lg border px-3 py-1.5 text-xs">Disable</button>:<button onClick={()=>void changeStatus(item,'active')} className="rounded-lg border px-3 py-1.5 text-xs">Activate</button>}</div></td></tr>})}</tbody></table></div>}
        </section>
        <p className="mt-4 text-xs text-muted-foreground">Phase 1 adds SKU catalogue and separate SKU stock records. Existing product-level inventory and all historical online/retailer orders remain unchanged; Phase 2 must explicitly migrate order item identifiers and stock deduction in one controlled rollout.</p>
      </div>
    </main>
  </>
}
