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

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      },
    )

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Password reset link has been sent to your email.')
    }

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
          setMessage(
            'Account created successfully. Please check your email to confirm your account.',
          )
          setName('')
          setEmail('')
          setPassword('')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) {
          setMessage(error.message)
        } else {
          window.location.href = '/'
        }
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
    <main className="relative min-h-screen overflow-hidden bg-[#faf8f3] px-4 py-8 sm:px-6">
      {/* Soft organic background shapes */}
      <div className="pointer-events-none absolute -left-28 top-24 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-[#d7a44b]/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl flex-col">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => (window.location.href = '/')}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to store
          </button>

          <img
            src="/tenoo-logo.png"
            alt="Tenoo"
            className="h-auto w-28 object-contain sm:w-32"
          />
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <section className="w-full rounded-[2rem] border border-[#e8e1d5] bg-white p-6 shadow-[0_18px_60px_rgba(55,45,30,0.08)] sm:p-10">
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                <div className="h-3 w-3 rounded-full bg-primary" />
              </div>

              <h1 className="font-display text-3xl text-foreground sm:text-4xl">
                {isSignup ? 'Create your account' : 'Welcome back'}
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                {isSignup
                  ? 'Join Tenoo and keep your orders and account details in one place.'
                  : 'Sign in to continue to your Tenoo account.'}
              </p>
            </div>

            {/* Mode switch */}
            <div className="mt-8 grid grid-cols-2 rounded-2xl bg-muted/70 p-1">
              <button
                type="button"
                onClick={() => switchMode(false)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  !isSignup
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign in
              </button>

              <button
                type="button"
                onClick={() => switchMode(true)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  isSignup
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              {isSignup && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    autoComplete="name"
                    required
                    className="h-14 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-all placeholder:text-muted-foreground/55 focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="h-14 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-all placeholder:text-muted-foreground/55 focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">
                    Password
                  </label>

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
                    className="h-14 w-full rounded-2xl border border-border bg-white px-4 pr-12 text-sm outline-none transition-all placeholder:text-muted-foreground/55 focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {message && (
                <div
                  role="status"
                  className="rounded-2xl border border-border bg-muted/60 px-4 py-3 text-sm leading-5 text-foreground"
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-14 w-full rounded-2xl bg-foreground px-5 text-sm font-semibold tracking-wide text-background transition-all hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? 'Please wait...'
                  : isSignup
                    ? 'CREATE ACCOUNT'
                    : 'SIGN IN'}
              </button>
            </form>

            <div className="mt-7 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Secure account access
            </div>

            <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
              By continuing, you agree to Tenoo&apos;s terms and privacy policy.
            </p>
          </section>
        </div>

        <footer className="pb-2 text-center text-xs text-muted-foreground">
          Good Food. Made for Every Generation.
        </footer>
      </div>
    </main>
  )
}
