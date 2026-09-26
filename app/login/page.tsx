'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
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
    setMessage(
      'Password reset link has been sent to your email.',
    )
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

  return (
    <main className="min-h-[70vh] px-6 py-16">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-border bg-background p-8 shadow-sm">
          <div className="mb-8 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.25em] text-primary">
              TENOO
            </p>

            <h1 className="font-display text-3xl text-foreground">
              {isSignup ? 'Create Your Account' : 'Welcome Back'}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {isSignup
                ? 'Create an account to review TENOO products.'
                : 'Sign in to your TENOO account.'}
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
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
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
                className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Password
              </label>

             <div className="relative">
  <input
    type={showPassword ? 'text' : 'password'}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="••••••••"
    minLength={6}
    className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 outline-none focus:border-primary"
    required
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
{!isSignup && (
  <div className="text-right">
    <button
      type="button"
      onClick={handleForgotPassword}
      className="text-sm font-medium text-primary hover:underline"
    >
      Forgot Password?
    </button>
  </div>
)}
            {message && (
              <div className="rounded-xl bg-muted px-4 py-3 text-sm text-foreground">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-foreground px-5 py-3 font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Please wait...'
                : isSignup
                  ? 'CREATE ACCOUNT'
                  : 'LOGIN'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}

            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup)
                setMessage('')
              }}
              className="ml-2 font-medium text-primary hover:underline"
            >
              {isSignup ? 'Login' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}