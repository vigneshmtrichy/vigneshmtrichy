'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  Leaf,
  Heart,
} from 'lucide-react'
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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

if (!emailPattern.test(email.trim())) {
  setMessage('Please enter a valid email address.')
  return
}



  setLoading(true)

  try {
    const response = await fetch('/api/auth/check-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      setMessage('Something went wrong. Please try again.')
      return
    }

    if (!result.exists) {
      setMessage("You don't have an account with this email. Please create an account.")
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    )

    setMessage(
      error
        ? error.message
        : 'Password reset link has been sent to your email.'
    )
  } catch {
    setMessage('Something went wrong. Please try again.')
  } finally {
    setLoading(false)
  }
}
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setMessage('')

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailPattern.test(email.trim())) {
    setMessage('Please enter a valid email address.')
    return
  }

    if (!password.trim()) {
    setMessage('Please enter your password.')
    return
  }

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
            'Account created successfully. Please check your email to confirm your account.'
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
  setMessage('Incorrect email or password. Please try again.')
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
    <main className="relative min-h-screen overflow-hidden bg-[#c9b995]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,#dbe5c9_0%,transparent_28%),radial-gradient(circle_at_82%_20%,#f2e5c9_0%,transparent_30%),linear-gradient(135deg,#6b8467_0%,#b8c2a5_38%,#eadcc0_72%,#b99b6e_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_15%,rgba(35,45,27,.18)_100%)]" />\n      <div className="absolute inset-0 bg-white/10 backdrop-blur-[3px]" />

      <div className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-[#355d3c]/20 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-[#f4e3bd]/40 blur-3xl" />

      <div className="relative min-h-screen px-4 py-5 sm:px-8">
        <button
  type="button"
  onClick={() => (window.location.href = '/')}
  className="absolute left-4 top-4 z-30 inline-flex items-center justify-center rounded-full border border-white/35 bg-black/10 p-2 text-white shadow-lg backdrop-blur-xl transition hover:bg-black/20 sm:left-8 sm:top-8 sm:gap-2 sm:px-4 sm:py-2"
>
  <ArrowLeft className="h-4 w-4" />
  <span className="hidden sm:inline">Back to store</span>
</button>

        <div className="pointer-events-none absolute bottom-0 left-0 h-1/2 w-1/3 rounded-full bg-[#244b2e]/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-1/3 h-1/2 w-1/3 rounded-full bg-white/25 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-white/15 backdrop-blur-[18px] backdrop-saturate-150" />
       
        <div className="relative z-20 flex min-h-[calc(100vh-2.5rem)] items-center justify-center px-2">
          <section className="relative w-full max-w-[500px] overflow-hidden rounded-[2rem] border border-white/55 bg-white/30 shadow-[0_30px_100px_rgba(25,40,27,.28),inset_0_1px_0_rgba(255,255,255,.85)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 via-white/15 to-white/5" />
            <div className="pointer-events-none absolute left-1/4 top-0 h-px w-1/2 bg-white/90 blur-sm" />

            <div className="relative px-5 py-5 sm:px-8 sm:py-7">
              <div className="text-center">
                <img
                  src="/tenoo-logo.png"
                  alt="Tenoo"
                  className="mx-auto w-32 object-contain drop-shadow-sm sm:w-40"
                />

                <h1 className="mt-4 font-display text-2xl text-[#263832] sm:mt-5 sm:text-3xl">
                  {isSignup ? 'Create Your Account' : 'Welcome Back'}
                </h1>

                <p className="mt-2 text-sm text-[#52615a]">
                  {isSignup
                    ? 'Create an account to enjoy your Tenoo experience.'
                    : 'Sign in to your TENOO account.'}
                </p>
              </div>

              <div className="mx-auto mt-5 flex w-fit items-center gap-7 border-b border-black/10 sm:mt-6">
                <button
                  type="button"
                  onClick={() => switchMode(false)}
                  className={`relative pb-3 text-sm font-semibold ${
                    !isSignup ? 'text-[#263832]' : 'text-[#68736e]'
                  }`}
                >
                  Sign in
                  {!isSignup && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-[#2f6a3d]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => switchMode(true)}
                  className={`relative pb-3 text-sm font-semibold ${
                    isSignup ? 'text-[#263832]' : 'text-[#68736e]'
                  }`}
                >
                  Create account
                  {isSignup && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-[#2f6a3d]" />
                  )}
                </button>
              </div>

             <form
  onSubmit={handleSubmit}
  noValidate
  className="mx-auto mt-7 max-w-[490px] space-y-5"
>
                {isSignup && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#2d3d36]">
                      Full name
                    </label>

                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      autoComplete="name"
                      required
                      className="h-12 w-full rounded-full border border-white/75 bg-white/40 px-5 text-sm text-[#24352d] shadow-[inset_0_1px_1px_rgba(255,255,255,.9),0_8px_24px_rgba(50,60,45,.06)] outline-none backdrop-blur-xl placeholder:text-[#7a847e] transition focus:bg-white/65 focus:ring-4 focus:ring-[#3c7549]/10 sm:h-14"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2d3d36]">
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="h-12 w-full rounded-full border border-white/75 bg-white/40 px-5 text-sm text-[#24352d] shadow-[inset_0_1px_1px_rgba(255,255,255,.9),0_8px_24px_rgba(50,60,45,.06)] outline-none backdrop-blur-xl placeholder:text-[#7a847e] transition focus:bg-white/65 focus:ring-4 focus:ring-[#3c7549]/10 sm:h-14"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-[#2d3d36]">
                      Password
                    </label>

                    {!isSignup && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={loading}
                        className="text-xs font-semibold text-[#2f6a3d] hover:underline disabled:opacity-60"
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
                      autoComplete={
                        isSignup ? 'new-password' : 'current-password'
                      }
                      minLength={6}
                      required
                      className="h-12 w-full rounded-full border border-white/75 bg-white/40 px-5 pr-14 text-sm text-[#24352d] shadow-[inset_0_1px_1px_rgba(255,255,255,.9),0_8px_24px_rgba(50,60,45,.06)] outline-none backdrop-blur-xl placeholder:text-[#7a847e] transition focus:bg-white/65 focus:ring-4 focus:ring-[#3c7549]/10 sm:h-14"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-[#68756e] hover:text-[#263832]"
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
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
    className="px-1 text-xs font-medium leading-5 text-[#52615a]"
  >
    {message}
  </div>
)}

                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-full bg-[#2d6339] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(45,99,57,.28)] transition hover:bg-[#255630] hover:shadow-[0_16px_34px_rgba(45,99,57,.34)] disabled:cursor-not-allowed disabled:opacity-60 sm:h-14"
                >
                  {loading
                    ? 'Please wait...'
                    : isSignup
                      ? 'CREATE ACCOUNT'
                      : 'SIGN IN'}
                </button>
              </form>

              <div className="mx-auto mt-6 grid max-w-[420px] grid-cols-3 items-start gap-2 border-t border-black/10 pt-4 text-[9px] text-[#66736d] sm:mt-7 sm:flex sm:items-center sm:justify-center sm:gap-5 sm:pt-5 sm:text-[11px]">
                <span className="inline-flex items-center justify-center gap-1.5 text-center">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#397047] sm:h-4 sm:w-4" />
                  Secure & Safe
                </span>

                <span className="hidden h-4 w-px bg-black/15 sm:block" />

              <span className="inline-flex items-center justify-center gap-1.5 text-center">
  <Leaf className="h-3.5 w-3.5 text-[#397047] sm:h-4 sm:w-4" />
  Quality Ingredients
</span>

                <span className="hidden h-4 w-px bg-black/15 sm:block" />

                <span className="inline-flex items-center justify-center gap-1.5 text-center">
                  <Heart className="h-3.5 w-3.5 text-[#397047] sm:h-4 sm:w-4" />
                  Made with Care
                </span>
              </div>

              <p className="mt-5 text-center text-[11px] leading-5 text-[#707a75]">
                By continuing, you agree to Tenoo&apos;s terms and privacy
                policy.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}