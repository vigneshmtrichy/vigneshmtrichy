'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ALL_PRODUCTS } from '@/lib/site'
import { SiteHeader } from '@/components/site-header'
import { supabase } from '@/lib/supabase'
import { Check, ChevronDown } from 'lucide-react'

type Retailer = {
  id: string
  business_name: string
  contact_name: string | null
  phone: string
  whatsapp: string | null
  city: string | null
  state: string | null
  gstin: string | null
  email: string | null
  billing_name: string | null
  address: string | null
  pincode: string | null
  status: 'prospect' | 'active' | 'on-hold' | 'inactive'
  payment_terms_days: number
  credit_limit: number
  notes: string | null
}

const emptyForm = {
  business_name: '', contact_name: '', phone: '', whatsapp: '', email: '', billing_name: '', address: '', city: '', state: '', pincode: '',
  gstin: '', payment_terms_days: '0', credit_limit: '0', notes: '',
}

const money = (value: unknown) => '₹' + Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
type SelectOption = { value: string; label: string }

function CustomSelect({ value, onChange, options, className = '', disabled = false }: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
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
      <button type="button" disabled={disabled} onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full items-center justify-between rounded-lg border bg-background px-3 text-left text-sm transition hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        aria-haspopup="listbox" aria-expanded={open}>
        <span className="truncate text-foreground">{selected?.label || 'Select'}</span>
        <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[80] overflow-hidden rounded-xl border bg-background p-1 shadow-lg">
          <div className="max-h-72 overflow-y-auto" role="listbox">
            {options.map((option) => {
              const isSelected = option.value === value
              return (
                <button key={option.value} type="button" role="option" aria-selected={isSelected}
                  onClick={() => { onChange(option.value); setOpen(false) }}
                  className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted ${isSelected ? 'bg-muted font-semibold' : ''}`}>
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


export default function RetailersPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [balances, setBalances] = useState<Record<string, any>>({})
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<Retailer | null>(null)
  const [selected, setSelected] = useState<Retailer | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [showSpecialPrices, setShowSpecialPrices] = useState(false)
  const retailerFormRef = useRef<HTMLFormElement>(null)

  const load = async () => {
    const { data: retailerRows, error } = await supabase.from('retailers').select('*').order('business_name')
    if (error) { setMessage('Unable to load retailers.'); return }
    const { data: balanceRows } = await supabase.from('retailer_balances').select('*')
    const nextBalances: Record<string, any> = {}
    balanceRows?.forEach((row: any) => { nextBalances[row.retailer_id] = row })
    setBalances(nextBalances)
    setRetailers((retailerRows || []) as Retailer[])
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const ok = user?.email === 'info@tenoo.in'
      setAuthorized(ok)
      if (ok) void load()
    })
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return retailers.filter((retailer) => !query ||
      [retailer.business_name, retailer.contact_name, retailer.phone, retailer.city]
        .some((value) => String(value || '').toLowerCase().includes(query)))
  }, [retailers, search])

  const saveRetailer = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.business_name.trim() || !form.phone.trim()) {
      setMessage('Business name and phone are required.')
      return
    }
    setSaving(true); setMessage('')
    const payload = {
      business_name: form.business_name.trim(), contact_name: form.contact_name.trim() || null,
      phone: form.phone.trim(), whatsapp: form.whatsapp.trim() || null, email: form.email.trim() || null,
      billing_name: form.billing_name.trim() || null, address: form.address.trim() || null,
      city: form.city.trim() || null, state: form.state.trim() || null, pincode: form.pincode.trim() || null,
      gstin: form.gstin.trim() || null,
      payment_terms_days: Number(form.payment_terms_days || 0),
      credit_limit: Number(form.credit_limit || 0), notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    }
    const result = editing
      ? await supabase.from('retailers').update(payload).eq('id', editing.id)
      : await supabase.from('retailers').insert(payload)
    setSaving(false)
    if (result.error) { setMessage(result.error.message); return }
    setForm(emptyForm); setEditing(null); setShowForm(false); setMessage('Retailer saved.')
    await load()
  }

  const editRetailer = (retailer: Retailer) => {
    setEditing(retailer)
    setForm({
      business_name: retailer.business_name, contact_name: retailer.contact_name || '', phone: retailer.phone,
      whatsapp: retailer.whatsapp || '', email: retailer.email || '', billing_name: retailer.billing_name || '',
      address: retailer.address || '', city: retailer.city || '', state: retailer.state || '', pincode: retailer.pincode || '',
      gstin: retailer.gstin || '', payment_terms_days: String(retailer.payment_terms_days || 0),
      credit_limit: String(retailer.credit_limit || 0), notes: retailer.notes || '',
    })
    setShowForm(true)
    window.setTimeout(() => {
      retailerFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  const selectRetailer = async (retailer: Retailer) => {
    setSelected(retailer); setMessage('')
    const { data } = await supabase.from('retailer_product_prices').select('product_slug, unit_price').eq('retailer_id', retailer.id)
    const next: Record<string, string> = {}
    data?.forEach((row: any) => { next[row.product_slug] = String(row.unit_price) })
    setPrices(next)
  }

  const savePrices = async () => {
    if (!selected) return
    setSaving(true); setMessage('')
    const rows = Object.entries(prices)
      .filter(([, value]) => value.trim() !== '')
      .map(([product_slug, value]) => ({ retailer_id: selected.id, product_slug, unit_price: Number(value), updated_at: new Date().toISOString() }))
    const { error: deleteError } = await supabase.from('retailer_product_prices').delete().eq('retailer_id', selected.id)
    const { error } = deleteError || rows.length === 0
      ? { error: deleteError }
      : await supabase.from('retailer_product_prices').upsert(rows)
    setSaving(false)
    setMessage(error ? error.message : 'Retailer-specific prices saved.')
  }

  const recordPayment = async () => {
    if (!selected) return
    const amount = Number(paymentAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage('Enter a valid payment amount.')
      return
    }
    setPaymentSaving(true); setMessage('')
    const { data, error } = await supabase.rpc('record_retailer_payment', {
      p_retailer_id: selected.id,
      p_amount: amount,
      p_payment_method: paymentMethod,
      p_reference: paymentReference.trim() || null,
      p_notes: paymentNotes.trim() || null,
    })
    setPaymentSaving(false)
    if (error || !data?.success) {
      setMessage(error?.message || data?.message || 'Unable to record payment.')
      return
    }
    const unapplied = Number(data.unapplied_amount || 0)
    setMessage(unapplied > 0
      ? 'Payment recorded. ₹' + unapplied.toLocaleString('en-IN') + ' remains as unapplied credit.'
      : 'Payment recorded and allocated to outstanding orders.')
    setPaymentAmount(''); setPaymentReference(''); setPaymentNotes(''); setPaymentMethod('upi'); setShowPaymentModal(false)
    await load()
  }

  if (authorized === null) return <><SiteHeader /><main className="p-10 text-center">Loading…</main></>
  if (!authorized) return <><SiteHeader /><main className="p-10 text-center">Admin access only.</main></>

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-muted/20 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><h1 className="text-3xl font-semibold sm:text-3xl">Retailers</h1><p className="mt-1 text-sm text-muted-foreground">Accounts, credit, price overrides and collections.</p></div>
            <div className="flex gap-2 sm:flex-row">
              <Link href="/admin/retailer-orders" className="flex-1 rounded-xl border bg-background px-3 py-2.5 text-center text-sm font-semibold sm:flex-none sm:px-4">Retailer Orders</Link>
              <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true) }} className="flex-1 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground sm:flex-none sm:px-4">Add Retailer</button>
            </div>
          </div>

          {message && <p className="mt-4 rounded-xl border bg-background px-4 py-3 text-sm">{message}</p>}

          {showForm && <form ref={retailerFormRef} onSubmit={saveRetailer} className="mt-5 scroll-mt-24 grid gap-3 rounded-2xl border bg-background p-5 sm:grid-cols-2">
            <h2 className="sm:col-span-2 font-semibold">{editing ? 'Edit retailer' : 'New retailer'}</h2>
            {Object.entries(form).map(([key, value]) => <label key={key} className="text-xs font-medium text-muted-foreground">{key.replaceAll('_', ' ')}
              <input required={key === 'business_name' || key === 'phone'} value={value} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground" type={key.includes('limit') || key.includes('days') ? 'number' : 'text'} />
            </label>)}
            <div className="sm:col-span-2 flex gap-2"><button disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{saving ? 'Saving…' : 'Save retailer'}</button><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button></div>
          </form>}

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-6 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
            <div className="rounded-xl border bg-background p-3 sm:rounded-2xl sm:p-4"><p className="text-xs text-muted-foreground">Active retailers</p><p className="mt-1 text-xl font-semibold sm:text-2xl">{retailers.filter((r) => r.status === 'active').length}</p></div>
            <div className="rounded-2xl border bg-background p-4"><p className="text-xs text-muted-foreground">Total outstanding</p><p className="mt-1 text-2xl font-semibold text-amber-700">{money(Object.values(balances).reduce((sum: number, row: any) => sum + Number(row.outstanding_balance || 0), 0))}</p></div>
            <div className="rounded-2xl border bg-background p-4"><p className="text-xs text-muted-foreground">Unapplied credit</p><p className="mt-1 text-2xl font-semibold text-emerald-700">{money(Object.values(balances).reduce((sum: number, row: any) => sum + Number(row.unapplied_credit || 0), 0))}</p></div>
            <div className="rounded-2xl border bg-background p-4"><p className="text-xs text-muted-foreground">Credit approved</p><p className="mt-1 text-2xl font-semibold">{money(retailers.reduce((sum, r) => sum + Number(r.credit_limit || 0), 0))}</p></div>
          </div>

          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search retailer, person, phone or city…" className="mt-4 h-10 w-full rounded-xl border bg-background px-3 text-sm sm:mt-6 sm:h-11 sm:px-4" />

          <div className="mt-3 grid gap-3 lg:mt-4 lg:grid-cols-[1fr_1.1fr] lg:gap-4">
            <section className="space-y-3">{filtered.map((retailer) => {
              const balance = balances[retailer.id]?.outstanding_balance || 0
              const unappliedCredit = balances[retailer.id]?.unapplied_credit || 0
              return <button key={retailer.id} onClick={() => void selectRetailer(retailer)} className="w-full rounded-xl border bg-background p-3 text-left transition hover:border-primary sm:rounded-2xl sm:p-4">
                <div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="truncate font-semibold">{retailer.business_name}</p><p className="mt-0.5 truncate text-xs text-muted-foreground sm:mt-1 sm:text-sm">{retailer.contact_name || retailer.phone} {retailer.city ? '· ' + retailer.city : ''}</p></div><span className="shrink-0 text-right text-sm font-semibold text-amber-700">{money(balance)}<small className="block text-[10px] font-normal text-muted-foreground sm:text-xs">outstanding</small>{unappliedCredit > 0 && <small className="mt-0.5 block text-[10px] font-semibold text-emerald-700 sm:mt-1 sm:text-xs">{money(unappliedCredit)} unapplied credit</small>}</span></div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground sm:mt-3 sm:text-xs"><span className="rounded-full bg-muted px-2 py-1">{retailer.status}</span><span className="truncate text-right">{retailer.payment_terms_days} day terms · credit {money(retailer.credit_limit)}</span></div>
              </button>
            })}</section>

            <aside className="rounded-xl border bg-background p-4 sm:rounded-2xl sm:p-5">{selected ? <><div className="flex justify-between gap-3"><div><h2 className="text-xl font-semibold">{selected.business_name}</h2><p className="mt-1 text-sm text-muted-foreground">{selected.phone}</p></div><button onClick={() => editRetailer(selected)} className="text-sm font-semibold text-primary">Edit</button></div>
              {(() => {
                const balance = balances[selected.id]
                const unappliedCredit = Number(balance?.unapplied_credit || 0)
                return unappliedCredit > 0 ? <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{money(unappliedCredit)} unapplied credit available on this account.</p> : null
              })()}
              <div className="mt-4 flex gap-2 sm:mt-5 sm:flex-wrap"><Link href={'/admin/retailer-orders?retailer=' + selected.id} className="flex-1 rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground sm:flex-none">Create order</Link><button onClick={() => setShowPaymentModal(true)} className="flex-1 rounded-lg border px-3 py-2 text-sm font-semibold sm:flex-none">Record payment</button></div>
              {showPaymentModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-lg rounded-2xl border bg-background p-5 shadow-xl"><div className="flex items-center justify-between"><div><h3 className="text-xl font-semibold">Record payment</h3><p className="mt-1 text-sm text-muted-foreground">{selected.business_name}</p></div><button type="button" onClick={() => setShowPaymentModal(false)} className="rounded-lg border px-3 py-2 text-sm">Close</button></div><div className="mt-5 space-y-4"><label className="block text-sm font-medium">Payment amount (₹)<input autoFocus value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} type="number" min="0.01" step="0.01" placeholder="Enter amount" className="mt-1 h-11 w-full rounded-lg border bg-background px-3" /></label><label className="block text-sm font-medium">Payment method<CustomSelect value={paymentMethod} onChange={setPaymentMethod} className="mt-1" options={[{ value: 'upi', label: 'UPI' }, { value: 'bank-transfer', label: 'Bank transfer' }, { value: 'cash', label: 'Cash' }, { value: 'cheque', label: 'Cheque' }, { value: 'other', label: 'Other' }]} /></label><label className="block text-sm font-medium">Reference <span className="font-normal text-muted-foreground">(optional)</span><input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Transaction / cheque reference" className="mt-1 h-11 w-full rounded-lg border bg-background px-3" /></label><label className="block text-sm font-medium">Notes <span className="font-normal text-muted-foreground">(optional)</span><textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Optional payment note" className="mt-1 min-h-24 w-full rounded-lg border bg-background px-3 py-2" /></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowPaymentModal(false)} className="rounded-lg border px-4 py-2.5 text-sm font-semibold">Cancel</button><button type="button" disabled={paymentSaving} onClick={() => void recordPayment()} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">{paymentSaving ? 'Recording…' : 'Record payment'}</button></div></div></div>}
              <div className="mt-5 border-t pt-4 sm:mt-6 sm:pt-5">
                <button type="button" onClick={() => setShowSpecialPrices((current) => !current)} className="flex w-full items-center justify-between text-left lg:pointer-events-none">
                  <span><span className="font-semibold">Special product prices</span><span className="ml-2 text-xs font-normal text-muted-foreground">· {ALL_PRODUCTS.length} products</span><span className="mt-1 block text-xs text-muted-foreground">Empty = default Product Settings price</span></span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform lg:hidden ${showSpecialPrices ? 'rotate-180' : ''}`} />
                </button>
                <div className={`${showSpecialPrices ? 'mt-3 block' : 'hidden'} lg:mt-3 lg:block`}>
                  <div className="max-h-80 space-y-2 overflow-auto">{ALL_PRODUCTS.map((product) => <label key={product.slug} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate">{product.name}</span><input value={prices[product.slug] || ''} onChange={(e) => setPrices({ ...prices, [product.slug]: e.target.value })} placeholder="Default" type="number" min="0.01" step="0.01" className="h-9 w-28 shrink-0 rounded-lg border px-2 text-right" /></label>)}</div>
                  <button disabled={saving} onClick={() => void savePrices()} className="mt-3 rounded-lg border px-3 py-2 text-sm font-semibold">{saving ? 'Saving…' : 'Save special prices'}</button>
                </div>
              </div>
            </> : <p className="text-sm text-muted-foreground">Select a retailer to manage its prices, payments and orders. Payments are automatically allocated to the oldest outstanding orders.</p>}</aside>
          </div>
        </div>
      </main>
    </>
  )
}
