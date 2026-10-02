'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ALL_PRODUCTS } from '@/lib/site'
import { SiteHeader } from '@/components/site-header'
import { supabase } from '@/lib/supabase'
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

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

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const initialDate = value ? new Date(value + 'T00:00:00') : new Date()
  const [viewDate, setViewDate] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1))

  useEffect(() => {
    if (value) {
      const selected = new Date(value + 'T00:00:00')
      if (!Number.isNaN(selected.getTime())) setViewDate(new Date(selected.getFullYear(), selected.getMonth(), 1))
    }
  }, [value])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDay + 1
    return day >= 1 && day <= daysInMonth ? day : null
  })
  const monthLabel = viewDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const selectedLabel = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-GB')
    : 'dd-mm-yyyy'

  const selectDate = (day: number) => {
    const next = new Date(year, month, day)
    const iso = [next.getFullYear(), String(next.getMonth() + 1).padStart(2, '0'), String(next.getDate()).padStart(2, '0')].join('-')
    onChange(iso)
    setOpen(false)
  }

  const chooseToday = () => {
    const today = new Date()
    const iso = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-')
    onChange(iso)
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))
    setOpen(false)
  }

  return (
    <div>
      <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-full items-center justify-between rounded-lg border bg-background px-3 text-left text-sm transition hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-label={label}
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>{selectedLabel}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4" onMouseDown={() => setOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl border bg-background p-4 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="rounded-lg p-2 hover:bg-muted" aria-label="Previous month"><ChevronLeft className="h-5 w-5" /></button>
              <p className="text-sm font-semibold">{monthLabel}</p>
              <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="rounded-lg p-2 hover:bg-muted" aria-label="Next month"><ChevronRight className="h-5 w-5" /></button>
            </div>
            <div className="mt-3 grid grid-cols-7 text-center text-xs font-semibold text-muted-foreground">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day} className="py-2">{day}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, index) => {
                const isSelected = day !== null && value === [year, String(month + 1).padStart(2, '0'), String(day).padStart(2, '0')].join('-')
                return day === null ? <span key={index} className="h-10" /> : (
                  <button key={index} type="button" onClick={() => selectDate(day)} className={`h-10 rounded-lg text-sm hover:bg-muted ${isSelected ? 'bg-primary text-primary-foreground font-semibold hover:bg-primary' : ''}`}>
                    {day}
                  </button>
                )
              })}
            </div>
            <div className="mt-3 flex justify-between border-t pt-3">
              <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-muted">Clear</button>
              <button type="button" onClick={chooseToday} className="rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-muted">Today</button>
            </div>
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
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalOrderCount, setTotalOrderCount] = useState(0)
  const [statusHistory, setStatusHistory] = useState<Record<string, any[]>>({})
  const [statusHistoryError, setStatusHistoryError] = useState('')
  const [openHistory, setOpenHistory] = useState<Record<string, boolean>>({})
  const [cancelOrder, setCancelOrder] = useState<any | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const load = async () => {
    const { data: retailerRows } = await supabase
      .from('retailers')
      .select('id, business_name, payment_terms_days, credit_limit')
      .eq('status', 'active')
      .order('business_name')
    setRetailers((retailerRows || []) as Retailer[])

    const query = search.trim()
    let matchingOrderIds: number[] | null = null
    if (query) {
      if (/^\d+$/.test(query)) {
        matchingOrderIds = [Number(query)]
      } else {
        const [{ data: retailerMatches }, { data: productMatches }] = await Promise.all([
          supabase.from('retailers').select('id').ilike('business_name', '%' + query + '%'),
          supabase.from('retailer_order_items').select('retailer_order_id').ilike('product_name', '%' + query + '%'),
        ])
        const retailerIds = (retailerMatches || []).map((row: any) => String(row.id))
        const productOrderIds = (productMatches || []).map((row: any) => Number(row.retailer_order_id)).filter(Number.isFinite)
        if (productOrderIds.length) {
          matchingOrderIds = productOrderIds
          if (retailerIds.length) {
            const { data: retailerOrderMatches } = await supabase.from('retailer_orders').select('id').in('retailer_id', retailerIds)
            matchingOrderIds = Array.from(new Set([...matchingOrderIds, ...(retailerOrderMatches || []).map((row: any) => Number(row.id))]))
          }
        } else if (retailerIds.length) {
          const { data: retailerOrderMatches } = await supabase.from('retailer_orders').select('id').in('retailer_id', retailerIds)
          matchingOrderIds = (retailerOrderMatches || []).map((row: any) => Number(row.id))
        } else {
          matchingOrderIds = []
        }
      }
    }

    let orderQuery = supabase
      .from('retailer_orders')
      .select('*, retailers(business_name), retailer_order_items(*)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') orderQuery = orderQuery.eq('order_status', statusFilter)
    if (paymentFilter !== 'all') orderQuery = orderQuery.eq('payment_status', paymentFilter)
    if (dateFrom) orderQuery = orderQuery.gte('created_at', new Date(dateFrom + 'T00:00:00+05:30').toISOString())
    if (dateTo) orderQuery = orderQuery.lte('created_at', new Date(dateTo + 'T23:59:59.999+05:30').toISOString())
    if (matchingOrderIds) {
      if (matchingOrderIds.length === 0) {
        setOrders([])
        setTotalOrderCount(0)
        setStatusHistory({})
        setStatusHistoryError('')
        return
      }
      orderQuery = orderQuery.in('id', matchingOrderIds)
    }

    const from = (currentPage - 1) * pageSize
    const { data: orderRows, count: orderCount, error: orderError } = await orderQuery.range(from, from + pageSize - 1)
    if (orderError) {
      setMessage(orderError.message)
      setOrders([])
      setTotalOrderCount(0)
      return
    }

    const nextOrders = orderRows || []
    setOrders(nextOrders)
    setTotalOrderCount(orderCount || 0)
    const ids = nextOrders.map((order: any) => order.id)
    setStatusHistoryError('')
    if (ids.length) {
      const { data: historyRows, error: historyError } = await supabase.from('retailer_order_status_history').select('retailer_order_id, old_status, new_status, note, changed_by, changed_at').in('retailer_order_id', ids).order('changed_at', { ascending: false })
      if (historyError) {
        setStatusHistory({})
        setStatusHistoryError(historyError.message)
      } else {
        const grouped: Record<string, any[]> = {}
        ;(historyRows || []).forEach((row: any) => { const key = String(row.retailer_order_id); if (!grouped[key]) grouped[key] = []; grouped[key].push(row) })
        setStatusHistory(grouped)
      }
    } else {
      setStatusHistory({})
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const ok = user?.email === 'info@tenoo.in'
      setAuthorized(ok)
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

  const totalPages = Math.max(1, Math.ceil(totalOrderCount / pageSize))
  const paginatedOrders = orders

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, paymentFilter, dateFrom, dateTo])

  useEffect(() => {
    if (authorized) void load()
  }, [authorized, currentPage, pageSize, search, statusFilter, paymentFilter, dateFrom, dateTo])

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
    if (order_status === 'cancelled') {
      setCancelOrder(order)
      setCancelReason('')
      return
    }
    const { error } = await supabase.from('retailer_orders').update({ order_status, updated_at: new Date().toISOString() }).eq('id', order.id)
    setMessage(error ? error.message : 'Order status updated.')
    if (!error) await load()
  }

  const confirmCancellation = async () => {
    if (!cancelOrder) return
    const reason = cancelReason.trim()
    if (!reason) {
      setMessage('Enter a cancellation reason.')
      return
    }
    const notes = [cancelOrder.notes, 'Cancellation reason: ' + reason].filter(Boolean).join(' · ')
    const { error } = await supabase.from('retailer_orders').update({ order_status: 'cancelled', notes, updated_at: new Date().toISOString() }).eq('id', cancelOrder.id)
    setMessage(error ? error.message : 'Order cancelled. Stock and payment allocation have been restored.')
    if (!error) {
      setCancelOrder(null)
      setCancelReason('')
      await load()
    }
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

    <section className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold">Retailer orders</h2><p className="mt-1 text-xs text-muted-foreground">Server-side pagination · filters and search are applied before loading the page.</p></div><p className="text-sm text-muted-foreground">{totalOrderCount} shown · Page {currentPage}/{totalPages}</p></div>
      <div className="mt-4 grid gap-3 rounded-2xl border bg-background p-3 sm:grid-cols-2 lg:grid-cols-5">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order, retailer or product" className="h-11 rounded-lg border bg-background px-3 text-sm lg:col-span-2" />
        <CustomSelect value={statusFilter} onChange={setStatusFilter} className="w-full" options={[{ value: 'all', label: 'All order statuses' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'packing', label: 'Packing' }, { value: 'dispatched', label: 'Dispatched' }, { value: 'delivered', label: 'Delivered' }, { value: 'cancelled', label: 'Cancelled' }]} />
        <CustomSelect value={paymentFilter} onChange={setPaymentFilter} className="w-full" options={[{ value: 'all', label: 'All payment statuses' }, { value: 'paid', label: 'Paid' }, { value: 'partial', label: 'Partial' }, { value: 'unpaid', label: 'Unpaid' }]} />
        <div className="grid grid-cols-2 gap-2">
          <DateFilter label="From date" value={dateFrom} onChange={setDateFrom} />
          <DateFilter label="To date" value={dateTo} onChange={setDateTo} />
        </div>
      </div>
      {statusHistoryError && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">Status history could not be loaded: {statusHistoryError}</p>}
      <div className="mt-4 space-y-3">{paginatedOrders.map((order) => <article key={order.id} className="rounded-2xl border bg-background p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-semibold">Order #{order.id} · {order.retailers?.business_name || 'Retailer'}</p><p className="mt-1 text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString('en-IN')} · {order.payment_type} · {order.payment_status} · due {order.due_date || 'on receipt'}</p><p className="mt-2 text-sm">{(order.retailer_order_items || []).map((item: any) => item.product_name + ' × ' + item.quantity).join(', ')}</p></div><div className="flex flex-wrap items-center gap-2"><a href={`/admin/retailer-orders/invoice/${order.id}`} className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted">Invoice</a><p className="text-lg font-bold text-primary">{money(order.total)}</p><CustomSelect value={order.order_status} onChange={(value) => void updateStatus(order, value)} className="w-44" options={[{ value: 'confirmed', label: 'Confirmed' }, { value: 'packing', label: 'Packing' }, { value: 'dispatched', label: 'Dispatched' }, { value: 'delivered', label: 'Delivered' }, { value: 'cancelled', label: 'Cancelled' }]} /></div></div>
        {order.order_status === 'cancelled' && order.notes?.includes('Cancellation reason:') && <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{order.notes.split('Cancellation reason:').pop()?.trim()}</p>}
        {statusHistory[String(order.id)]?.length > 0 && <div className="mt-3"><button type="button" onClick={() => setOpenHistory((current) => ({ ...current, [order.id]: !current[order.id] }))} className="text-xs font-semibold text-primary">{openHistory[order.id] ? 'Hide status history' : 'View status history'}</button>{openHistory[order.id] && <div className="mt-2 rounded-lg border bg-muted/30 p-3 text-xs">{statusHistory[String(order.id)].slice(0, 8).map((entry: any, index: number) => <div key={index} className="flex justify-between gap-3 border-b py-2 last:border-0"><span>{entry.old_status ? entry.old_status + ' → ' : ''}{entry.new_status}</span><span className="text-right text-muted-foreground">{new Date(entry.changed_at).toLocaleString('en-IN')}{entry.note ? ' · ' + entry.note : ''}</span></div>)}</div>}</div>}
      </article>)}</div>
      {totalOrderCount === 0 && <div className="mt-4 rounded-2xl border bg-background p-8 text-center text-sm text-muted-foreground">No retailer orders match these filters.</div>}      {totalOrderCount > 0 && totalPages > 1 && (
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalOrderCount)} of {totalOrderCount} orders
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Per page
              <CustomSelect value={String(pageSize)} onChange={(value) => { setPageSize(Number(value)); setCurrentPage(1) }} className="w-24" options={[{ value: '25', label: '25' }, { value: '50', label: '50' }, { value: '100', label: '100' }]} />
            </label>
            <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Previous</button>
            <span className="px-1 text-xs font-semibold">Page {currentPage} / {totalPages}</span>
            <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

    </section>
    {cancelOrder && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-md rounded-2xl border bg-background p-5 shadow-xl"><h3 className="text-lg font-semibold">Cancel order #{cancelOrder.id}?</h3><p className="mt-1 text-sm text-muted-foreground">Stock will be restored and allocated payment will become unapplied credit.</p><label className="mt-4 block text-sm font-medium">Cancellation reason<textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="mt-1 min-h-24 w-full rounded-lg border bg-background px-3 py-2" placeholder="Why is this order being cancelled?" autoFocus /></label><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setCancelOrder(null)} className="rounded-lg border px-4 py-2.5 text-sm font-semibold">Keep order</button><button type="button" onClick={() => void confirmCancellation()} className="rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground">Cancel order</button></div></div></div>}
  </div></main></>
}
