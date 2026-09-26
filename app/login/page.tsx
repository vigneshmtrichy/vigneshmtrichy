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
            data: {
              full_name: name.trim(),
            },
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

  const switchMode = () => {
    setIsSignup((current) => !current)
    setMessage('')
    setPassword('')
  }

  return (
    <main className="min-h-screen bg-muted/20 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-border bg-background shadow-xl lg:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden overflow-hidden bg-[#f7f1e7] lg:flex">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-[#d9a441]/10 blur-3xl" />

          <div className="relative flex w-full flex-col justify-between p-12 xl:p-16">
            <div>
              <button
                type="button"
                onClick={() => (window.location.href = '/')}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to store
              </button>
            </div>

            <div className="mx-auto w-full max-w-md py-10 text-center">
              <img
                src="/tenoo-logo.png"
                alt="Tenoo"
                className="mx-auto h-auto w-48 object-contain"
              />

              <p className="mt-5 text-sm font-medium uppercase tracking-[0.24em] text-primary">
                Good Food. Made for Every Generation.
              </p>

              <div className="mt-10 overflow-hidden rounded-3xl border border-[#eadfce] bg-white/70 p-4 shadow-sm">
                <img
                  src="/tenoo-mascot-mature.png"
                  alt="Tenoo mascot"
                  className="mx-auto max-h-72 w-auto object-contain"
                />
              </div>

              <h2 className="mt-8 font-display text-3xl text-foreground">
                A better way to enjoy Tenoo.
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                Sign in to manage your account, view your orders and continue
                your Tenoo journey.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Your account information is protected.
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <div className="mb-6 lg:hidden">
                <button
                  type="button"
                  onClick={() => (window.location.href = '/')}
                  className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to store
                </button>
              </div>

              <img
                src="/tenoo-logo.png"
                alt="Tenoo"
                className="mx-auto mb-7 h-auto w-36 object-contain lg:hidden"
              />

              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                {isSignup ? 'Join Tenoo' : 'Welcome back'}
              </p>

              <h1 className="mt-3 font-display text-3xl text-foreground sm:text-4xl">
                {isSignup ? 'Create your account' : 'Sign in to Tenoo'}
              </h1>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {isSignup
                  ? 'Create an account to manage your orders and enjoy a smoother shopping experience.'
                  : 'Access your account, orders and saved details.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignup && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="h-13 w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
                    required
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-13 w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
                  required
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">
                    Password
                  </label>

                  {!isSignup && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={loading}
                      className="text-xs font-semibold text-primary transition-colors hover:underline disabled:opacity-60"
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
                    className="h-13 w-full rounded-2xl border border-border bg-background px-4 py-3.5 pr-12 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
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
                className="h-13 w-full rounded-2xl bg-primary px-5 font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? 'Please wait...'
                  : isSignup
                    ? 'CREATE ACCOUNT'
                    : 'SIGN IN'}
              </button>
            </form>

            <div className="mt-7 text-center text-sm text-muted-foreground">
              {isSignup
                ? 'Already have an account?'
                : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={switchMode}
                className="font-semibold text-primary hover:underline"
              >
                {isSignup ? 'Sign in' : 'Create account'}
              </button>
            </div>

            <p className="mt-8 text-center text-xs leading-5 text-muted-foreground">
              By continuing, you agree to Tenoo&apos;s terms and privacy
              policy.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
