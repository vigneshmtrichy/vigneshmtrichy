'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ALL_PRODUCTS } from '@/lib/site'
import { SiteHeader } from '@/components/site-header'
import { supabase } from '@/lib/supabase'
import { Check, ChevronDown } from 'lucide-react'

type Retailer = { id: string; business_name: string; payment_terms_days: number; credit_limit: number }
type OrderLine = { product_slug: string; quantity: string }

const money = (value: unknown) => '₹' + Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })

type SelectOption = { value: string; label: string }

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  disabled = false,
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full items-center justify-between rounded-lg border bg-background px-3 text-left text-sm transition hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? 'truncate text-foreground' : 'truncate text-muted-foreground'}>
          {selected?.label || placeholder || 'Select'}
        </span>
        <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[80] overflow-hidden rounded-xl border bg-background p-1 shadow-lg">
          <div className="max-h-72 overflow-y-auto" role="listbox">
            {options.map((option) => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted ${isSelected ? 'bg-muted font-semibold' : ''}`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="ml-2 h-4 w-4 shrink-0 text-primary" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function RetailerOrdersPage() {
  const [requestedRetailerId, setRequestedRetailerId] = useState('')
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [retailerId, setRetailerId] = useState('')
  const [lines, setLines] = useState<OrderLine[]>([{ product_slug: ALL_PRODUCTS[0]?.slug || '', quantity: '1' }])
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [gstRates, setGstRates] = useState<Record<string, number>>({})
  const [paymentType, setPaymentType] = useState('credit')
  const [initialPayment, setInitialPayment] = useState('')
  const [initialPaymentMethod, setInitialPaymentMethod] = useState('upi')
  const [initialPaymentReference, setInitialPaymentReference] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [retailerBalance, setRetailerBalance] = useState({ outstanding: 0, unapplied: 0 })

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
    const params = new URLSearchParams(window.location.search)
    setRequestedRetailerId(params.get('retailer') || '')
  }, [])

  useEffect(() => {
    if (!retailerId && requestedRetailerId && retailers.some((retailer) => retailer.id === requestedRetailerId)) {
      setRetailerId(requestedRetailerId)
    }
  }, [requestedRetailerId, retailerId, retailers])

  useEffect(() => {
    if (!retailerId) { setPrices({}); setGstRates({}); setRetailerBalance({ outstanding: 0, unapplied: 0 }); return }
    const loadBalance = async () => {
      const { data } = await supabase.from('retailer_balances').select('outstanding_balance, unapplied_credit').eq('retailer_id', retailerId).maybeSingle()
      setRetailerBalance({ outstanding: Number(data?.outstanding_balance || 0), unapplied: Number(data?.unapplied_credit || 0) })
    }
    void loadBalance()
    const loadPrices = async () => {
      const [{ data: defaults }, { data: overrides }] = await Promise.all([
        supabase.from('product_status').select('product_slug, retailer_price, gst_rate'),
        supabase.from('retailer_product_prices').select('product_slug, unit_price').eq('retailer_id', retailerId),
      ])
      const next: Record<string, number> = {}
      const nextGst: Record<string, number> = {}
      defaults?.forEach((row: any) => {
        next[row.product_slug] = Number(row.retailer_price || 0)
        nextGst[row.product_slug] = Number(row.gst_rate ?? 5)
      })
      overrides?.forEach((row: any) => {
        next[row.product_slug] = Number(row.unit_price)
      })
      setPrices(next)
      setGstRates(nextGst)
    }
    void loadPrices()
  }, [retailerId])

  const estimatedTaxableTotal = useMemo(() => lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(prices[line.product_slug] || 0), 0), [lines, prices])
  const estimatedGstTotal = useMemo(() => lines.reduce((sum, line) => {
    const taxable = Number(line.quantity || 0) * Number(prices[line.product_slug] || 0)
    return sum + taxable * Number(gstRates[line.product_slug] ?? 5) / 100
  }, 0), [lines, prices, gstRates])
  const estimatedTotal = Math.round((estimatedTaxableTotal + estimatedGstTotal) * 100) / 100
  const missingRetailerPrice = lines.some((line) => Number(prices[line.product_slug] || 0) <= 0)
  const selectedRetailer = retailers.find((retailer) => retailer.id === retailerId)
  const creditRequired = paymentType === 'prepaid' ? 0 : Math.max(estimatedTotal - (paymentType === 'partial' ? Number(initialPayment || 0) : 0) - retailerBalance.unapplied, 0)
  const availableCredit = Math.max(Number(selectedRetailer?.credit_limit || 0) - retailerBalance.outstanding, 0)
  const creditExceeded = Boolean(retailerId && creditRequired > availableCredit)

  const createOrder = async (event: FormEvent) => {
    event.preventDefault()
    if (!retailerId) { setMessage('Choose a retailer.'); return }
    if (missingRetailerPrice) {
      setMessage('Set the retailer price for every selected product in Product Settings before creating the order.')
      return
    }
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
      <div className="grid gap-4 sm:grid-cols-3"><label className="text-sm font-medium">Retailer<CustomSelect value={retailerId} onChange={setRetailerId} placeholder="Select retailer" className="mt-1" options={retailers.map((r) => ({ value: r.id, label: r.business_name }))} /></label>
      <label className="text-sm font-medium">Payment<CustomSelect value={paymentType} onChange={setPaymentType} className="mt-1" options={[{ value: 'credit', label: 'Credit' }, { value: 'prepaid', label: 'Prepaid' }, { value: 'partial', label: 'Partial payment' }, { value: 'cod', label: 'Cash on delivery' }]} /></label>
      <label className="text-sm font-medium">Order note<input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 h-11 w-full rounded-lg border bg-background px-3" placeholder="Optional" /></label></div>
      {(paymentType === 'partial' || paymentType === 'prepaid') && <div className="mt-4 grid gap-3 rounded-xl border bg-muted/30 p-4 sm:grid-cols-3">
        <label className="text-xs font-medium text-muted-foreground">Initial payment {paymentType === 'prepaid' ? '(full total)' : '(₹)'}
          <input value={paymentType === 'prepaid' ? String(estimatedTotal || '') : initialPayment} onChange={(e) => setInitialPayment(e.target.value)} disabled={paymentType === 'prepaid'} type="number" min="0" step="0.01" className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm" />
        </label>
        <label className="text-xs font-medium text-muted-foreground">Payment method
          <CustomSelect value={initialPaymentMethod} onChange={setInitialPaymentMethod} className="mt-1" options={[{ value: 'upi', label: 'UPI' }, { value: 'bank-transfer', label: 'Bank transfer' }, { value: 'cash', label: 'Cash' }, { value: 'cheque', label: 'Cheque' }, { value: 'other', label: 'Other' }]} />
        </label>
        <label className="text-xs font-medium text-muted-foreground">Reference
          <input value={initialPaymentReference} onChange={(e) => setInitialPaymentReference(e.target.value)} placeholder="Optional" className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm" />
        </label>
      </div>}
      {paymentType !== 'prepaid' && retailerBalance.unapplied > 0 && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"><p className="font-semibold">Unapplied credit available: {money(retailerBalance.unapplied)}</p><p className="mt-1">This existing credit will be automatically applied to this order.</p></div>}{creditExceeded && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><p className="font-semibold">Credit limit exceeded</p><p className="mt-1">Available credit: {money(availableCredit)} · Required credit after existing credit: {money(creditRequired)}. Reduce the quantity, record a payment, or choose prepaid.</p></div>}
      <div className="mt-5 space-y-3">{lines.map((line, index) => <div key={index} className="grid gap-2 sm:grid-cols-[1fr_100px_120px_80px] sm:items-end"><label className="text-xs font-medium text-muted-foreground">Product<CustomSelect value={line.product_slug} onChange={(value) => setLines(lines.map((item, i) => i === index ? { ...item, product_slug: value } : item))} className="mt-1" options={ALL_PRODUCTS.map((product) => ({ value: product.slug, label: product.name }))} /></label><label className="text-xs font-medium text-muted-foreground">Quantity<input type="number" min="1" step="1" value={line.quantity} onChange={(e) => setLines(lines.map((item, i) => i === index ? { ...item, quantity: e.target.value } : item))} className="mt-1 h-10 w-full rounded-lg border px-3" /></label><p className="pb-2 text-right text-sm font-semibold">{Number(prices[line.product_slug] || 0) > 0 ? <span>{money(Number(line.quantity || 0) * Number(prices[line.product_slug] || 0))}<span className="ml-2 text-xs font-normal text-muted-foreground">+ {Number(gstRates[line.product_slug] ?? 5)}% GST</span></span> : 'Retailer price not set'}</p><button type="button" disabled={lines.length === 1} onClick={() => setLines(lines.filter((_, i) => i !== index))} className="h-10 rounded-lg border text-sm disabled:opacity-30">Remove</button></div>)}</div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><button type="button" onClick={() => setLines([...lines, { product_slug: ALL_PRODUCTS[0]?.slug || '', quantity: '1' }])} className="rounded-lg border px-3 py-2 text-sm font-semibold">Add product</button><div className="flex items-center gap-4"><span className="text-right"><span className="block text-lg font-bold">Estimated {money(estimatedTotal)}</span><span className="block text-xs font-normal text-muted-foreground">Taxable {money(estimatedTaxableTotal)} · GST {money(estimatedGstTotal)}</span></span><button disabled={saving || creditExceeded || missingRetailerPrice} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">{saving ? 'Creating…' : 'Confirm order'}</button></div></div>
    </form>

    <section className="mt-8"><h2 className="text-xl font-semibold">Recent retailer orders</h2><div className="mt-4 space-y-3">{orders.map((order) => <article key={order.id} className="rounded-2xl border bg-background p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Order #{order.id} · {order.retailers?.business_name || 'Retailer'}</p><p className="mt-1 text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString('en-IN')} · {order.payment_type} · {order.payment_status} · due {order.due_date || 'on receipt'}</p><p className="mt-2 text-sm">{(order.retailer_order_items || []).map((item: any) => item.product_name + ' × ' + item.quantity).join(', ')}</p></div><div className="flex items-center gap-3"><a href={`/admin/retailer-orders/invoice/${order.id}`} className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted">Invoice</a><p className="text-lg font-bold text-primary">{money(order.total)}</p><CustomSelect value={order.order_status} onChange={(value) => void updateStatus(order, value)} className="w-44" options={[{ value: 'confirmed', label: 'Confirmed' }, { value: 'packing', label: 'Packing' }, { value: 'dispatched', label: 'Dispatched' }, { value: 'delivered', label: 'Delivered' }, { value: 'cancelled', label: 'Cancelled' }]} /></div></div></article>)}</div></section>
  </div></main></>
}
