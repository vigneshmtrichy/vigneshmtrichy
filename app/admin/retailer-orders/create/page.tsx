'use client'

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
  searchable = false,
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
  searchable?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value)
  const filteredOptions = searchable
    ? options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options

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
        onClick={() => { setOpen((current) => !current); setQuery('') }}
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
          {searchable && (
            <div className="border-b p-2">
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search..."
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>
          )}
          <div className="max-h-72 overflow-y-auto" role="listbox">
            {filteredOptions.map((option) => {
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
            {searchable && filteredOptions.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">No matches found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}



export default function CreateRetailerOrderPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [requestedRetailerId, setRequestedRetailerId] = useState('')
  const [retailers, setRetailers] = useState<Retailer[]>([])
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAuthorized(user?.email === 'info@tenoo.in'))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setRequestedRetailerId(params.get('retailer') || '')
  }, [])

  useEffect(() => {
    if (!authorized) return
    const loadRetailers = async () => {
      const { data, error } = await supabase
        .from('retailers')
        .select('id, business_name, payment_terms_days, credit_limit')
        .eq('status', 'active')
        .order('business_name')

      if (error) {
        setMessage(error.message)
        return
      }

      const activeRetailers = (data || []) as Retailer[]
      setRetailers(activeRetailers)
      if (requestedRetailerId && activeRetailers.some((retailer) => retailer.id === requestedRetailerId)) {
        setRetailerId(requestedRetailerId)
      }
    }

    void loadRetailers()
  }, [authorized, requestedRetailerId])

  useEffect(() => {
    if (!retailerId) {
      setPrices({})
      setGstRates({})
      setRetailerBalance({ outstanding: 0, unapplied: 0 })
      return
    }

    const loadRetailerData = async () => {
      const [{ data: balance }, { data: defaults }, { data: overrides }] = await Promise.all([
        supabase.from('retailer_balances').select('outstanding_balance, unapplied_credit').eq('retailer_id', retailerId).maybeSingle(),
        supabase.from('product_status').select('product_slug, retailer_price, gst_rate'),
        supabase.from('retailer_product_prices').select('product_slug, unit_price').eq('retailer_id', retailerId),
      ])

      setRetailerBalance({
        outstanding: Number(balance?.outstanding_balance || 0),
        unapplied: Number(balance?.unapplied_credit || 0),
      })

      const nextPrices: Record<string, number> = {}
      const nextGstRates: Record<string, number> = {}

      ;(defaults || []).forEach((row: any) => {
        nextPrices[row.product_slug] = Number(row.retailer_price || 0)
        nextGstRates[row.product_slug] = Number(row.gst_rate ?? 5)
      })

      ;(overrides || []).forEach((row: any) => {
        nextPrices[row.product_slug] = Number(row.unit_price || 0)
      })

      setPrices(nextPrices)
      setGstRates(nextGstRates)
    }

    void loadRetailerData()
  }, [retailerId])

  const estimatedTaxableTotal = useMemo(
    () => lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(prices[line.product_slug] || 0), 0),
    [lines, prices]
  )

  const estimatedGstTotal = useMemo(
    () => lines.reduce((sum, line) => {
      const taxable = Number(line.quantity || 0) * Number(prices[line.product_slug] || 0)
      return sum + taxable * Number(gstRates[line.product_slug] ?? 5) / 100
    }, 0),
    [lines, prices, gstRates]
  )

  const estimatedTotal = Math.round((estimatedTaxableTotal + estimatedGstTotal) * 100) / 100
  const missingRetailerPrice = lines.some((line) => Number(prices[line.product_slug] || 0) <= 0)
  const selectedRetailer = retailers.find((retailer) => retailer.id === retailerId)

  const creditRequired = paymentType === 'prepaid'
    ? 0
    : Math.max(
        estimatedTotal -
          (paymentType === 'partial' ? Number(initialPayment || 0) : 0) -
          retailerBalance.unapplied,
        0
      )

  const availableCredit = Math.max(
    Number(selectedRetailer?.credit_limit || 0) - retailerBalance.outstanding,
    0
  )
  const creditExceeded = Boolean(retailerId && creditRequired > availableCredit)

  const createOrder = async (event: FormEvent) => {
    event.preventDefault()

    if (!retailerId) {
      setMessage('Choose a retailer.')
      return
    }

    if (missingRetailerPrice) {
      setMessage('Set the retailer price for every selected product in Product Settings before creating the order.')
      return
    }

    const payload = lines.map((line) => ({
      product_slug: line.product_slug,
      quantity: Number(line.quantity),
    }))

    if (payload.some((line) => !line.product_slug || !Number.isSafeInteger(line.quantity) || line.quantity < 1)) {
      setMessage('Every line needs a product and whole quantity.')
      return
    }

    const requestedInitialPayment = paymentType === 'prepaid'
      ? estimatedTotal
      : paymentType === 'partial'
        ? Number(initialPayment || 0)
        : 0

    if (
      paymentType === 'partial' &&
      (!Number.isFinite(requestedInitialPayment) || requestedInitialPayment <= 0 || requestedInitialPayment >= estimatedTotal)
    ) {
      setMessage('For partial payment, enter an amount greater than zero and less than the estimated order total.')
      return
    }

    setSaving(true)
    setMessage('')

    const { data, error } = await supabase.rpc('create_retailer_order_with_stock', {
      p_retailer_id: retailerId,
      p_items: payload,
      p_payment_type: paymentType,
      p_due_date: null,
      p_notes: notes.trim() || null,
      p_initial_payment: requestedInitialPayment,
      p_initial_payment_method: initialPaymentMethod,
      p_initial_payment_reference: initialPaymentReference.trim() || null,
    })

    setSaving(false)

    if (error || !data?.success) {
      setMessage(error?.message || data?.message || 'Unable to create retailer order.')
      return
    }

    setLines([{ product_slug: ALL_PRODUCTS[0]?.slug || '', quantity: '1' }])
    setInitialPayment('')
    setInitialPaymentReference('')
    setNotes('')
    setMessage('Retailer order #' + data.order_id + ' created and stock reserved.')
  }

  if (authorized === null) return <><SiteHeader /><main className="p-10 text-center">Loading…</main></>
  if (!authorized) return <><SiteHeader /><main className="p-10 text-center">Admin access only.</main></>

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-muted/20 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Create Trade Order</h1>
              <p className="mt-1 text-sm text-muted-foreground">Create a retailer order at the approved retailer price; stock is reserved immediately.</p>
            </div>
            <a href="/admin/retailer-orders" className="rounded-lg border px-4 py-2.5 text-center text-sm font-semibold transition hover:bg-muted">View Trade Orders</a>
          </div>

          <form onSubmit={createOrder} className="mt-6 rounded-2xl border bg-background p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-medium">
                Retailer
                <CustomSelect
                  value={retailerId}
                  onChange={(value) => { setRetailerId(value); setMessage('') }}
                  placeholder="Select retailer"
                  className="mt-1"
                  searchable
                  options={retailers.map((retailer) => ({ value: retailer.id, label: retailer.business_name }))}
                />
              </label>
              <label className="text-sm font-medium">
                Payment
                <CustomSelect
                  value={paymentType}
                  onChange={(value) => { setPaymentType(value); setMessage('') }}
                  className="mt-1"
                  options={[
                    { value: 'credit', label: 'Credit' },
                    { value: 'prepaid', label: 'Prepaid' },
                    { value: 'partial', label: 'Partial payment' },
                    { value: 'cod', label: 'Cash on delivery' },
                  ]}
                />
              </label>
              <label className="text-sm font-medium">
                Order note
                <input value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 h-11 w-full rounded-lg border bg-background px-3" placeholder="Optional" />
              </label>
            </div>

            {(paymentType === 'partial' || paymentType === 'prepaid') && (
              <div className="mt-4 grid gap-3 rounded-xl border bg-muted/30 p-4 sm:grid-cols-3">
                <label className="text-xs font-medium text-muted-foreground">
                  Initial payment {paymentType === 'prepaid' ? '(full total)' : '(₹)'}
                  <input value={paymentType === 'prepaid' ? String(estimatedTotal || '') : initialPayment} onChange={(event) => setInitialPayment(event.target.value)} disabled={paymentType === 'prepaid'} type="number" min="0" step="0.01" className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm" />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  Payment method
                  <CustomSelect value={initialPaymentMethod} onChange={setInitialPaymentMethod} className="mt-1" options={[{ value: 'upi', label: 'UPI' }, { value: 'bank-transfer', label: 'Bank transfer' }, { value: 'cash', label: 'Cash' }, { value: 'cheque', label: 'Cheque' }, { value: 'other', label: 'Other' }]} />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  Reference
                  <input value={initialPaymentReference} onChange={(event) => setInitialPaymentReference(event.target.value)} placeholder="Optional" className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm" />
                </label>
              </div>
            )}

            {paymentType !== 'prepaid' && retailerBalance.unapplied > 0 && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <p className="font-semibold">Unapplied credit available: {money(retailerBalance.unapplied)}</p>
                <p className="mt-1">This existing credit will be automatically applied to this order.</p>
              </div>
            )}

            {creditExceeded && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-semibold">Credit limit exceeded</p>
                <p className="mt-1">Available credit: {money(availableCredit)} · Required credit after existing credit: {money(creditRequired)}. Reduce the quantity, record a payment, or choose prepaid.</p>
              </div>
            )}

            <div className="mt-5 space-y-3">
              {lines.map((line, index) => (
                <div key={index} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_100px_120px_80px] sm:items-end sm:border-0 sm:p-0">
                  <label className="text-xs font-medium text-muted-foreground">
                    Product
                    <CustomSelect
                      value={line.product_slug}
                      onChange={(value) => {
                        setLines(lines.map((item, i) => i === index ? { ...item, product_slug: value } : item))
                        setMessage('')
                      }}
                      className="mt-1"
                      searchable
                      options={ALL_PRODUCTS.map((product) => ({ value: product.slug, label: product.name }))}
                    />
                  </label>
                  <label className="text-xs font-medium text-muted-foreground">
                    Quantity
                    <input type="number" min="1" step="1" value={line.quantity} onChange={(event) => setLines(lines.map((item, i) => i === index ? { ...item, quantity: event.target.value } : item))} className="mt-1 h-10 w-full rounded-lg border px-3" />
                  </label>
                  <p className="pb-2 text-right text-sm font-semibold">
                    {Number(prices[line.product_slug] || 0) > 0
                      ? <span>{money(Number(line.quantity || 0) * Number(prices[line.product_slug] || 0))}<span className="ml-2 text-xs font-normal text-muted-foreground">+ {Number(gstRates[line.product_slug] ?? 5)}% GST</span></span>
                      : 'Retailer price not set'}
                  </p>
                  <button type="button" disabled={lines.length === 1} onClick={() => setLines(lines.filter((_, i) => i !== index))} className="h-10 rounded-lg border text-sm shadow-sm transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-md active:scale-[0.99] disabled:opacity-30">Remove</button>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => setLines([...lines, { product_slug: ALL_PRODUCTS[0]?.slug || '', quantity: '1' }])} className="w-full rounded-lg border px-3 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-muted sm:w-auto">Add product</button>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="text-right">
                  <span className="block text-lg font-bold">Estimated {money(estimatedTotal)}</span>
                  <span className="block text-xs font-normal text-muted-foreground">Taxable {money(estimatedTaxableTotal)} · GST {money(estimatedGstTotal)}</span>
                </span>
                {message && (
                  <p className={`w-full rounded-xl border px-4 py-3 text-sm font-medium ${message.startsWith('Retailer order #')
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-red-200 bg-red-50 text-red-800'}`}>
                    {message}
                  </p>
                )}
                <button type="submit" disabled={saving || creditExceeded || missingRetailerPrice || !retailerId} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50">
                  {saving ? 'Creating…' : 'Confirm order'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </>
  )
}
