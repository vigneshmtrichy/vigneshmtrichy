'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setEmail(user.email || '')

      const { data, error } = await supabase
        .from('customer_profiles')
        .select('name, phone')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error(error)
      }

      setName(
        data?.name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          '',
      )

      setPhone(data?.phone || '')
      setLoading(false)
    }

    loadProfile()
  }, [router])

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage('Please enter your name.')
      return
    }

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      setMessage('Please enter a valid 10-digit mobile number.')
      return
    }

    setSaving(true)
    setMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('customer_profiles')
      .upsert(
        {
          user_id: user.id,
          name: name.trim(),
          phone: phone.trim(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        },
      )

    if (error) {
      console.error(error)
      setMessage('Unable to save changes.')
      setSaving(false)
      return
    }

    await supabase.auth.updateUser({
      data: {
        full_name: name.trim(),
      },
    })

    setMessage('Profile updated successfully.')
    setSaving(false)
  }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen px-4 py-16">
          <div className="mx-auto max-w-2xl">
            <div className="h-10 w-48 animate-pulse rounded-xl bg-muted" />
          </div>
        </main>
        <SiteFooter />
      </>
    )
  }

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-background px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">
              My Profile
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage your personal information.
            </p>
          </div>

          <div className="rounded-2xl border bg-background p-5 shadow-sm sm:p-7">
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Full Name
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Email
                </label>

                <input
                  value={email}
                  disabled
                  className="h-12 w-full rounded-xl border bg-muted/50 px-4 text-sm text-muted-foreground"
                />

                <p className="mt-1.5 text-xs text-muted-foreground">
                  Email cannot be changed here.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Mobile Number
                </label>

                <input
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value.replace(/\D/g, '').slice(0, 10),
                    )
                  }
                  inputMode="numeric"
                  className="h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              {message && (
                <p className="rounded-xl bg-muted px-4 py-3 text-sm">
                  {message}
                </p>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}