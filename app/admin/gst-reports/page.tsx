'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Download, FileCheck2, Plus, Save, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SiteHeader } from '@/components/site-header'
import { ALL_PRODUCTS } from '@/lib/site'

type SalesRow = {
  id: string
  date: string
  channel: 'Online' | 'Retailer'
  party: string
  gstin: string
  state: string
  status: string
  taxable: number
  cgst: number
  sgst: number
  igst: number
  total: number
  items: any[]
}

type ExpenseRow = {
  id: number
  invoice_date: string
  supplier_name: string
  supplier_gstin: string
  taxable_amount: number
  cgst: number
  sgst: number
  igst: number
  total_amount: number
  itc_status: string
  gstr2b_status: string
}

type NoteRow = {
  id: number
  note_type: 'Credit Note' | 'Debit Note'
  note_number: string
  note_date: string
  party_type: 'B2B' | 'B2C'
  party_name: string
  party_gstin: string
  reference_invoice: string
  taxable_amount: number
  cgst: number
  sgst: number
  igst: number
  reason: string
}

type HsnRow = {
  key: string
  hsn: string
  uqc: string
  rate: number
  b2bQty: number
  b2bTaxable: number
  b2bGst: number
  b2cQty: number
  b2cTaxable: number
  b2cGst: number
}

