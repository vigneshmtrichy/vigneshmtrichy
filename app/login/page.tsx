'use client'

import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, Leaf, ShieldCheck } from 'lucide-react'
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
      { redirectTo: `${window.location.origin}/reset-password` },
    )

    setMessage(
      error
        ? error.message
        : 'Password reset link has been sent to your email.',
    )

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

  return (
    <main className="min-h-screen bg-[#f4f1e9] px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-5xl items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        <div className="grid w-full overflow-hidden rounded-[2.5rem] bg-white shadow-[0_25px_80px_rgba(38,48,31,0.14)] lg:grid-cols-[0.9fr_1.1fr]">

          {/* Brand side */}
          <div className="relative hidden min-h-[650px] overflow-hidden bg-[#304b35] p-10 text-white lg:flex lg:flex-col">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5" />
            <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-black/10" />

            <div className="relative">
              <img
                src="/tenoo-footer-logo.png"
                alt="Tenoo"
                className="h-auto w-32 object-contain brightness-0 invert"
              />
            </div>

            <div className="relative flex flex-1 flex-col justify-center">
              <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <Leaf className="h-6 w-6" />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
                Welcome to Tenoo
              </p>

              <h1 className="mt-4 max-w-md font-display text-4xl leading-tight xl:text-5xl">
                Rooted in Indian food.
              </h1>

              <p className="mt-5 max-w-sm text-sm leading-7 text-white/70">
                Discover thoughtfully crafted food mixes inspired by
                traditional ingredients and everyday nutrition.
              </p>

              <div className="mt-10 grid max-w-sm grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-semibold">TENOO</p>
                  <p className="mt-1 text-xs text-white/60">Made with purpose</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-semibold">TENU</p>
                  <p className="mt-1 text-xs text-white/60">Our little companion</p>
                </div>
              </div>
            </div>

            <div className="relative flex items-center gap-2 text-xs text-white/60">
              <ShieldCheck className="h-4 w-4" />
              Secure account access
            </div>
          </div>

          {/* Form side */}
          <div className="relative flex min-h-[650px] flex-col justify-center p-6 sm:p-10 lg:p-14">
            <button
              type="button"
              onClick={() => (window.location.href = '/')}
              className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground sm:left-10 sm:top-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Store
            </button>

            <div className="mx-auto w-full max-w-md pt-10">
              <div className="mb-9">
                <div className="mb-5 lg:hidden">
                  <img
                    src="/tenoo-logo.png"
                    alt="Tenoo"
                    className="h-auto w-28 object-contain"
                  />
                </div>

                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  {isSignup ? 'Create account' : 'Customer login'}
                </p>

                <h2 className="mt-3 font-display text-3xl text-foreground sm:text-4xl">
                  {isSignup ? 'Let’s get you started.' : 'Good to see you.'}
                </h2>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {isSignup
                    ? 'Create your Tenoo account in a few simple steps.'
                    : 'Sign in to view your account and orders.'}
                </p>
              </div>

              <div className="mb-7 flex items-center gap-5 border-b border-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(false)
                    setMessage('')
                    setPassword('')
                  }}
                  className={`relative pb-3 text-sm font-semibold transition-colors ${
                    !isSignup ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Sign in
                  {!isSignup && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-primary" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(true)
                    setMessage('')
                    setPassword('')
                  }}
                  className={`relative pb-3 text-sm font-semibold transition-colors ${
                    isSignup ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Create account
                  {isSignup && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-primary" />
                  )}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {isSignup && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      autoComplete="name"
                      required
                      className="h-13 w-full rounded-xl border-0 bg-[#f6f5f1] px-4 text-sm outline-none ring-1 ring-transparent transition-all placeholder:text-muted-foreground/60 focus:bg-white focus:ring-primary/40"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="h-13 w-full rounded-xl border-0 bg-[#f6f5f1] px-4 text-sm outline-none ring-1 ring-transparent transition-all placeholder:text-muted-foreground/60 focus:bg-white focus:ring-primary/40"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
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
                      className="h-13 w-full rounded-xl border-0 bg-[#f6f5f1] px-4 pr-12 text-sm outline-none ring-1 ring-transparent transition-all placeholder:text-muted-foreground/60 focus:bg-white focus:ring-primary/40"
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
                    className="rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm leading-5 text-foreground"
                  >
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="h-13 w-full rounded-xl bg-[#304b35] px-5 text-sm font-semibold text-white transition-all hover:bg-[#263d2b] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? 'Please wait...'
                    : isSignup
                      ? 'CREATE ACCOUNT'
                      : 'SIGN IN'}
                </button>
              </form>

              <p className="mt-8 text-center text-xs leading-5 text-muted-foreground">
                By continuing, you agree to Tenoo&apos;s terms and privacy policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
