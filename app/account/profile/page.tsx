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

  const [address, setAddress] = useState('')
  const [pincode, setPincode] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')

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
        .select('name, phone, address, pincode, city, state')
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
      setAddress(data?.address || '')
      setPincode(data?.pincode || '')
      setCity(data?.city || '')
      setState(data?.state || '')

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

    if (!address.trim()) {
      setMessage('Please enter your delivery address.')
      return
    }

    if (!/^\d{6}$/.test(pincode)) {
      setMessage('Please enter a valid 6-digit pincode.')
      return
    }

    if (!city.trim()) {
      setMessage('Please enter your city.')
      return
    }

    if (!state.trim()) {
      setMessage('Please enter your state.')
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
          address: address.trim(),
          pincode: pincode.trim(),
          city: city.trim(),
          state: state.trim(),
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

    setMessage('Account details updated successfully.')
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
              My Account
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Manage your personal information and delivery address.
            </p>
          </div>

          <div className="rounded-2xl border bg-background p-5 shadow-sm sm:p-7">
            <div className="space-y-8">

              {/* PERSONAL INFORMATION */}
              <div>
                <h2 className="text-lg font-semibold">
                  Personal Information
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Update your basic account details.
                </p>
              </div>

              <div className="space-y-5">

                {/* Full Name */}
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

                {/* Email */}
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

                {/* Mobile Number */}
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

              </div>

              {/* DELIVERY ADDRESS */}
              <div className="border-t pt-8">
                <h2 className="text-lg font-semibold">
                  Delivery Address
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your default delivery address.
                </p>
              </div>

              <div className="space-y-5">

                {/* Address */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Address
                  </label>

                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                {/* Pincode + City */}
                <div className="grid gap-5 sm:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Pincode
                    </label>

                    <input
                      value={pincode}
                      onChange={(e) =>
                        setPincode(
                          e.target.value.replace(/\D/g, '').slice(0, 6),
                        )
                      }
                      inputMode="numeric"
                      className="h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      City
                    </label>

                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>

                </div>

                {/* State */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    State
                  </label>

                  <input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

              </div>

              {/* Message */}
              {message && (
                <p className="rounded-xl bg-muted px-4 py-3 text-sm">
                  {message}
                </p>
              )}

              {/* Save */}
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