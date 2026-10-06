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
  const [retailerPage, setRetailerPage] = useState(1)
  const [form, setForm] = useState(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
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
  const [showStatement, setShowStatement] = useState(false)
  const [retailerStatusTarget, setRetailerStatusTarget] = useState<Retailer | null>(null)
  const [createOrderError, setCreateOrderError] = useState('')
  const [statementLoading, setStatementLoading] = useState(false)
  const [statementOrders, setStatementOrders] = useState<any[]>([])
  const [statementPayments, setStatementPayments] = useState<any[]>([])
  const [overdueByRetailer, setOverdueByRetailer] = useState<Record<string, { count: number; amount: number }>>({})
  const retailerFormRef = useRef<HTMLFormElement>(null)
  const retailerDetailsRef = useRef<HTMLElement>(null)

  const load = async () => {
    const { data: retailerRows, error } = await supabase.from('retailers').select('*').order('business_name')
    if (error) { setMessage('Unable to load retailers.'); return }
    const { data: balanceRows } = await supabase.from('retailer_balances').select('*')
    const { data: overdueRows } = await supabase
      .from('retailer_orders')
      .select('retailer_id, total, due_date, payment_status, order_status, retailer_payment_allocations(amount)')
      .neq('order_status', 'cancelled')
      .neq('payment_status', 'paid')
      .not('due_date', 'is', null)
    const todayIndia = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
    const nextOverdue: Record<string, { count: number; amount: number }> = {}
    ;(overdueRows || []).forEach((row: any) => {
      if (row.due_date < todayIndia) {
        const paid = (row.retailer_payment_allocations || []).reduce((sum: number, allocation: any) => sum + Number(allocation.amount || 0), 0)
        const outstanding = Math.max(Number(row.total || 0) - paid, 0)
        if (outstanding <= 0) return
        const current = nextOverdue[row.retailer_id] || { count: 0, amount: 0 }
        current.count += 1
        current.amount += outstanding
        nextOverdue[row.retailer_id] = current
      }
    })
    const nextBalances: Record<string, any> = {}
    balanceRows?.forEach((row: any) => { nextBalances[row.retailer_id] = row })
    setBalances(nextBalances)
    setOverdueByRetailer(nextOverdue)
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

  const retailerPageSize = 10
  const retailerPageCount = Math.max(1, Math.ceil(filtered.length / retailerPageSize))
  const paginatedRetailers = useMemo(() => {
    const start = (retailerPage - 1) * retailerPageSize
    return filtered.slice(start, start + retailerPageSize)
  }, [filtered, retailerPage])

  useEffect(() => {
    setRetailerPage(1)
  }, [search])

  useEffect(() => {
    if (retailerPage > retailerPageCount) setRetailerPage(retailerPageCount)
  }, [retailerPage, retailerPageCount])

  useEffect(() => {
    if (!selected || typeof window === 'undefined' || window.innerWidth >= 1024) return
    let timer1: number | undefined
    let timer2: number | undefined
    const scrollToDetails = () => {
      const panel = document.getElementById('retailer-details-panel')
      if (!panel) return
      const top = panel.getBoundingClientRect().top + window.scrollY - 92
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    }
    timer1 = window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        scrollToDetails()
        timer2 = window.setTimeout(scrollToDetails, 350)
      })
    }, 50)
    return () => {
      if (timer1) window.clearTimeout(timer1)
      if (timer2) window.clearTimeout(timer2)
    }
  }, [selected?.id])

  const renderRetailerPagination = () => retailerPageCount > 1 ? (
    <div className="flex items-center justify-between gap-2 rounded-xl border bg-background p-2.5 sm:rounded-2xl sm:p-3">
      <button
        type="button"
        disabled={retailerPage === 1}
        onClick={() => setRetailerPage((page) => Math.max(1, page - 1))}
        className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
      >
        ← Previous
      </button>
      <span className="text-xs font-semibold text-muted-foreground sm:text-sm">
        Page {retailerPage} of {retailerPageCount}
      </span>
      <button
        type="button"
        disabled={retailerPage === retailerPageCount}
        onClick={() => setRetailerPage((page) => Math.min(retailerPageCount, page + 1))}
        className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
      >
        Next →
      </button>
    </div>
  ) : null

  const validateRetailerField = (key: string, rawValue: string) => {
    const value = rawValue.trim()
    const namePattern = /^[A-Za-z][A-Za-z .&'-]*$/
    const statePattern = /^[A-Za-z][A-Za-z .&'()-]*$/
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

    if (!value) return ''

    switch (key) {
      case 'business_name':
      case 'contact_name':
      case 'billing_name':
        return namePattern.test(value) ? '' : 'Use letters, spaces and . & - only.'
      case 'phone':
        return /^\d{10}$/.test(value) ? '' : 'Phone must be exactly 10 digits.'
      case 'whatsapp':
        return /^\d{10}$/.test(value) ? '' : 'WhatsApp must be exactly 10 digits.'
      case 'email':
        return emailPattern.test(value) ? '' : 'Enter a valid email address.'
      case 'address':
        return value.length >= 5 ? '' : 'Enter at least 5 characters.'
      case 'city':
        return namePattern.test(value) ? '' : 'Use letters, spaces and . & - only.'
      case 'state':
        return statePattern.test(value) ? '' : 'Enter a valid state name.'
      case 'pincode':
        return /^\d{6}$/.test(value) ? '' : 'Pincode must be exactly 6 digits.'
      case 'gstin':
        return gstinPattern.test(value.toUpperCase()) ? '' : 'GSTIN must be a valid 15-character GSTIN.'
      case 'payment_terms_days':
        return /^\d+$/.test(value) && Number(value) >= 0 ? '' : 'Enter 0 or a positive number of days.'
      case 'credit_limit':
        return /^\d+(?:\.\d{1,2})?$/.test(value) && Number(value) >= 0 ? '' : 'Enter a valid amount.'
      default:
        return ''
    }
  }

  const handleRetailerFieldChange = (key: string, rawValue: string) => {
    let value = rawValue

    if (['phone', 'whatsapp'].includes(key)) {
      value = value.replace(/\D/g, '').slice(0, 10)
    } else if (key === 'pincode') {
      value = value.replace(/\D/g, '').slice(0, 6)
    } else if (['business_name', 'contact_name', 'billing_name', 'city', 'state'].includes(key)) {
      value = value.replace(/[^A-Za-z .&'()\-]/g, '')
    } else if (key === 'gstin') {
      value = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 15)
    } else if (key === 'payment_terms_days') {
      value = value.replace(/\D/g, '')
    } else if (key === 'credit_limit') {
      value = value.replace(/[^0-9.]/g, '').replace(/\.(?=.*\.)/g, '')
      const parts = value.split('.')
      if (parts[1]) value = parts[0] + '.' + parts[1].slice(0, 2)
    }

    setForm((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => ({ ...current, [key]: validateRetailerField(key, value) }))
  }

  const validateAllRetailerFields = () => {
    const errors: Record<string, string> = {}
    Object.entries(form).forEach(([key, value]) => {
      const error = validateRetailerField(key, value)
      if (error) errors[key] = error
    })

    if (!form.business_name.trim() && !form.contact_name.trim()) {
      const message = 'Business name or contact name is required.'
      errors.business_name = message
      errors.contact_name = message
    }
    if (!form.phone.trim() && !form.whatsapp.trim()) {
      const message = 'Phone number or WhatsApp number is required.'
      errors.phone = message
      errors.whatsapp = message
    }

    setFieldErrors(errors)
    return errors
  }

  const saveRetailer = async (event: FormEvent) => {
    event.preventDefault()

    const errors = validateAllRetailerFields()
    if (Object.keys(errors).length > 0) {
      setMessage('Please correct the highlighted fields before saving.')
      return
    }

    setSaving(true)
    setMessage('')

    const payload = {
      // The database currently requires business_name. If only Contact Name is provided,
      // use it as the account display name while still preserving contact_name separately.
      business_name: form.business_name.trim() || form.contact_name.trim() || null,
      contact_name: form.contact_name.trim() || null,
      // The current database requires phone. When only WhatsApp is provided,
      // use it as the database phone fallback while preserving the WhatsApp field too.
      phone: form.phone.trim() || form.whatsapp.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      email: form.email.trim() || null,
      billing_name: form.billing_name.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      pincode: form.pincode.trim() || null,
      gstin: form.gstin.trim().toUpperCase() || null,
      payment_terms_days: Number(form.payment_terms_days || 0),
      credit_limit: Number(form.credit_limit || 0),
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const result = editing
      ? await supabase.from('retailers').update(payload).eq('id', editing.id)
      : await supabase.from('retailers').insert(payload)

    setSaving(false)

    if (result.error) {
      setMessage(result.error.message)
      return
    }

    setForm(emptyForm)
    setFieldErrors({})
    setEditing(null)
    setShowForm(false)
    setMessage('Retailer saved.')
    await load()
  }

  const editRetailer = (retailer: Retailer) => {
    setEditing(retailer)
    setFieldErrors({})
    setForm({
      // If business_name equals contact_name, it may be the database fallback used when no business name was entered.
      business_name: retailer.business_name === (retailer.contact_name || '') ? '' : retailer.business_name,
      contact_name: retailer.contact_name || '', phone: retailer.phone,
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

  const toggleRetailerStatus = (retailer: Retailer) => {
    setRetailerStatusTarget(retailer)
  }

  const confirmRetailerStatus = async () => {
    if (!retailerStatusTarget) return

    const retailer = retailerStatusTarget
    const nextStatus = retailer.status === 'active' ? 'inactive' : 'active'
    const action = nextStatus === 'inactive' ? 'block' : 'reactivate'

    setRetailerStatusTarget(null)
    setMessage('')

    const { error } = await supabase
      .from('retailers')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', retailer.id)

    if (error) {
      setMessage(error.message)
      return
    }

    const updatedRetailer = { ...retailer, status: nextStatus as Retailer['status'] }
    setRetailers((current) =>
      current.map((item) => item.id === retailer.id ? updatedRetailer : item)
    )
    if (selected?.id === retailer.id) setSelected(updatedRetailer)
    setMessage(action === 'block' ? 'Retailer blocked.' : 'Retailer reactivated.')
  }
  const selectRetailer = async (retailer: Retailer) => {
    setSelected(retailer); setShowSpecialPrices(false); setMessage('')
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

  const loadStatement = async () => {
    if (!selected) return
    setStatementLoading(true)
    const { data: orderRows } = await supabase.from('retailer_orders').select('id, total, payment_status, order_status, due_date, created_at').eq('retailer_id', selected.id).order('created_at', { ascending: false })
    const ids = (orderRows || []).map((row: any) => row.id)
    const { data: allocationRows } = ids.length
      ? await supabase.from('retailer_payment_allocations').select('retailer_order_id, amount').in('retailer_order_id', ids)
      : { data: [] as any[] }
    const allocationByOrder: Record<string, number> = {}
    ;(allocationRows || []).forEach((row: any) => { const key = String(row.retailer_order_id); allocationByOrder[key] = (allocationByOrder[key] || 0) + Number(row.amount || 0) })
    setStatementOrders((orderRows || []).map((row: any) => ({ ...row, paid: allocationByOrder[String(row.id)] || 0, outstanding: Math.max(Number(row.total || 0) - (allocationByOrder[String(row.id)] || 0), 0) })))
    const { data: paymentRows } = await supabase.from('retailer_payments').select('id, amount, payment_method, reference, notes, created_at').eq('retailer_id', selected.id).order('created_at', { ascending: false })
    setStatementPayments(paymentRows || [])
    setStatementLoading(false)
  }

  const csvEscape = (value: unknown) => {
    const text = String(value ?? '').replace(/\r?\n|\r/g, ' ').trim()
    return '"' + text.replace(/"/g, '""') + '"'
  }

  const exportStatementCsv = () => {
    if (!selected) return
    const transactions = [
      ...statementOrders.filter((o) => o.order_status !== 'cancelled').map((o) => ({
        date: o.created_at, type: 'Order', reference: 'Order #' + o.id, detail: o.payment_status, debit: Number(o.total || 0), credit: 0, balance: Number(o.outstanding || 0),
      })),
      ...statementPayments.map((p) => ({
        date: p.created_at, type: 'Payment', reference: p.reference || 'Payment #' + p.id, detail: p.payment_method, debit: 0, credit: Number(p.amount || 0), balance: '',
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const rows = [
      ['Date', 'Type', 'Reference', 'Details', 'Debit', 'Credit', 'Outstanding'],
      ...transactions.map((row) => [new Date(row.date).toLocaleString('en-IN'), row.type, row.reference, row.detail, row.debit, row.credit, row.balance]),
    ]
    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\r\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'tenoo-statement-' + selected.business_name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '-' + new Date().toISOString().slice(0, 10) + '.csv'
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url)
  }

  const exportRetailerListCsv = () => {
    const rows = [
      [
        'Business Name', 'Contact Name', 'Phone', 'WhatsApp', 'Email', 'Billing Name',
        'Address', 'City', 'State', 'Pincode', 'GSTIN', 'Status', 'Payment Terms (Days)',
        'Credit Limit', 'Outstanding', 'Unapplied Credit', 'Overdue Orders', 'Overdue Amount', 'Notes',
      ],
      ...retailers.map((retailer) => {
        const balance = balances[retailer.id] || {}
        const overdue = overdueByRetailer[retailer.id] || { count: 0, amount: 0 }
        return [
          retailer.business_name,
          retailer.contact_name || '',
          retailer.phone,
          retailer.whatsapp || '',
          retailer.email || '',
          retailer.billing_name || '',
          retailer.address || '',
          retailer.city || '',
          retailer.state || '',
          retailer.pincode || '',
          retailer.gstin || '',
          retailer.status,
          retailer.payment_terms_days,
          retailer.credit_limit,
          Number(balance.outstanding_balance || 0),
          Number(balance.unapplied_credit || 0),
          overdue.count,
          Number(overdue.amount || 0),
          retailer.notes || '',
        ]
      }),
    ]
    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\r\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'tenoo-retailer-list-' + new Date().toISOString().slice(0, 10) + '.csv'
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url)
  }

  const exportPaymentsCsv = () => {
    if (!selected || statementPayments.length === 0) return
    const rows = [
      ['Payment ID', 'Date', 'Amount', 'Method', 'Reference', 'Notes'],
      ...statementPayments.map((p) => [p.id, new Date(p.created_at).toLocaleString('en-IN'), p.amount, p.payment_method, p.reference || '', p.notes || '']),
    ]
    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\r\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'tenoo-payments-' + selected.business_name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '-' + new Date().toISOString().slice(0, 10) + '.csv'
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url)
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
            <div className="flex flex-wrap gap-2 sm:flex-row">
              <Link href="/admin/retailer-orders" className="flex-1 rounded-xl border bg-background px-3 py-2.5 text-center text-sm font-semibold shadow-sm transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-md active:scale-[0.99] sm:flex-none sm:px-4">Retailer Orders</Link>
              <button onClick={exportRetailerListCsv} disabled={retailers.length === 0} className="flex-1 rounded-xl border bg-background px-3 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-4">Download Retailer List</button>
              <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true) }} className="flex-1 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-md active:scale-[0.99] sm:flex-none sm:px-4">Add Retailer</button>
            </div>
          </div>

          {message && <p className="mt-4 rounded-xl border bg-background px-4 py-3 text-sm">{message}</p>}

          {showForm && <form ref={retailerFormRef} onSubmit={saveRetailer} className="mt-5 scroll-mt-24 grid gap-3 rounded-2xl border bg-background p-5 sm:grid-cols-2">
            <h2 className="sm:col-span-2 font-semibold">{editing ? 'Edit retailer' : 'New retailer'}</h2>
            <p className="sm:col-span-2 rounded-xl border bg-muted/40 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
              <span className="font-semibold text-foreground">Required:</span> Business Name or Contact Name · Phone Number or WhatsApp Number.
              <span className="ml-1">All other details are optional and can be updated later.</span>
            </p>
            {Object.entries(form).map(([key, value]) => {
              const numeric = key === 'payment_terms_days' || key === 'credit_limit'
              const tel = key === 'phone' || key === 'whatsapp' || key === 'pincode'
              const emailField = key === 'email'
              const gstField = key === 'gstin'
              const maxLength = key === 'phone' || key === 'whatsapp' ? 10 : key === 'pincode' ? 6 : gstField ? 15 : undefined
              const error = fieldErrors[key]

              return (
                <label key={key} className="text-xs font-medium text-muted-foreground">
                  {key.replaceAll('_', ' ')}
                  <input
                    value={value}
                    required={false}
                    maxLength={maxLength}
                    inputMode={numeric || tel ? 'numeric' : emailField ? 'email' : undefined}
                    autoCapitalize={gstField ? 'characters' : 'words'}
                    onChange={(e) => handleRetailerFieldChange(key, e.target.value)}
                    className={`mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/20 ${error ? 'border-red-500 focus:border-red-500' : 'focus:border-primary/50'}`}
                    type={numeric ? 'text' : tel ? 'tel' : emailField ? 'email' : 'text'}
                  />
                  {error && <span className="mt-1 block text-[11px] font-medium text-red-600">{error}</span>}
                </label>
              )
            })}
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
            <section className="space-y-3">
              {renderRetailerPagination()}
              {paginatedRetailers.map((retailer) => {
              const balance = balances[retailer.id]?.outstanding_balance || 0
              const unappliedCredit = balances[retailer.id]?.unapplied_credit || 0
              return <button key={retailer.id} onClick={() => void selectRetailer(retailer)} className="w-full rounded-xl border bg-background p-3 text-left transition hover:border-primary sm:rounded-2xl sm:p-4">
                <div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="truncate font-semibold">{retailer.business_name}</p><p className="mt-0.5 truncate text-xs text-muted-foreground sm:mt-1 sm:text-sm">{retailer.contact_name || retailer.phone} {retailer.city ? '· ' + retailer.city : ''}</p></div><span className="shrink-0 text-right text-sm font-semibold text-amber-700">{money(balance)}<small className="block text-[10px] font-normal text-muted-foreground sm:text-xs">outstanding</small>{unappliedCredit > 0 && <small className="mt-0.5 block text-[10px] font-semibold text-emerald-700 sm:mt-1 sm:text-xs">{money(unappliedCredit)} unapplied credit</small>}{overdueByRetailer[retailer.id]?.count > 0 && <small className="mt-1 block text-[10px] font-semibold text-red-700 sm:text-xs">{overdueByRetailer[retailer.id].count} overdue · {money(overdueByRetailer[retailer.id].amount)}</small>}</span></div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground sm:mt-3 sm:text-xs"><span className="rounded-full bg-muted px-2 py-1">{retailer.status}</span><span className="truncate text-right">{retailer.payment_terms_days} day terms · credit {money(retailer.credit_limit)}</span></div>
              </button>
              })}
              {renderRetailerPagination()}
            </section>

            <aside id="retailer-details-panel" tabIndex={-1} className="scroll-mt-24 rounded-xl border bg-background p-4 outline-none sm:rounded-2xl sm:p-5">{selected ? <><div className="flex justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{selected.business_name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{selected.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => editRetailer(selected)} className="rounded-lg px-2 py-1 text-sm font-semibold text-primary transition-all duration-200 ease-out hover:bg-primary/10 hover:text-primary hover:shadow-sm">Edit</button>
                  <button
                    type="button"
                    onClick={() => void toggleRetailerStatus(selected)}
                    className={selected.status === 'active'
                      ? "rounded-lg px-2 py-1 text-sm font-semibold text-red-600 transition-all duration-200 ease-out hover:bg-red-50 hover:text-red-700 hover:shadow-sm"
                      : "rounded-lg px-2 py-1 text-sm font-semibold text-emerald-700 transition-all duration-200 ease-out hover:bg-emerald-50 hover:text-emerald-800 hover:shadow-sm"}
                  >
                    {selected.status === 'active' ? 'Block Retailer' : 'Reactivate'}
                  </button>
                </div>
              </div>
              {(() => {
                const balance = balances[selected.id]
                const unappliedCredit = Number(balance?.unapplied_credit || 0)
                return unappliedCredit > 0 ? <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{money(unappliedCredit)} unapplied credit available on this account.</p> : null
              })()}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:flex sm:flex-wrap">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (selected.status !== 'active') {
                        setCreateOrderError('This retailer is blocked and cannot receive new orders. Reactivate the retailer to create an order.')
                        return
                      }
                      setCreateOrderError('')
                      window.location.href = '/admin/retailer-orders/create?retailer=' + selected.id
                    }}
                    className="w-full min-h-12 rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold leading-tight text-primary-foreground transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-md active:scale-[0.99]"
                  >
                    Create order
                  </button>
                  {createOrderError && selected.status !== 'active' && (
                    <p className="col-span-2 mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium leading-5 text-red-700 sm:max-w-xs">
                      {createOrderError}
                    </p>
                  )}
                </div>
                <Link href={'/admin/retailer-orders?retailer=' + selected.id} className="flex min-h-12 items-center justify-center rounded-lg border px-3 py-2 text-center text-sm font-semibold leading-tight transition-all duration-200 ease-out hover:border-primary/30 hover:bg-primary/10 hover:text-primary hover:shadow-sm">View orders</Link>
                <button onClick={() => { setShowPaymentModal(true); setShowStatement(false) }} className="min-h-12 rounded-lg border px-3 py-2 text-center text-sm font-semibold leading-tight transition-all duration-200 ease-out hover:border-primary/30 hover:bg-primary/10 hover:text-primary hover:shadow-sm">Record payment</button>
                <button onClick={() => { setShowStatement(true); void loadStatement() }} className="min-h-12 rounded-lg border px-3 py-2 text-center text-sm font-semibold leading-tight transition-all duration-200 ease-out hover:border-primary/30 hover:bg-primary/10 hover:text-primary hover:shadow-sm">Statement</button>
              </div>
              {showStatement && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border bg-background p-5 shadow-xl">
                  <div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-semibold">Retailer statement</h3><p className="mt-1 text-sm text-muted-foreground">{selected.business_name}</p></div><div className="flex gap-2"><button type="button" onClick={exportStatementCsv} disabled={statementLoading} className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50">Export statement</button><button type="button" onClick={exportPaymentsCsv} disabled={statementLoading || statementPayments.length === 0} className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50">Export payments</button><button type="button" onClick={() => setShowStatement(false)} className="rounded-lg border px-3 py-2 text-sm">Close</button></div></div>
                  {statementLoading ? <p className="mt-6 text-sm text-muted-foreground">Loading statement…</p> : (() => {
                    const now = new Date()
                    const buckets = { current: 0, d1_15: 0, d16_30: 0, d31_60: 0, d60: 0 }
                    statementOrders.filter((order) => order.order_status !== 'cancelled' && order.outstanding > 0).forEach((order) => {
                      const due = order.due_date ? new Date(order.due_date + 'T23:59:59') : now
                      const days = Math.max(0, Math.floor((now.getTime() - due.getTime()) / 86400000))
                      if (days === 0) buckets.current += order.outstanding
                      else if (days <= 15) buckets.d1_15 += order.outstanding
                      else if (days <= 30) buckets.d16_30 += order.outstanding
                      else if (days <= 60) buckets.d31_60 += order.outstanding
                      else buckets.d60 += order.outstanding
                    })
                    const transactions = [
                      ...statementOrders.filter((o) => o.order_status !== 'cancelled').map((o) => ({ date: o.created_at, label: 'Order #' + o.id, detail: o.payment_status, amount: Number(o.total || 0) })),
                      ...statementPayments.map((p) => ({ date: p.created_at, label: 'Payment', detail: p.payment_method + (p.reference ? ' · ' + p.reference : ''), amount: -Number(p.amount || 0) })),
                    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    return <div className="mt-5 space-y-5">
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                        {[['Current', buckets.current], ['1–15 days', buckets.d1_15], ['16–30 days', buckets.d16_30], ['31–60 days', buckets.d31_60], ['60+ days', buckets.d60]].map(([label, value]) => <div key={String(label)} className="rounded-xl border p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{money(value)}</p></div>)}
                      </div>
                      <div><h4 className="font-semibold">Transactions</h4><div className="mt-2 divide-y rounded-xl border">{transactions.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No transactions yet.</p> : transactions.map((tx, index) => <div key={index} className="flex items-center justify-between gap-3 p-3 text-sm"><div><p className="font-medium">{tx.label}</p><p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleString('en-IN')} · {tx.detail}</p></div><span className={tx.amount < 0 ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>{tx.amount < 0 ? '−' : '+'}{money(Math.abs(tx.amount))}</span></div>)}</div></div>
                    </div>
                  })()}
                </div>
              </div>}
              {showPaymentModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-lg rounded-2xl border bg-background p-5 shadow-xl"><div className="flex items-center justify-between"><div><h3 className="text-xl font-semibold">Record payment</h3><p className="mt-1 text-sm text-muted-foreground">{selected.business_name}</p></div><button type="button" onClick={() => setShowPaymentModal(false)} className="rounded-lg border px-3 py-2 text-sm">Close</button></div><div className="mt-5 space-y-4"><label className="block text-sm font-medium">Payment amount (₹)<input autoFocus value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} type="number" min="0.01" step="0.01" placeholder="Enter amount" className="mt-1 h-11 w-full rounded-lg border bg-background px-3" /></label><label className="block text-sm font-medium">Payment method<CustomSelect value={paymentMethod} onChange={setPaymentMethod} className="mt-1" options={[{ value: 'upi', label: 'UPI' }, { value: 'bank-transfer', label: 'Bank transfer' }, { value: 'cash', label: 'Cash' }, { value: 'cheque', label: 'Cheque' }, { value: 'other', label: 'Other' }]} /></label><label className="block text-sm font-medium">Reference <span className="font-normal text-muted-foreground">(optional)</span><input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Transaction / cheque reference" className="mt-1 h-11 w-full rounded-lg border bg-background px-3" /></label><label className="block text-sm font-medium">Notes <span className="font-normal text-muted-foreground">(optional)</span><textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Optional payment note" className="mt-1 min-h-24 w-full rounded-lg border bg-background px-3 py-2" /></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowPaymentModal(false)} className="rounded-lg border px-4 py-2.5 text-sm font-semibold">Cancel</button><button type="button" disabled={paymentSaving} onClick={() => void recordPayment()} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">{paymentSaving ? 'Recording…' : 'Record payment'}</button></div></div></div>}
              <div className="mt-5 border-t pt-4 sm:mt-6 sm:pt-5">
                <button type="button" onClick={() => setShowSpecialPrices((current) => !current)} className="flex w-full items-center justify-between text-left lg:pointer-events-none">
                  <span><span className="font-semibold">Special product prices</span><span className="ml-2 text-xs font-normal text-muted-foreground">· {ALL_PRODUCTS.length} products</span><span className="mt-1 block text-xs text-muted-foreground">Empty = default Product Settings price</span></span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform lg:hidden ${showSpecialPrices ? 'rotate-180' : ''}`} />
                </button>
                <div className={`${showSpecialPrices ? 'mt-3 block' : 'hidden'} lg:mt-3 lg:block`}>
                  <div className="max-h-80 space-y-2 overflow-auto">{ALL_PRODUCTS.map((product) => <label key={product.slug} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate">{product.name}</span><input value={prices[product.slug] || ''} onChange={(e) => setPrices({ ...prices, [product.slug]: e.target.value })} placeholder="Default" type="number" min="0.01" step="0.01" className="h-9 w-28 shrink-0 rounded-lg border px-2 text-right" /></label>)}</div>
                  <button disabled={saving} onClick={() => void savePrices()} className="mt-3 rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm transition-all duration-200 ease-out hover:scale-[1.03] hover:shadow-md active:scale-[0.99]">{saving ? 'Saving…' : 'Save special prices'}</button>
                </div>
              </div>
            </> : <div className="flex min-h-28 items-center justify-center text-center"><p className="max-w-sm text-sm leading-6 text-muted-foreground"><span className="font-semibold text-foreground">Select a retailer</span> to manage their special prices, payments and orders.</p></div>}</aside>
          </div>
        </div>
      </main>
      {retailerStatusTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">
                {retailerStatusTarget.status === 'active' ? 'Block Retailer?' : 'Reactivate Retailer?'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {retailerStatusTarget.status === 'active'
                  ? `${retailerStatusTarget.business_name} will remain in your records but should not receive new orders.`
                  : `${retailerStatusTarget.business_name} will be allowed to receive new orders again.`}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRetailerStatusTarget(null)}
                className="rounded-xl border bg-background px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 ease-out hover:bg-muted hover:shadow-md active:scale-[0.99]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmRetailerStatus()}
                className={retailerStatusTarget.status === 'active'
                  ? "rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 ease-out hover:scale-[1.02] hover:bg-red-700 hover:shadow-md active:scale-[0.99]"
                  : "rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 ease-out hover:scale-[1.02] hover:bg-emerald-700 hover:shadow-md active:scale-[0.99]"}
              >
                {retailerStatusTarget.status === 'active' ? 'Block Retailer' : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
