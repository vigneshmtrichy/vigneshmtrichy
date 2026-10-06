'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Pencil, Plus, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SiteHeader } from '@/components/site-header'

type Row = { code: string; manufacturer: string; address: string[]; fssai: string }
type Group = {
  key: string
  manufacturer: string
  address: string[]
  fssai: string
  codes: string[]
}

const EMPTY = { code: '', manufacturer: '', address: '', fssai: '' }

export default function AdminManufacturersPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [mode, setMode] = useState<'new' | 'add-code' | 'edit'>('new')
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }

    const ok = user.email === 'info@tenoo.in'
    setAuthorized(ok)
    if (!ok) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('manufacturer_verification')
      .select('code, manufacturer, address, fssai')
      .order('manufacturer')
      .order('code')

    if (error) {
      console.error(error)
      setMessage('Unable to load manufacturer settings.')
    } else {
      setRows((data || []).map((r: any) => ({
        code: String(r.code),
        manufacturer: String(r.manufacturer),
        address: Array.isArray(r.address) ? r.address.map(String) : [],
        fssai: String(r.fssai),
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>()

    for (const row of rows) {
      const key = [
        row.manufacturer.trim().toLowerCase(),
        row.address.join('|').trim().toLowerCase(),
        row.fssai.trim(),
      ].join('::')

      const existing = map.get(key)
      if (existing) {
        existing.codes.push(row.code)
      } else {
        map.set(key, {
          key,
          manufacturer: row.manufacturer,
          address: row.address,
          fssai: row.fssai,
          codes: [row.code],
        })
      }
    }

    return Array.from(map.values())
  }, [rows])

  const validateField = (key: keyof typeof EMPTY, rawValue: string) => {
    const value = rawValue.trim()
    if (!value) {
      if (key === 'manufacturer') return 'Manufacturer name is required.'
      if (key === 'address') return 'Address is required.'
      if (key === 'fssai') return 'FSSAI Licence No. is required.'
      if (key === 'code' && (mode === 'new' || mode === 'add-code')) return 'Batch code is required.'
      return ''
    }
    if (key === 'code') return /^[A-Z]{2,3}$/.test(value) ? '' : 'Batch code must be 2 or 3 letters.'
    if (key === 'manufacturer') return /^[A-Za-z0-9][A-Za-z0-9 .&'()\-]{1,99}$/.test(value) ? '' : 'Enter a valid manufacturer name.'
    if (key === 'address') return value.length >= 5 ? '' : 'Address must be at least 5 characters.'
    if (key === 'fssai') return /^\d{14}$/.test(value) ? '' : 'FSSAI Licence No. must be exactly 14 digits.'
    return ''
  }

  const handleFieldChange = (key: keyof typeof EMPTY, rawValue: string) => {
    let value = rawValue
    if (key === 'code') value = value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
    if (key === 'fssai') value = value.replace(/\D/g, '').slice(0, 14)
    setForm(current => ({ ...current, [key]: value }))
    setFieldErrors(current => ({ ...current, [key]: validateField(key, value) }))
  }
  const closeForm = () => {
    setFormOpen(false)
    setMode('new')
    setEditingGroup(null)
    setForm(EMPTY)
    setFieldErrors({})
    setMessage('')
  }

  const openNew = () => {
    setMode('new')
    setEditingGroup(null)
    setForm(EMPTY)
    setFieldErrors({})
    setFormOpen(true)
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openAddCode = (group: Group) => {
    setMode('add-code')
    setEditingGroup(group)
    setForm({
      code: '',
      manufacturer: group.manufacturer,
      address: group.address.join('\n'),
      fssai: group.fssai,
    })
    setFieldErrors({})
    setFormOpen(true)
    setMessage('')
    setOpenGroup(group.key)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openEdit = (group: Group) => {
    setMode('edit')
    setEditingGroup(group)
    setForm({
      code: '',
      manufacturer: group.manufacturer,
      address: group.address.join('\n'),
      fssai: group.fssai,
    })
    setFormOpen(true)
    setMessage('')
    setOpenGroup(group.key)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const save = async () => {
    const code = form.code.trim().toUpperCase().replace(/[^A-Z]/g, '')
    const manufacturer = form.manufacturer.trim()
    const address = form.address.split('\n').map(x => x.trim()).filter(Boolean)
    const fssai = form.fssai.trim()

    const errors: Record<string, string> = {}
    ;(['code', 'manufacturer', 'address', 'fssai'] as (keyof typeof EMPTY)[]).forEach((key) => {
      const error = validateField(key, form[key])
      if (error) errors[key] = error
    })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setMessage('Please correct the highlighted fields before saving.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      if (mode === 'new' || mode === 'add-code') {
        const { error } = await supabase
          .from('manufacturer_verification')
          .upsert({
            code,
            manufacturer,
            address,
            fssai,
            updated_at: new Date().toISOString(),
          })

        if (error) throw error

        setMessage(`Batch code "${code}" added to ${manufacturer}.`)
      } else if (mode === 'edit' && editingGroup) {
        // Update manufacturer details for every batch code belonging to this manufacturer group.
        for (const existingCode of editingGroup.codes) {
          const { error } = await supabase
            .from('manufacturer_verification')
            .update({
              manufacturer,
              address,
              fssai,
              updated_at: new Date().toISOString(),
            })
            .eq('code', existingCode)

          if (error) throw error
        }

        setMessage(`${manufacturer} details updated for ${editingGroup.codes.join(', ')}.`)
      }

      await load()
      setFormOpen(false)
      setMode('new')
      setEditingGroup(null)
      setForm(EMPTY)
    } catch (error) {
      console.error(error)
      setMessage(mode === 'edit'
        ? 'Unable to update manufacturer details.'
        : 'Unable to save batch code. Please check whether the code already exists.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (code: string) => {
    if (!window.confirm(`Delete batch code "${code}"?`)) return

    const { error } = await supabase
      .from('manufacturer_verification')
      .delete()
      .eq('code', code)

    if (error) {
      console.error(error)
      setMessage('Unable to delete this code.')
      return
    }

    setMessage(`Batch code "${code}" deleted.`)
    await load()
  }

  if (authorized === null || loading) {
    return <>
      <SiteHeader />
      <main className="min-h-screen p-10 text-sm text-muted-foreground">Loading…</main>
    </>
  }

  if (!authorized) {
    return <>
      <SiteHeader />
      <main className="min-h-screen p-10 text-center">
        <h1 className="text-2xl font-semibold">Admin access only</h1>
        <Link href="/" className="mt-5 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
          Back to store
        </Link>
      </main>
    </>
  }

  return <>
    <SiteHeader />
    <main className="min-h-screen bg-muted/20 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">SETTINGS</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Manufacturer Verification</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage manufacturers and all their batch-code prefixes in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:scale-[1.03] hover:shadow-md active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            Add Manufacturer
          </button>
        </div>

        {message && (
          <div className="mt-5 rounded-xl border bg-background px-4 py-3 text-sm">
            {message}
          </div>
        )}

        {formOpen && (
          <section className="mt-6 rounded-2xl border bg-background p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {mode === 'new' ? 'Add Manufacturer' : mode === 'add-code' ? 'Add Batch Code' : 'Edit Manufacturer'}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {mode === 'add-code'
                    ? `Add another batch prefix under ${editingGroup?.manufacturer}.`
                    : mode === 'edit'
                      ? `Changes will apply to all batch codes: ${editingGroup?.codes.join(', ')}.`
                      : 'Create a manufacturer and its first batch-code prefix.'}
                </p>
              </div>
              <button type="button" onClick={closeForm} className="rounded-full p-2 text-muted-foreground hover:bg-muted" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {(mode === 'new' || mode === 'add-code') && (
                <label className="text-sm font-medium">
                  Batch Code
                  <input
                    value={form.code}
                    maxLength={3}
                    onChange={e => handleFieldChange('code', e.target.value)}
                    placeholder="e.g. ABC"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-3 outline-none focus:border-primary"
                  />
                </label>
              )}

              <label className="text-sm font-medium">
                Manufacturer Name
                <input
                  value={form.manufacturer}
                  disabled={mode === 'add-code'}
                  onChange={e => handleFieldChange('manufacturer', e.target.value)}
                  placeholder="e.g. Your Manufacturer Name"
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-3 outline-none focus:border-primary disabled:bg-muted/40"
                />
              </label>

              <label className="text-sm font-medium md:col-span-2">
                Address
                <textarea
                  rows={4}
                  value={form.address}
                  disabled={mode === 'add-code'}
                  onChange={e => handleFieldChange('address', e.target.value)}
                  placeholder={'e.g. 123, Main Street\nCity, Tamil Nadu'}
                  className="mt-2 w-full rounded-xl border bg-background px-3 py-3 outline-none focus:border-primary disabled:bg-muted/40"
                />
              </label>

              <label className="text-sm font-medium">
                FSSAI Licence No.
                <input
                  value={form.fssai}
                  disabled={mode === 'add-code'}
                  onChange={e => handleFieldChange('fssai', e.target.value)}
                  placeholder="e.g. 12345678901234"
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-3 outline-none focus:border-primary disabled:bg-muted/40"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {saving
                ? 'Saving…'
                : mode === 'new'
                  ? 'Add Manufacturer'
                  : mode === 'add-code'
                    ? 'Add Batch Code'
                    : 'Save Changes'}
            </button>
          </section>
        )}

        <section className="mt-6 overflow-hidden rounded-2xl border bg-background shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Manufacturers</h2>
          </div>

          <div className="divide-y">
            {groups.map(group => {
              const isOpen = openGroup === group.key

              return (
                <div key={group.key} className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setOpenGroup(isOpen ? null : group.key)}
                    className="flex w-full items-center justify-between gap-4 text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{group.manufacturer}</span>
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                          {group.codes.length} {group.codes.length === 1 ? 'code' : 'codes'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {group.address.join(' • ')}
                      </p>
                    </div>
                    <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="mt-4 rounded-xl bg-muted/30 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                            Batch Codes
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {group.codes.map(code => (
                              <span key={code} className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-bold text-primary">
                                {code}
                                <button
                                  type="button"
                                  onClick={() => void remove(code)}
                                  className="rounded-full p-0.5 text-red-500 shadow-sm transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-md active:scale-[0.99] hover:bg-red-50"
                                  aria-label={`Delete ${code}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => openAddCode(group)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-md active:scale-[0.99]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Code
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(group)}
                            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold shadow-sm transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-md active:scale-[0.99] hover:bg-muted"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-muted-foreground">
                        FSSAI: {group.fssai}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {!groups.length && (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                No manufacturers configured.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  </>
}