const money = (value: number) =>
  '₹' + Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const number = (value: number) =>
  Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const indiaDate = (value: string) =>
  value ? new Date(value + (value.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-IN') : '—'

const quarterOptions = (year: number) => [
  { value: 'Q1', label: 'Q1 · Apr–Jun', start: `${year}-04-01`, end: `${year}-06-30` },
  { value: 'Q2', label: 'Q2 · Jul–Sep', start: `${year}-07-01`, end: `${year}-09-30` },
  { value: 'Q3', label: 'Q3 · Oct–Dec', start: `${year}-10-01`, end: `${year}-12-31` },
  { value: 'Q4', label: 'Q4 · Jan–Mar', start: `${year + 1}-01-01`, end: `${year + 1}-03-31` },
]

const getCurrentQuarter = () => {
  const now = new Date()
  const month = now.getMonth() + 1
  const fyStart = month >= 4 ? now.getFullYear() : now.getFullYear() - 1
  const quarter = month >= 4 && month <= 6 ? 'Q1' : month <= 9 ? 'Q2' : month <= 12 ? 'Q3' : 'Q4'
  return { year: fyStart, quarter }
}

const checklistItems = [
  ['sales', 'Online + retailer sales reconciled'],
  ['b2b', 'B2B GSTIN / invoice details verified'],
  ['b2c', 'B2C state-wise sales checked'],
  ['hsn', 'HSN, UQC and GST rates verified'],
  ['itc', 'Purchase bills and GSTR-2B reconciled'],
  ['notes', 'Credit / debit notes reviewed'],
  ['gstr1', 'GSTR-1 working summary reviewed'],
  ['gstr3b', 'GSTR-3B working summary reviewed'],
] as const

function csvEscape(value: unknown) {
  const text = String(value ?? '').replace(/\r?\n|\r/g, ' ').trim()
  return `"${text.replace(/"/g, '""')}"`
}

export default function GstReportsPage() {
  const current = getCurrentQuarter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [fyYear, setFyYear] = useState(current.year)
  const [quarterKey, setQuarterKey] = useState(current.quarter)
  const [tab, setTab] = useState('overview')
  const [sales, setSales] = useState<SalesRow[]>([])
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [notes, setNotes] = useState<NoteRow[]>([])
  const [productMaster, setProductMaster] = useState<Record<string, { hsn: string; uqc: string; rate: number }>>({})
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const [closingNotes, setClosingNotes] = useState('')
  const [closedAt, setClosedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [noteForm, setNoteForm] = useState({
    note_type: 'Credit Note',
    note_number: '',
    note_date: new Date().toISOString().slice(0, 10),
    party_type: 'B2B',
    party_name: '',
    party_gstin: '',
    reference_invoice: '',
    taxable_amount: '',
    cgst: '',
    sgst: '',
    igst: '',
    reason: '',
  })

  const quarterConfig = quarterOptions(fyYear).find((item) => item.value === quarterKey) || quarterOptions(fyYear)[0]
  const fyLabel = `FY ${fyYear}-${String(fyYear + 1).slice(-2)}`

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthorized(user?.email === 'info@tenoo.in')
    })
  }, [])

  const fetchAll = async (table: string, select: string) => {
    const rows: any[] = []
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from(table).select(select).range(from, from + 999)
      if (error) throw error
      rows.push(...(data || []))
      if (!data || data.length < 1000) break
    }
    return rows
  }

  const load = async () => {
    setLoading(true)
    setMessage('')
    try {
      const [onlineRows, retailerRows, expenseRows, noteRows, productRows, closingRows] = await Promise.all([
        fetchAll('orders', '*'),
        fetchAll('retailer_orders', '*, retailers(business_name, gstin, state), retailer_order_items(*)'),
        fetchAll('business_expenses', '*'),
        fetchAll('gst_credit_debit_notes', '*'),
        fetchAll('product_status', 'product_slug, display_name, gst_rate, hsn_code, uqc'),
        fetchAll('gst_quarter_closings', '*'),
      ])

      const isInQuarter = (date: string) => date >= quarterConfig.start && date <= quarterConfig.end
      const nextSales: SalesRow[] = []

      ;(onlineRows || []).forEach((row: any) => {
        const status = row.order_status || 'pending'
        if (!isInQuarter(String(row.created_at || '').slice(0, 10)) || status === 'cancelled') return
        nextSales.push({
          id: `ONLINE-${row.id}`,
          date: String(row.created_at || '').slice(0, 10),
          channel: 'Online',
          party: row.customer_name || 'Online Customer',
          gstin: '',
          state: row.state || '',
          status,
          taxable: Number(row.taxable_value || 0),
          cgst: Number(row.cgst || 0),
          sgst: Number(row.sgst || 0),
          igst: Number(row.igst || 0),
          total: Number(row.total || 0),
          items: Array.isArray(row.items) ? row.items : [],
        })
      })

      ;(retailerRows || []).forEach((row: any) => {
        const status = row.order_status || 'confirmed'
        if (!isInQuarter(String(row.created_at || '').slice(0, 10)) || status === 'cancelled') return
        nextSales.push({
          id: `RETAILER-${row.id}`,
          date: String(row.created_at || '').slice(0, 10),
          channel: 'Retailer',
          party: row.retailers?.business_name || 'Retailer',
          gstin: row.retailers?.gstin || '',
          state: row.place_of_supply_state || row.retailers?.state || '',
          status,
          taxable: Number(row.taxable_value || 0),
          cgst: Number(row.cgst || 0),
          sgst: Number(row.sgst || 0),
          igst: Number(row.igst || 0),
          total: Number(row.total || 0),
          items: Array.isArray(row.retailer_order_items) ? row.retailer_order_items : [],
        })
      })

      const nextExpenses = (expenseRows || [])
        .filter((row: any) => isInQuarter(row.invoice_date))
        .map((row: any) => ({
          id: Number(row.id),
          invoice_date: row.invoice_date,
          supplier_name: row.supplier_name || '',
          supplier_gstin: row.supplier_gstin || '',
          taxable_amount: Number(row.taxable_amount || 0),
          cgst: Number(row.cgst || 0),
          sgst: Number(row.sgst || 0),
          igst: Number(row.igst || 0),
          total_amount: Number(row.total_amount || 0),
          itc_status: row.itc_status || 'Pending',
          gstr2b_status: row.gstr2b_status || 'Not checked',
        }))

      const nextNotes = (noteRows || [])
        .filter((row: any) => isInQuarter(row.note_date))
        .map((row: any) => ({
          id: Number(row.id),
          note_type: row.note_type,
          note_number: row.note_number,
          note_date: row.note_date,
          party_type: row.party_type,
          party_name: row.party_name,
          party_gstin: row.party_gstin || '',
          reference_invoice: row.reference_invoice || '',
          taxable_amount: Number(row.taxable_amount || 0),
          cgst: Number(row.cgst || 0),
          sgst: Number(row.sgst || 0),
          igst: Number(row.igst || 0),
          reason: row.reason || '',
        }))

      const master: Record<string, { hsn: string; uqc: string; rate: number }> = {}
      ;(productRows || []).forEach((row: any) => {
        master[row.product_slug] = {
          hsn: row.hsn_code || '',
          uqc: row.uqc || 'PCS',
          rate: Number(row.gst_rate ?? 5),
        }
      })

      const closing = (closingRows || []).find((row: any) => row.financial_year === fyLabel && row.quarter === quarterConfig.value)
      setSales(nextSales.sort((a, b) => b.date.localeCompare(a.date)))
      setExpenses(nextExpenses.sort((a, b) => b.invoice_date.localeCompare(a.invoice_date)))
      setNotes(nextNotes.sort((a, b) => b.note_date.localeCompare(a.note_date)))
      setProductMaster(master)
      setChecklist((closing?.checklist || {}) as Record<string, boolean>)
      setClosingNotes(closing?.notes || '')
      setClosedAt(closing?.closed_at || null)
    } catch (error) {
      console.error(error)
      setMessage(error instanceof Error ? error.message : 'Unable to load GST reports.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authorized) void load()
  }, [authorized, fyYear, quarterConfig.value])

  const output = useMemo(() => sales.reduce((sum, row) => ({
    taxable: sum.taxable + row.taxable,
    cgst: sum.cgst + row.cgst,
    sgst: sum.sgst + row.sgst,
    igst: sum.igst + row.igst,
    total: sum.total + row.total,
  }), { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }), [sales])

  const input = useMemo(() => expenses.reduce((sum, row) => ({
    taxable: sum.taxable + row.taxable_amount,
    cgst: sum.cgst + row.cgst,
    sgst: sum.sgst + row.sgst,
    igst: sum.igst + row.igst,
    total: sum.total + row.total_amount,
    itc: sum.itc + (row.itc_status === 'Yes' ? row.cgst + row.sgst + row.igst : 0),
    matchedItc: sum.matchedItc + (row.itc_status === 'Yes' && row.gstr2b_status === 'Matched' ? row.cgst + row.sgst + row.igst : 0),
  }), { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0, itc: 0, matchedItc: 0 }), [expenses])

  const noteTotals = useMemo(() => notes.reduce((sum, row) => {
    const sign = row.note_type === 'Credit Note' ? -1 : 1
    return {
      taxable: sum.taxable + sign * row.taxable_amount,
      cgst: sum.cgst + sign * row.cgst,
      sgst: sum.sgst + sign * row.sgst,
      igst: sum.igst + sign * row.igst,
    }
  }, { taxable: 0, cgst: 0, sgst: 0, igst: 0 }), [notes])

  const netOutput = {
    taxable: output.taxable + noteTotals.taxable,
    cgst: output.cgst + noteTotals.cgst,
    sgst: output.sgst + noteTotals.sgst,
    igst: output.igst + noteTotals.igst,
  }
  const netOutputGst = netOutput.cgst + netOutput.sgst + netOutput.igst
  const estimatedNetPayable = Math.max(netOutputGst - input.matchedItc, 0)

  const hsnRows = useMemo(() => {
    const map = new Map<string, HsnRow>()
    sales.forEach((sale) => {
      sale.items.forEach((item: any) => {
        const slug = item.product_slug || item.slug || ''
        const master = productMaster[slug] || { hsn: '', uqc: 'PCS', rate: 5 }
        const hsn = master.hsn || 'UNMAPPED'
        const uqc = master.uqc || 'PCS'
        const qty = Number(item.quantity || 0)
        const directTaxable = sale.channel === 'Retailer'
          ? Number(item.line_total || 0)
          : Number(item.taxable_amount || 0)
        const grossLine = Number(item.line_total || 0) > 0
          ? Number(item.line_total)
          : Number(item.unit_price || item.total || item.price || 0) * Math.max(qty, 1)
        const grossBase = sale.items.reduce((sum: number, current: any) => {
          const currentQty = Math.max(Number(current.quantity || 0), 1)
          const currentLine = Number(current.line_total || 0) > 0
            ? Number(current.line_total)
            : Number(current.unit_price || current.total || current.price || 0) * currentQty
          return sum + currentLine
        }, 0)
        const taxable = directTaxable > 0
          ? directTaxable
          : grossBase > 0
            ? sale.taxable * grossLine / grossBase
            : 0
        const rate = Number(item.gst_rate ?? master.rate ?? 5)
        const key = [hsn, uqc, rate].join('|')
        const current = map.get(key) || {
          key, hsn, uqc, rate, b2bQty: 0, b2bTaxable: 0, b2bGst: 0, b2cQty: 0, b2cTaxable: 0, b2cGst: 0,
        }
        const gst = taxable * rate / 100
        if (sale.channel === 'Retailer') {
          current.b2bQty += qty
          current.b2bTaxable += taxable
          current.b2bGst += gst
        } else {
          current.b2cQty += qty
          current.b2cTaxable += taxable
          current.b2cGst += gst
        }
        map.set(key, current)
      })
    })
    return Array.from(map.values()).sort((a, b) => a.hsn.localeCompare(b.hsn) || a.rate - b.rate)
  }, [sales, productMaster])

  const b2bRows = useMemo(() => {
    const map = new Map<string, { name: string; gstin: string; state: string; taxable: number; gst: number; total: number; invoices: number }>()
    sales.filter((row) => row.channel === 'Retailer').forEach((row) => {
      const key = row.gstin || row.party
      const current = map.get(key) || { name: row.party, gstin: row.gstin, state: row.state, taxable: 0, gst: 0, total: 0, invoices: 0 }
      current.taxable += row.taxable
      current.gst += row.cgst + row.sgst + row.igst
      current.total += row.total
      current.invoices += 1
      map.set(key, current)
    })
    return Array.from(map.values()).sort((a, b) => b.taxable - a.taxable)
  }, [sales])

  const stateRows = useMemo(() => {
    const map = new Map<string, { state: string; taxable: number; cgst: number; sgst: number; igst: number; total: number }>()
    sales.forEach((row) => {
      const key = row.state || 'State not captured'
      const current = map.get(key) || { state: key, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
      current.taxable += row.taxable
      current.cgst += row.cgst
      current.sgst += row.sgst
      current.igst += row.igst
      current.total += row.total
      map.set(key, current)
    })
    return Array.from(map.values()).sort((a, b) => b.taxable - a.taxable)
  }, [sales])

  const saveProductMaster = async (slug: string) => {
    const item = productMaster[slug] || { hsn: '', uqc: 'PCS', rate: 5 }
    const { error } = await supabase.from('product_status').update({
      hsn_code: item.hsn.trim() || null,
      uqc: item.uqc.trim() || 'PCS',
    }).eq('product_slug', slug)
    if (error) {
      setMessage(error.message)
      return
    }
    setMessage('HSN / UQC saved.')
  }

  const addNote = async () => {
    if (!noteForm.note_number.trim() || !noteForm.party_name.trim()) {
      setMessage('Note number and party name are required.')
      return
    }
    setSaving(true)
    const taxable = Number(noteForm.taxable_amount || 0)
    const cgst = Number(noteForm.cgst || 0)
    const sgst = Number(noteForm.sgst || 0)
    const igst = Number(noteForm.igst || 0)
    const { error } = await supabase.from('gst_credit_debit_notes').insert({
      ...noteForm,
      note_number: noteForm.note_number.trim(),
      party_name: noteForm.party_name.trim(),
      party_gstin: noteForm.party_gstin.trim() || null,
      reference_invoice: noteForm.reference_invoice.trim() || null,
      taxable_amount: taxable,
      cgst,
      sgst,
      igst,
      reason: noteForm.reason.trim() || null,
    })
    setSaving(false)
    if (error) {
      setMessage(error.message)
      return
    }
    setMessage('Credit / debit note saved.')
    setNoteForm((current) => ({ ...current, note_number: '', party_name: '', party_gstin: '', reference_invoice: '', taxable_amount: '', cgst: '', sgst: '', igst: '', reason: '' }))
    await load()
  }

  const deleteNote = async (id: number) => {
    if (!window.confirm('Delete this note?')) return
    const { error } = await supabase.from('gst_credit_debit_notes').delete().eq('id', id)
    setMessage(error ? error.message : 'Note deleted.')
    if (!error) await load()
  }

  const saveClosing = async () => {
    setSaving(true)
    const allDone = checklistItems.every(([key]) => checklist[key])
    const payload = {
      financial_year: fyLabel,
      quarter: quarterConfig.value,
      checklist,
      notes: closingNotes.trim() || null,
      closed_at: allDone ? new Date().toISOString() : null,
    }
    const { error } = await supabase.from('gst_quarter_closings').upsert(payload, { onConflict: 'financial_year,quarter' })
    setSaving(false)
    setMessage(error ? error.message : allDone ? 'Quarter marked as reviewed and closed.' : 'Quarter closing checklist saved.')
    if (!error) setClosedAt(payload.closed_at)
  }

  const buildExportRows = () => {
    const rows: unknown[][] = []
    const row = (values: unknown[]) => {
      const padded = [...values, ...Array(Math.max(0, 11 - values.length)).fill('')]
      rows.push(padded.slice(0, 11))
    }
    const amount = (value: number) => Number.isFinite(Number(value)) ? Number(Number(value).toFixed(2)).toFixed(2) : '0.00'
    const qty = (value: number) => Number.isFinite(Number(value)) ? Number(Number(value).toFixed(2)).toFixed(2) : '0.00'
    const whole = (value: number) => Number.isFinite(Number(value)) ? String(Math.round(Number(value))) : '0'

    // Every row uses the same 11 columns so Excel/WPS cannot shift later sections.
    row(['TENOO GST WORKING SUMMARY', `${fyLabel} ${quarterConfig.value}`])
    row(['Period', `${indiaDate(quarterConfig.start)} - ${indiaDate(quarterConfig.end)}`])
    rows.push(Array(11).fill(''))
    row(['Section','Item / Party','GSTIN / Number','Date / State','UQC / Rate','Taxable','CGST','SGST','IGST','GST / Total','Status / Notes'])

    row(['SALES SUMMARY'])
    ;['Online','Retailer'].forEach((channel) => {
      const rows = sales.filter((item) => item.channel === channel)
      const values = rows.reduce((sum, item) => ({
        taxable: sum.taxable + item.taxable,
        cgst: sum.cgst + item.cgst,
        sgst: sum.sgst + item.sgst,
        igst: sum.igst + item.igst,
        total: sum.total + item.total,
      }), { taxable:0,cgst:0,sgst:0,igst:0,total:0 })
      row(['Sales Summary', channel, '', '', '', amount(values.taxable), amount(values.cgst), amount(values.sgst), amount(values.igst), amount(values.total), `${rows.length} invoices`])
    })
    row(['Sales Summary','TOTAL OUTPUT','','','',amount(netOutput.taxable),amount(netOutput.cgst),amount(netOutput.sgst),amount(netOutput.igst),amount(netOutput.taxable + netOutput.cgst + netOutput.sgst + netOutput.igst),'Quarter output'])
    rows.push(Array(11).fill(''))

    row(['PURCHASES / ITC'])
    expenses.forEach((item) => row([
      'Purchases / ITC',
      item.supplier_name,
      item.supplier_gstin || '',
      indiaDate(item.invoice_date),
      '',
      amount(item.taxable_amount),
      amount(item.cgst),
      amount(item.sgst),
      amount(item.igst),
      amount(item.total_amount),
      `${item.itc_status} · ${item.gstr2b_status}`,
    ]))
    if (expenses.length === 0) row(['Purchases / ITC','','','','','','','','','','No purchase / expense bills in this quarter.'])
    rows.push(Array(11).fill(''))

    row(['HSN SUMMARY'])
    hsnRows.forEach((item) => row([
      'HSN Summary',
      item.hsn,
      '',
      '',
      `${item.uqc} / ${amount(item.rate)}%`,
      amount(item.b2bTaxable + item.b2cTaxable),
      '',
      '',
      '',
      amount(item.b2bGst + item.b2cGst),
      `B2B Qty ${qty(item.b2bQty)} · B2C Qty ${qty(item.b2cQty)} · B2B Taxable ${amount(item.b2bTaxable)} · B2C Taxable ${amount(item.b2cTaxable)}`,
    ]))
    if (hsnRows.length === 0) row(['HSN Summary','','','','','','','','','','No HSN sales in this quarter.'])
    rows.push(Array(11).fill(''))

    row(['B2B SUMMARY'])
    b2bRows.forEach((item) => row([
      'B2B Summary',
      item.name,
      item.gstin || '',
      item.state || '',
      whole(item.invoices),
      amount(item.taxable),
      '',
      '',
      '',
      amount(item.gst),
      `Total ${amount(item.total)}`,
    ]))
    if (b2bRows.length === 0) row(['B2B Summary','','','','','','','','','','No B2B sales in this quarter.'])
    rows.push(Array(11).fill(''))

    row(['STATE SUMMARY'])
    stateRows.forEach((item) => row([
      'State Summary',
      item.state,
      '',
      item.state,
      '',
      amount(item.taxable),
      amount(item.cgst),
      amount(item.sgst),
      amount(item.igst),
      amount(item.total),
      '',
    ]))
    if (stateRows.length === 0) row(['State Summary','','','','','','','','','','No state-wise sales in this quarter.'])
    rows.push(Array(11).fill(''))

    row(['CREDIT / DEBIT NOTES'])
    notes.forEach((item) => row([
      'Credit / Debit Note',
      item.party_name,
      item.party_gstin || '',
      indiaDate(item.note_date),
      item.note_number,
      amount(item.taxable_amount),
      amount(item.cgst),
      amount(item.sgst),
      amount(item.igst),
      amount(item.taxable_amount + item.cgst + item.sgst + item.igst),
      `${item.note_type} · Ref ${item.reference_invoice || '—'}`,
    ]))
    if (notes.length === 0) row(['Credit / Debit Note','','','','','','','','','','No credit / debit notes in this quarter.'])

    return rows
  }

  const exportCsv = () => {
    const rows = buildExportRows()
    const csvContent = '\uFEFF' + rows.map((values) => values.map(csvEscape).join(',')).join('\r\n') + '\r\n'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tenoo-gst-${fyLabel.replace(/[^0-9-]/g, '')}-${quarterConfig.value.toLowerCase()}-working.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const exportExcel = () => {
    const rows = buildExportRows()
    const escapeHtml = (value: unknown) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

    const widths = [18, 30, 24, 18, 16, 16, 14, 14, 14, 18, 46]
    const htmlRows = rows.map((values, rowIndex) => {
      const cells = values.map((value, columnIndex) => {
        const isBlank = String(value ?? '') === ''
        const isSection = rowIndex === 0 || String(values[0] ?? '').endsWith('SUMMARY') || String(values[0] ?? '') === 'PURCHASES / ITC' || String(values[0] ?? '') === 'CREDIT / DEBIT NOTES'
        return `<td style="min-width:${widths[columnIndex]}ch;width:${widths[columnIndex]}ch;padding:7px 12px;vertical-align:top;border-bottom:1px solid #e5e7eb;${isSection ? 'font-weight:700;background:#f5f7f2;' : ''}">${isBlank ? '&nbsp;' : escapeHtml(value)}</td>`
      }).join('')
      return `<tr>${cells}</tr>`
    }).join('')

    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      body{font-family:Calibri,Arial,sans-serif;font-size:11pt}
      table{border-collapse:collapse;table-layout:fixed}
      td{white-space:normal}
    </style></head><body><table>${htmlRows}</table></body></html>`
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tenoo-gst-${fyLabel.replace(/[^0-9-]/g, '')}-${quarterConfig.value.toLowerCase()}-working.xls`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  if (authorized === null) return <><SiteHeader /><main className="p-10 text-center">Loading…</main></>
  if (!authorized) return <><SiteHeader /><main className="p-10 text-center">Admin access only.</main></>

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-muted/20 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">GST Control Centre</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">GST Reports / Quarter Closing</h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                One working screen for sales, purchases, ITC, HSN, B2B/B2C and quarter closing. This is a reconciliation / preparation tool, not a GST filing engine.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href="/admin/expenses" className="rounded-xl border bg-background px-4 py-2.5 text-center text-sm font-semibold hover:bg-muted">GST / Expenses</Link>
              <div className="flex flex-wrap gap-2">
  <button type="button" onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold"><Download className="h-4 w-4" />CSV</button>
  <button type="button" onClick={exportExcel} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Download className="h-4 w-4" />Excel</button>
</div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 rounded-2xl border bg-background p-4 sm:grid-cols-3">
            <label className="text-xs font-semibold text-muted-foreground">
              Financial Year
              <select value={fyYear} onChange={(e) => setFyYear(Number(e.target.value))} className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground">
                {[2025, 2026, 2027].map((year) => <option key={year} value={year}>{year}-{String(year + 1).slice(-2)}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-muted-foreground">
              Quarter
              <select value={quarterKey} onChange={(e) => setQuarterKey(e.target.value)} className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground">
                {quarterOptions(fyYear).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <div className="flex items-end rounded-xl border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">Period</p>
                <p className="mt-1 text-sm font-semibold">{indiaDate(quarterConfig.start)} – {indiaDate(quarterConfig.end)}</p>
              </div>
            </div>
          </div>

          {message && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{message}</div>}
          {loading && <div className="mt-4 rounded-xl border bg-background px-4 py-3 text-sm text-muted-foreground">Refreshing GST working data…</div>}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ['Sales', money(output.total)],
              ['Taxable', money(output.taxable)],
              ['Output GST', money(output.cgst + output.sgst + output.igst)],
              ['Input ITC', money(input.matchedItc)],
              ['Net GST', money(estimatedNetPayable)],
              ['2B Pending', String(expenses.filter((row) => row.gstr2b_status !== 'Matched').length)],
            ].map(([label, value]) => <div key={label} className="rounded-2xl border bg-background p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div>)}
          </div>

          <div className="sticky z-[45] -mx-4 mt-6 border-y border-border/70 bg-background px-4 shadow-md backdrop-blur-md sm:-mx-6 sm:px-6" style={{ top: "var(--tenoo-site-header-height, 104px)" }}>
            <div className="flex gap-2 overflow-x-auto">
              {[
                ['overview','Overview'],['gstr1','GSTR-1 Working'],['gstr3b','GSTR-3B Working'],['hsn','HSN / B2B / State'],['itc','ITC / GSTR-2B'],['notes','Credit / Debit Notes'],['closing','Quarter Closing'],
              ].map(([value,label]) => <button key={value} type="button" onClick={() => setTab(value)} className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold ${tab === value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{label}</button>)}
            </div>
          </div>

          {tab === 'overview' && (
            <section className="mt-6 space-y-5">
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border bg-background p-5"><p className="text-sm font-semibold">Outward supplies</p><p className="mt-2 text-2xl font-bold">{money(output.total)}</p><p className="mt-1 text-xs text-muted-foreground">Online {money(sales.filter((r) => r.channel === 'Online').reduce((s,r)=>s+r.total,0))} · Retailer {money(sales.filter((r) => r.channel === 'Retailer').reduce((s,r)=>s+r.total,0))}</p></div>
                <div className="rounded-2xl border bg-background p-5"><p className="text-sm font-semibold">Output GST</p><p className="mt-2 text-2xl font-bold">{money(output.cgst + output.sgst + output.igst)}</p><p className="mt-1 text-xs text-muted-foreground">CGST {money(output.cgst)} · SGST {money(output.sgst)} · IGST {money(output.igst)}</p></div>
                <div className="rounded-2xl border bg-background p-5"><p className="text-sm font-semibold">Working net liability</p><p className="mt-2 text-2xl font-bold">{money(estimatedNetPayable)}</p><p className="mt-1 text-xs text-muted-foreground">Net output GST less matched ITC. Verify other liabilities, reversals and adjustments before filing.</p></div>
              </div>
              <div className="rounded-2xl border bg-background p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">Quarter health</h2><p className="text-xs text-muted-foreground">The warning count tells you what still needs review before handing the quarter to your CA.</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{checklistItems.filter(([key]) => checklist[key]).length}/{checklistItems.length} checks</span></div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {checklistItems.map(([key,label]) => <div key={key} className={`rounded-xl border px-4 py-3 text-sm ${checklist[key] ? 'border-emerald-200 bg-emerald-50' : 'bg-background'}`}>{checklist[key] ? '✓ ' : '○ '}{label}</div>)}
                </div>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
                <p className="font-semibold">Quarterly filing note</p>
                <p className="mt-1">If Tenoo is on the QRMP scheme, GSTR-1 and GSTR-3B are filed quarterly, but tax payment is still made monthly. Keep this quarter report alongside the monthly payment/challan records.</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                <p className="font-semibold">Important filing boundary</p>
                <p className="mt-1">This page prepares and reconciles figures from your website. It does not file GSTR-1/GSTR-3B and it does not decide eligibility of ITC. GST portal data, invoice records, reversals, RCM and other adjustments must be checked before filing.</p>
              </div>
            </section>
          )}

          {tab === 'gstr1' && (
            <section className="mt-6 space-y-5">
              <div className="rounded-2xl border bg-background p-5">
                <h2 className="font-semibold">GSTR-1 working summary</h2>
                <p className="mt-1 text-xs text-muted-foreground">Use this as your quarter-level outward-supply working. Retailer orders are treated as B2B and online orders as B2C in this internal report.</p>
                <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="px-3 py-3">Channel</th><th className="px-3 py-3 text-right">Invoices</th><th className="px-3 py-3 text-right">Taxable</th><th className="px-3 py-3 text-right">CGST</th><th className="px-3 py-3 text-right">SGST</th><th className="px-3 py-3 text-right">IGST</th><th className="px-3 py-3 text-right">Total</th></tr></thead><tbody>{['Online','Retailer'].map((channel) => { const rows=sales.filter(r=>r.channel===channel); const v=rows.reduce((s,r)=>({taxable:s.taxable+r.taxable,cgst:s.cgst+r.cgst,sgst:s.sgst+r.sgst,igst:s.igst+r.igst,total:s.total+r.total}),{taxable:0,cgst:0,sgst:0,igst:0,total:0}); return <tr key={channel} className="border-b"><td className="px-3 py-3 font-semibold">{channel==='Online'?'B2C':'B2B'}</td><td className="px-3 py-3 text-right">{rows.length}</td><td className="px-3 py-3 text-right">{money(v.taxable)}</td><td className="px-3 py-3 text-right">{money(v.cgst)}</td><td className="px-3 py-3 text-right">{money(v.sgst)}</td><td className="px-3 py-3 text-right">{money(v.igst)}</td><td className="px-3 py-3 text-right font-semibold">{money(v.total)}</td></tr>})}<tr className="bg-muted/30 font-bold"><td className="px-3 py-3">Net outward after notes</td><td className="px-3 py-3 text-right">{sales.length}</td><td className="px-3 py-3 text-right">{money(netOutput.taxable)}</td><td className="px-3 py-3 text-right">{money(netOutput.cgst)}</td><td className="px-3 py-3 text-right">{money(netOutput.sgst)}</td><td className="px-3 py-3 text-right">{money(netOutput.igst)}</td><td className="px-3 py-3 text-right">{money(netOutput.taxable+netOutput.cgst+netOutput.sgst+netOutput.igst)}</td></tr></tbody></table></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">Pending orders in this period: {sales.filter((row) => row.status === 'pending').length}</p>
                  <p className="mt-1 text-xs">These are included in the website working set but should be checked against the actual invoice / time-of-supply before filing.</p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                  <p className="font-semibold">B2C Large candidates: {sales.filter((row) => row.channel === 'Online' && row.igst > 0 && row.total > 100000).length}</p>
                  <p className="mt-1 text-xs">Current GST portal guidance uses the inter-state consumer threshold of more than ₹1 lakh for B2C Large from August 2024 return periods.</p>
                </div>
              </div>
              <div className="rounded-2xl border bg-background p-5"><h2 className="font-semibold">Invoice-level sales register</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[900px] text-xs"><thead><tr className="border-b text-left text-muted-foreground"><th className="px-3 py-2">Date</th><th className="px-3 py-2">Channel</th><th className="px-3 py-2">Party</th><th className="px-3 py-2">GSTIN</th><th className="px-3 py-2">State</th><th className="px-3 py-2 text-right">Taxable</th><th className="px-3 py-2 text-right">GST</th><th className="px-3 py-2 text-right">Total</th></tr></thead><tbody>{sales.map((row)=><tr key={row.id} className="border-b"><td className="px-3 py-2">{indiaDate(row.date)}</td><td className="px-3 py-2">{row.channel}</td><td className="px-3 py-2">{row.party}</td><td className="px-3 py-2">{row.gstin||'—'}</td><td className="px-3 py-2">{row.state||'—'}</td><td className="px-3 py-2 text-right">{money(row.taxable)}</td><td className="px-3 py-2 text-right">{money(row.cgst+row.sgst+row.igst)}</td><td className="px-3 py-2 text-right font-semibold">{money(row.total)}</td></tr>)}</tbody></table></div></div>
            </section>
          )}

          {tab === 'gstr3b' && (
            <section className="mt-6 space-y-5">
              <div className="rounded-2xl border bg-background p-5">
                <h2 className="font-semibold">GSTR-3B working summary</h2>
                <p className="mt-1 text-xs text-muted-foreground">Internal working only. The final return can include other liabilities, RCM, reversals, blocked/ineligible ITC and adjustments that are not represented here.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Output CGST</p><p className="mt-1 text-lg font-bold">{money(netOutput.cgst)}</p></div>
                  <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Output SGST</p><p className="mt-1 text-lg font-bold">{money(netOutput.sgst)}</p></div>
                  <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Output IGST</p><p className="mt-1 text-lg font-bold">{money(netOutput.igst)}</p></div>
                  <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Matched ITC</p><p className="mt-1 text-lg font-bold">{money(input.matchedItc)}</p></div>
                </div>
                <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div><p className="text-sm font-semibold">Working net GST after matched ITC</p><p className="mt-1 text-xs text-muted-foreground">Output GST {money(netOutputGst)} − matched ITC {money(input.matchedItc)}</p></div>
                    <p className="text-2xl font-bold">{money(estimatedNetPayable)}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border bg-background p-5">
                <h2 className="font-semibold">ITC safety checks</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Bills with ITC = Yes</p><p className="mt-1 text-lg font-bold">{money(input.itc)}</p></div>
                  <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">ITC + GSTR-2B matched</p><p className="mt-1 text-lg font-bold">{money(input.matchedItc)}</p></div>
                  <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">2B not matched</p><p className="mt-1 text-lg font-bold">{expenses.filter((row) => row.gstr2b_status !== 'Matched').length}</p></div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">GSTR-2B is a read-only auto-drafted statement used to support ITC decisions. Do not treat the website's matched amount as an automatic eligibility decision.</p>
              </div>
            </section>
          )}

          {tab === 'hsn' && (
            <section className="mt-6 space-y-5">
              <div className="rounded-2xl border bg-background p-5">
                <h2 className="font-semibold">Product GST master</h2>
                <p className="mt-1 text-xs text-muted-foreground">HSN/UQC are kept in your product master so the quarter report can group sales correctly. Verify the classification against the GST portal/your CA before filing.</p>
                <div className="mt-4 grid gap-3">{ALL_PRODUCTS.map((product) => { const value=productMaster[product.slug]||{hsn:'',uqc:'PCS',rate:5}; return <div key={product.slug} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_180px_100px_auto] sm:items-end"><div><p className="text-sm font-semibold">{product.name}</p><p className="text-xs text-muted-foreground">{product.slug}</p></div><label className="text-xs font-semibold text-muted-foreground">HSN Code<input value={value.hsn} onChange={(e)=>setProductMaster((current)=>({...current,[product.slug]:{...value,hsn:e.target.value}}))} placeholder="e.g. 21069099" className="mt-1 h-10 w-full rounded-lg border px-3 text-sm" /></label><label className="text-xs font-semibold text-muted-foreground">UQC<input value={value.uqc} onChange={(e)=>setProductMaster((current)=>({...current,[product.slug]:{...value,uqc:e.target.value.toUpperCase()}}))} placeholder="PCS" className="mt-1 h-10 w-full rounded-lg border px-3 text-sm" /></label><button type="button" onClick={()=>saveProductMaster(product.slug)} className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"><Save className="mr-1 inline h-4 w-4" />Save</button></div>})}</div>
              </div>
              <div className="rounded-2xl border bg-background p-5"><h2 className="font-semibold">HSN-wise outward summary</h2><p className="mt-1 text-xs text-muted-foreground">B2B and B2C are split because the GST portal's current Table 12 workflow separates them.</p><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[980px] text-xs"><thead><tr className="border-b text-left text-muted-foreground"><th className="px-2 py-2">HSN</th><th className="px-2 py-2">UQC</th><th className="px-2 py-2">Rate</th><th className="px-2 py-2 text-right">B2B Qty</th><th className="px-2 py-2 text-right">B2B Taxable</th><th className="px-2 py-2 text-right">B2B GST</th><th className="px-2 py-2 text-right">B2C Qty</th><th className="px-2 py-2 text-right">B2C Taxable</th><th className="px-2 py-2 text-right">B2C GST</th></tr></thead><tbody>{hsnRows.map(row=><tr key={row.key} className={`border-b ${row.hsn==='UNMAPPED'?'bg-amber-50':''}`}><td className="px-2 py-2 font-semibold">{row.hsn}</td><td className="px-2 py-2">{row.uqc}</td><td className="px-2 py-2">{row.rate}%</td><td className="px-2 py-2 text-right">{number(row.b2bQty)}</td><td className="px-2 py-2 text-right">{money(row.b2bTaxable)}</td><td className="px-2 py-2 text-right">{money(row.b2bGst)}</td><td className="px-2 py-2 text-right">{number(row.b2cQty)}</td><td className="px-2 py-2 text-right">{money(row.b2cTaxable)}</td><td className="px-2 py-2 text-right">{money(row.b2cGst)}</td></tr>)}</tbody></table></div></div>
              <div className="rounded-2xl border bg-background p-5"><h2 className="font-semibold">B2B recipient summary</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="px-3 py-2">Retailer</th><th className="px-3 py-2">GSTIN</th><th className="px-3 py-2">State</th><th className="px-3 py-2 text-right">Invoices</th><th className="px-3 py-2 text-right">Taxable</th><th className="px-3 py-2 text-right">GST</th><th className="px-3 py-2 text-right">Total</th></tr></thead><tbody>{b2bRows.map(row=><tr key={row.gstin||row.name} className="border-b"><td className="px-3 py-2">{row.name}</td><td className="px-3 py-2">{row.gstin||<span className="text-amber-700">GSTIN missing</span>}</td><td className="px-3 py-2">{row.state||'—'}</td><td className="px-3 py-2 text-right">{row.invoices}</td><td className="px-3 py-2 text-right">{money(row.taxable)}</td><td className="px-3 py-2 text-right">{money(row.gst)}</td><td className="px-3 py-2 text-right">{money(row.total)}</td></tr>)}</tbody></table></div></div>
              <div className="rounded-2xl border bg-background p-5"><h2 className="font-semibold">State-wise outward supply</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="px-3 py-2">State</th><th className="px-3 py-2 text-right">Taxable</th><th className="px-3 py-2 text-right">CGST</th><th className="px-3 py-2 text-right">SGST</th><th className="px-3 py-2 text-right">IGST</th><th className="px-3 py-2 text-right">Total</th></tr></thead><tbody>{stateRows.map(row=><tr key={row.state} className="border-b"><td className="px-3 py-2">{row.state}</td><td className="px-3 py-2 text-right">{money(row.taxable)}</td><td className="px-3 py-2 text-right">{money(row.cgst)}</td><td className="px-3 py-2 text-right">{money(row.sgst)}</td><td className="px-3 py-2 text-right">{money(row.igst)}</td><td className="px-3 py-2 text-right font-semibold">{money(row.total)}</td></tr>)}</tbody></table></div></div>
            </section>
          )}

          {tab === 'itc' && (
            <section className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border bg-background p-5"><p className="text-xs text-muted-foreground">Purchase / expense total</p><p className="mt-2 text-xl font-bold">{money(input.total)}</p></div><div className="rounded-2xl border bg-background p-5"><p className="text-xs text-muted-foreground">ITC marked Yes</p><p className="mt-2 text-xl font-bold">{money(input.itc)}</p></div><div className="rounded-2xl border bg-background p-5"><p className="text-xs text-muted-foreground">ITC marked Yes + 2B Matched</p><p className="mt-2 text-xl font-bold">{money(input.matchedItc)}</p></div></div>
              <div className="rounded-2xl border bg-background p-5"><h2 className="font-semibold">GSTR-2B reconciliation queue</h2><p className="mt-1 text-xs text-muted-foreground">GSTR-2B is an auto-drafted ITC statement. Use the portal statement and your invoice records to decide eligibility; this screen only tracks your internal status.</p><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[800px] text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="px-3 py-2">Date</th><th className="px-3 py-2">Supplier</th><th className="px-3 py-2">GSTIN</th><th className="px-3 py-2 text-right">GST</th><th className="px-3 py-2">ITC</th><th className="px-3 py-2">2B</th></tr></thead><tbody>{expenses.map(row=><tr key={row.id} className="border-b"><td className="px-3 py-2">{indiaDate(row.invoice_date)}</td><td className="px-3 py-2">{row.supplier_name}</td><td className="px-3 py-2">{row.supplier_gstin||'—'}</td><td className="px-3 py-2 text-right">{money(row.cgst+row.sgst+row.igst)}</td><td className="px-3 py-2">{row.itc_status}</td><td className="px-3 py-2">{row.gstr2b_status}</td></tr>)}</tbody></table></div></div>
            </section>
          )}

          {tab === 'notes' && (
            <section className="mt-6 space-y-5">
              <div className="rounded-2xl border bg-background p-5">
                <h2 className="font-semibold">Add credit / debit note</h2>
                <p className="mt-1 text-xs text-muted-foreground">Keep GST adjustment documents in the same quarter working so the outward-supply summary can be reconciled.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="text-xs font-semibold text-muted-foreground">Type
                    <select value={noteForm.note_type} onChange={(e)=>setNoteForm((v)=>({...v,note_type:e.target.value as 'Credit Note'|'Debit Note'}))} className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm">
                      <option>Credit Note</option><option>Debit Note</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-muted-foreground">Note number
                    <input value={noteForm.note_number} onChange={(e)=>setNoteForm((v)=>({...v,note_number:e.target.value}))} className="mt-1 h-10 w-full rounded-lg border px-3 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-muted-foreground">Date
                    <input type="date" value={noteForm.note_date} onChange={(e)=>setNoteForm((v)=>({...v,note_date:e.target.value}))} className="mt-1 h-10 w-full rounded-lg border px-3 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-muted-foreground">Party type
                    <select value={noteForm.party_type} onChange={(e)=>setNoteForm((v)=>({...v,party_type:e.target.value as 'B2B'|'B2C'}))} className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm">
                      <option>B2B</option><option>B2C</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-muted-foreground lg:col-span-2">Party name
                    <input value={noteForm.party_name} onChange={(e)=>setNoteForm((v)=>({...v,party_name:e.target.value}))} className="mt-1 h-10 w-full rounded-lg border px-3 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-muted-foreground">Party GSTIN
                    <input value={noteForm.party_gstin} onChange={(e)=>setNoteForm((v)=>({...v,party_gstin:e.target.value.toUpperCase()}))} className="mt-1 h-10 w-full rounded-lg border px-3 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-muted-foreground">Reference invoice
                    <input value={noteForm.reference_invoice} onChange={(e)=>setNoteForm((v)=>({...v,reference_invoice:e.target.value}))} className="mt-1 h-10 w-full rounded-lg border px-3 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-muted-foreground">Taxable
                    <input type="number" min="0" step="0.01" value={noteForm.taxable_amount} onChange={(e)=>setNoteForm((v)=>({...v,taxable_amount:e.target.value}))} className="mt-1 h-10 w-full rounded-lg border px-3 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-muted-foreground">CGST
                    <input type="number" min="0" step="0.01" value={noteForm.cgst} onChange={(e)=>setNoteForm((v)=>({...v,cgst:e.target.value}))} className="mt-1 h-10 w-full rounded-lg border px-3 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-muted-foreground">SGST
                    <input type="number" min="0" step="0.01" value={noteForm.sgst} onChange={(e)=>setNoteForm((v)=>({...v,sgst:e.target.value}))} className="mt-1 h-10 w-full rounded-lg border px-3 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-muted-foreground">IGST
                    <input type="number" min="0" step="0.01" value={noteForm.igst} onChange={(e)=>setNoteForm((v)=>({...v,igst:e.target.value}))} className="mt-1 h-10 w-full rounded-lg border px-3 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-muted-foreground lg:col-span-3">Reason
                    <input value={noteForm.reason} onChange={(e)=>setNoteForm((v)=>({...v,reason:e.target.value}))} className="mt-1 h-10 w-full rounded-lg border px-3 text-sm" />
                  </label>
                  <div className="flex items-end">
                    <button type="button" disabled={saving} onClick={addNote} className="h-10 w-full rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Plus className="mr-1 inline h-4 w-4" /> Save note</button>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border bg-background p-5">
                <h2 className="font-semibold">Quarter notes</h2>
                <div className="mt-4 space-y-2">
                  {notes.length === 0 ? (
                    <p className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">No credit / debit notes recorded for this quarter.</p>
                  ) : notes.map((note) => (
                    <div key={note.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">{note.note_type} · {note.note_number}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{indiaDate(note.note_date)} · {note.party_name} · {note.party_gstin || 'No GSTIN'} · Ref {note.reference_invoice || '—'}</p>
                        {note.reason && <p className="mt-1 text-xs text-muted-foreground">{note.reason}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{money(note.taxable_amount + note.cgst + note.sgst + note.igst)}</span>
                        <button type="button" onClick={()=>deleteNote(note.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label="Delete note"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {tab === 'closing' && (
            <section className="mt-6 space-y-5">
              <div className="rounded-2xl border bg-background p-5">
                <div className="flex items-start gap-3">
                  <FileCheck2 className="mt-0.5 h-6 w-6 text-primary" />
                  <div>
                    <h2 className="font-semibold">Quarter closing checklist</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Complete these checks before sharing the quarter figures with your CA.</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {checklistItems.map(([key,label]) => (
                    <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-4 text-sm">
                      <input type="checkbox" checked={Boolean(checklist[key])} onChange={(e)=>setChecklist((v)=>({...v,[key]:e.target.checked}))} className="h-5 w-5" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
                <label className="mt-5 block text-sm font-semibold">
                  Quarter notes
                  <textarea value={closingNotes} onChange={(e)=>setClosingNotes(e.target.value)} rows={4} placeholder="Anything your CA should know about this quarter..." className="mt-2 w-full rounded-xl border px-4 py-3 text-sm" />
                </label>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">{closedAt ? `Closed / reviewed on ${new Date(closedAt).toLocaleString('en-IN')}` : 'Not closed yet'}</p>
                  <button type="button" disabled={saving} onClick={saveClosing} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Save className="mr-1 inline h-4 w-4" /> Save quarter closing</button>
                </div>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
                <h2 className="font-semibold">What this prepares</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>GSTR-1 outward-supply working: B2B, B2C, state and HSN views.</li>
                  <li>GSTR-3B working: output GST versus internally matched ITC.</li>
                  <li>Purchase / expense and GSTR-2B reconciliation queue.</li>
                  <li>Credit / debit note working for the selected quarter.</li>
                </ul>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  )
}
