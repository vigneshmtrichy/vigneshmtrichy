'use client'

import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleForgotPassword = async () => {
    setMessage('')
    if (!email.trim()) {
      setMessage('Please enter your email address first.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setMessage(error ? error.message : 'Password reset link has been sent to your email.')
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      if (isSignup) {
        if (!name.trim()) {
          setMessage('Please enter your name.')
          setLoading(false)
          return
        }

        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        })

        if (error) {
          setMessage(error.message)
        } else {
          setMessage('Account created successfully. Please check your email to confirm your account.')
          setName('')
          setEmail('')
          setPassword('')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) setMessage(error.message)
        else window.location.href = '/'
      }
    } catch {
      setMessage('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (signup: boolean) => {
    setIsSignup(signup)
    setMessage('')
    setPassword('')
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#d8c9ad] px-4 py-6 sm:px-6">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#274c32_0%,#5d7b61_38%,#d8c9ad_78%,#b99668_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,.30),transparent_22%),radial-gradient(circle_at_82%_22%,rgba(255,255,255,.20),transparent_24%),radial-gradient(circle_at_55%_85%,rgba(255,255,255,.18),transparent_25%)]" />
      <div className="absolute -left-28 top-1/4 h-96 w-96 rounded-full bg-emerald-200/10 blur-3xl" />
      <div className="absolute -right-28 bottom-0 h-[30rem] w-[30rem] rounded-full bg-amber-100/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/35 bg-white/10 shadow-[0_35px_100px_rgba(22,38,25,.28)] backdrop-blur-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent" />

          <div className="relative grid lg:grid-cols-[1fr_470px]">
            <section className="hidden min-h-[720px] p-10 text-white lg:flex lg:flex-col">
              <button
                type="button"
                onClick={() => (window.location.href = '/')}
                className="flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm backdrop-blur-xl transition hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to store
              </button>

              <div className="flex flex-1 items-center">
                <div className="max-w-xl">
                  <img
                    src="/tenoo-logo.png"
                    alt="Tenoo"
                    className="mb-7 w-44 object-contain brightness-0 invert drop-shadow-md"
                  />

                  <p className="text-xs font-semibold uppercase tracking-[.30em] text-white/70">
                    Good Food. Made for Every Generation.
                  </p>

                  <h1 className="mt-5 font-display text-5xl leading-[1.04] xl:text-6xl">
                    Welcome to your
                    <span className="block text-white/80">Tenoo world.</span>
                  </h1>

                  <p className="mt-6 max-w-md text-base leading-8 text-white/75">
                    Sign in to manage your orders and continue your journey with Tenoo.
                  </p>

                  <div className="mt-10 flex gap-3">
                    <div className="rounded-2xl border border-white/25 bg-white/10 px-5 py-4 backdrop-blur-xl">
                      <p className="text-sm font-semibold">Secure</p>
                      <p className="mt-1 text-xs text-white/60">Account access</p>
                    </div>
                    <div className="rounded-2xl border border-white/25 bg-white/10 px-5 py-4 backdrop-blur-xl">
                      <p className="text-sm font-semibold">Simple</p>
                      <p className="mt-1 text-xs text-white/60">Order tracking</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-white/60">
                <ShieldCheck className="h-4 w-4" />
                Your account information is protected.
              </div>
            </section>

            <section className="relative border-white/30 bg-white/[.68] p-6 backdrop-blur-3xl sm:p-10 lg:min-h-[720px] lg:border-l lg:p-12">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 via-white/10 to-transparent" />
              <div className="relative flex h-full flex-col justify-center">
                <div className="mb-8 text-center">
                  <div className="mb-5 lg:hidden">
                    <button
                      type="button"
                      onClick={() => (window.location.href = '/')}
                      className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to store
                    </button>
                    <img src="/tenoo-logo.png" alt="Tenoo" className="mx-auto w-32 object-contain" />
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-[.24em] text-primary">
                    {isSignup ? 'Create account' : 'Welcome back'}
                  </p>
                  <h2 className="mt-3 font-display text-3xl sm:text-4xl">
                    {isSignup ? 'Join Tenoo.' : 'Sign in to Tenoo.'}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {isSignup
                      ? 'Create your account and keep your Tenoo orders in one place.'
                      : 'Enter your details to continue.'}
                  </p>
                </div>

                <div className="mb-7 flex justify-center gap-8 border-b border-black/10">
                  <button
                    type="button"
                    onClick={() => switchMode(false)}
                    className={`relative pb-3 text-sm font-semibold ${!isSignup ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    Sign in
                    {!isSignup && <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-primary" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode(true)}
                    className={`relative pb-3 text-sm font-semibold ${isSignup ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    Create account
                    {isSignup && <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-primary" />}
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {isSignup && (
                    <div>
                      <label className="mb-2 block text-sm font-medium">Full name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        autoComplete="name"
                        required
                        className="h-14 w-full rounded-2xl border border-white/70 bg-white/45 px-4 text-sm shadow-[inset_0_1px_1px_rgba(255,255,255,.9),0_5px_18px_rgba(50,50,30,.04)] outline-none backdrop-blur-xl transition focus:bg-white/70 focus:ring-4 focus:ring-primary/10"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium">Email address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className="h-14 w-full rounded-2xl border border-white/70 bg-white/45 px-4 text-sm shadow-[inset_0_1px_1px_rgba(255,255,255,.9),0_5px_18px_rgba(50,50,30,.04)] outline-none backdrop-blur-xl transition focus:bg-white/70 focus:ring-4 focus:ring-primary/10"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium">Password</label>
                      {!isSignup && (
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          disabled={loading}
                          className="text-xs font-semibold text-primary hover:underline disabled:opacity-60"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete={isSignup ? 'new-password' : 'current-password'}
                        minLength={6}
                        required
                        className="h-14 w-full rounded-2xl border border-white/70 bg-white/45 px-4 pr-12 text-sm shadow-[inset_0_1px_1px_rgba(255,255,255,.9),0_5px_18px_rgba(50,50,30,.04)] outline-none backdrop-blur-xl transition focus:bg-white/70 focus:ring-4 focus:ring-primary/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {message && (
                    <div role="status" className="rounded-2xl border border-white/70 bg-white/50 px-4 py-3 text-sm leading-5 backdrop-blur-xl">
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="h-14 w-full rounded-2xl bg-[#2f5b39] px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(47,91,57,.25)] transition hover:bg-[#284f31] hover:shadow-[0_16px_35px_rgba(47,91,57,.32)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Please wait...' : isSignup ? 'CREATE ACCOUNT' : 'SIGN IN'}
                  </button>
                </form>

                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Secure account access
                </div>

                <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
                  By continuing, you agree to Tenoo's terms and privacy policy.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
