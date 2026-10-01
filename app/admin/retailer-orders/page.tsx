'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ALL_PRODUCTS } from '@/lib/site'
import { SiteHeader } from '@/components/site-header'
import { supabase } from '@/lib/supabase'

type Retailer = { id: string; business_name: string; payment_terms_days: number; credit_limit: number }
type OrderLine = { product_slug: string; quantity: string }

const money = (value: unknown) => '₹' + Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })

export default function RetailerOrdersPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [retailerId, setRetailerId] = useState('')
  const [lines, setLines] = useState<OrderLine[]>([{ product_slug: ALL_PRODUCTS[0]?.slug || '', quantity: '1' }])
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [paymentType, setPaymentType] = useState('credit')
  const [initialPayment, setInitialPayment] = useState('')
  const [initialPaymentMethod, setInitialPaymentMethod] = useState('upi')
  const [initialPaymentReference, setInitialPaymentReference] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const load = async () => {
    const [{ data: retailerRows }, { data: orderRows }] = await Promise.all([
      supabase.from('retailers').select('id, business_name, payment_terms_days, credit_limit').eq('status', 'active').order('business_name'),
      supabase.from('retailer_orders').select('*, retailers(business_name), retailer_order_items(*)').order('created_at', { ascending: false }).limit(50),
    ])
    setRetailers((retailerRows || []) as Retailer[])
    setOrders(orderRows || [])
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const ok = user?.email === 'info@tenoo.in'
      setAuthorized(ok)
      if (ok) void load()
    })
  }, [])

  useEffect(() => {
    if (!retailerId) { setPrices({}); return }
    const loadPrices = async () => {
      const [{ data: defaults }, { data: overrides }] = await Promise.all([
        supabase.from('product_status').select('product_slug, retailer_price, price'),
        supabase.from('retailer_product_prices').select('product_slug, unit_price').eq('retailer_id', retailerId),
      ])
      const next: Record<string, number> = {}
      defaults?.forEach((row: any) => { next[row.product_slug] = Number(row.retailer_price || row.price || 0) })
      overrides?.forEach((row: any) => { next[row.product_slug] = Number(row.unit_price) })
      setPrices(next)
    }
    void loadPrices()
  }, [retailerId])

  const estimatedTotal = useMemo(() => lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(prices[line.product_slug] || 0), 0), [lines, prices])

  const createOrder = async (event: FormEvent) => {
    event.preventDefault()
    if (!retailerId) { setMessage('Choose a retailer.'); return }
    const payload = lines.map((line) => ({ product_slug: line.product_slug, quantity: Number(line.quantity) }))
    if (payload.some((line) => !line.product_slug || !Number.isSafeInteger(line.quantity) || line.quantity < 1)) {
      setMessage('Every line needs a product and whole quantity.'); return
    }
    const requestedInitialPayment = paymentType === 'prepaid'
      ? estimatedTotal
      : paymentType === 'partial'
        ? Number(initialPayment || 0)
        : 0
    if (paymentType === 'partial' && (!Number.isFinite(requestedInitialPayment) || requestedInitialPayment <= 0 || requestedInitialPayment >= estimatedTotal)) {
      setMessage('For partial payment, enter an amount greater than zero and less than the estimated order total.')
      return
    }
    setSaving(true); setMessage('')
    const { data, error } = await supabase.rpc('create_retailer_order_with_stock', {
      p_retailer_id: retailerId,
      p_items: payload,
      p_payment_type: paymentType,
      p_due_date: null,
      p_notes: notes || null,
      p_initial_payment: requestedInitialPayment,
      p_initial_payment_method: initialPaymentMethod,
      p_initial_payment_reference: initialPaymentReference || null,
    })
    setSaving(false)
    if (error || !data?.success) { setMessage(error?.message || data?.message || 'Unable to create retailer order.'); return }
    setLines([{ product_slug: ALL_PRODUCTS[0]?.slug || '', quantity: '1' }]); setInitialPayment(''); setInitialPaymentReference(''); setNotes(''); setMessage('Retailer order #' + data.order_id + ' created and stock reserved.')
    await load()
  }

  const updateStatus = async (order: any, order_status: string) => {
    const { error } = await supabase.from('retailer_orders').update({ order_status, updated_at: new Date().toISOString() }).eq('id', order.id)
    setMessage(error ? error.message : 'Order status updated.')
    if (!error) await load()
  }

  if (authorized === null) return <><SiteHeader /><main className="p-10 text-center">Loading…</main></>
  if (!authorized) return <><SiteHeader /><main className="p-10 text-center">Admin access only.</main></>

  return <><SiteHeader /><main className="min-h-screen bg-muted/20 px-4 py-8 sm:px-6"><div className="mx-auto max-w-7xl">
    <div><h1 className="text-3xl font-semibold">Retailer Orders</h1><p className="mt-1 text-sm text-muted-foreground">Create trade orders at the retailer’s approved price; stock is reserved immediately.</p></div>
    {message && <p className="mt-4 rounded-xl border bg-background px-4 py-3 text-sm">{message}</p>}

    <form onSubmit={createOrder} className="mt-6 rounded-2xl border bg-background p-5">
      <div className="grid gap-4 sm:grid-cols-3"><label className="text-sm font-medium">Retailer<select required value={retailerId} onChange={(e) => setRetailerId(e.target.value)} className="mt-1 h-11 w-full rounded-lg border bg-background px-3"><option value="">Select retailer</option>{retailers.map((r) => <option key={r.id} value={r.id}>{r.business_name}</option>)}</select></label>
      <label className="text-sm font-medium">Payment<select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className="mt-1 h-11 w-full rounded-lg border bg-background px-3"><option value="credit">Credit</option><option value="prepaid">Prepaid</option><option value="partial">Partial payment</option><option value="cod">Cash on delivery</option></select></label>
      <label className="text-sm font-medium">Order note<input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 h-11 w-full rounded-lg border bg-background px-3" placeholder="Optional" /></label></div>
      {(paymentType === 'partial' || paymentType === 'prepaid') && <div className="mt-4 grid gap-3 rounded-xl border bg-muted/30 p-4 sm:grid-cols-3">
        <label className="text-xs font-medium text-muted-foreground">Initial payment {paymentType === 'prepaid' ? '(full total)' : '(₹)'}
          <input value={paymentType === 'prepaid' ? String(estimatedTotal || '') : initialPayment} onChange={(e) => setInitialPayment(e.target.value)} disabled={paymentType === 'prepaid'} type="number" min="0" step="0.01" className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm" />
        </label>
        <label className="text-xs font-medium text-muted-foreground">Payment method
          <select value={initialPaymentMethod} onChange={(e) => setInitialPaymentMethod(e.target.value)} className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm"><option value="upi">UPI</option><option value="bank-transfer">Bank transfer</option><option value="cash">Cash</option><option value="cheque">Cheque</option><option value="other">Other</option></select>
        </label>
        <label className="text-xs font-medium text-muted-foreground">Reference
          <input value={initialPaymentReference} onChange={(e) => setInitialPaymentReference(e.target.value)} placeholder="Optional" className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm" />
        </label>
      </div>}
      <div className="mt-5 space-y-3">{lines.map((line, index) => <div key={index} className="grid gap-2 sm:grid-cols-[1fr_100px_120px_80px] sm:items-end"><label className="text-xs font-medium text-muted-foreground">Product<select value={line.product_slug} onChange={(e) => setLines(lines.map((item, i) => i === index ? { ...item, product_slug: e.target.value } : item))} className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm">{ALL_PRODUCTS.map((product) => <option key={product.slug} value={product.slug}>{product.name}</option>)}</select></label><label className="text-xs font-medium text-muted-foreground">Quantity<input type="number" min="1" step="1" value={line.quantity} onChange={(e) => setLines(lines.map((item, i) => i === index ? { ...item, quantity: e.target.value } : item))} className="mt-1 h-10 w-full rounded-lg border px-3" /></label><p className="pb-2 text-right text-sm font-semibold">{money(Number(line.quantity || 0) * Number(prices[line.product_slug] || 0))}</p><button type="button" disabled={lines.length === 1} onClick={() => setLines(lines.filter((_, i) => i !== index))} className="h-10 rounded-lg border text-sm disabled:opacity-30">Remove</button></div>)}</div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><button type="button" onClick={() => setLines([...lines, { product_slug: ALL_PRODUCTS[0]?.slug || '', quantity: '1' }])} className="rounded-lg border px-3 py-2 text-sm font-semibold">Add product</button><div className="flex items-center gap-4"><span className="text-lg font-bold">Estimated {money(estimatedTotal)}</span><button disabled={saving} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">{saving ? 'Creating…' : 'Confirm order'}</button></div></div>
    </form>

    <section className="mt-8"><h2 className="text-xl font-semibold">Recent retailer orders</h2><div className="mt-4 space-y-3">{orders.map((order) => <article key={order.id} className="rounded-2xl border bg-background p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Order #{order.id} · {order.retailers?.business_name || 'Retailer'}</p><p className="mt-1 text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString('en-IN')} · {order.payment_type} · {order.payment_status} · due {order.due_date || 'on receipt'}</p><p className="mt-2 text-sm">{(order.retailer_order_items || []).map((item: any) => item.product_name + ' × ' + item.quantity).join(', ')}</p></div><div className="flex items-center gap-3"><p className="text-lg font-bold text-primary">{money(order.total)}</p><select value={order.order_status} onChange={(e) => void updateStatus(order, e.target.value)} className="h-10 rounded-lg border bg-background px-2 text-sm"><option value="confirmed">Confirmed</option><option value="packing">Packing</option><option value="dispatched">Dispatched</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></div></div></article>)}</div></section>
  </div></main></>
}
