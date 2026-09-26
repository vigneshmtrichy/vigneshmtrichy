'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setSuccess(false)

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setSuccess(true)
      setMessage('Password updated successfully.')
      setPassword('')
      setConfirmPassword('')
    }

    setLoading(false)
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
              Reset Your Password
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                New Password
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

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Confirm Password
              </label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 outline-none focus:border-primary"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showConfirmPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {message && (
              <div
                className={`rounded-xl px-4 py-3 text-sm ${
                  success
                    ? 'bg-green-50 text-green-700'
                    : 'bg-muted text-foreground'
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full rounded-xl bg-foreground px-5 py-3 font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
            </button>
          </form>

          {success && (
            <div className="mt-6 text-center">
              <a
                href="/login"
                className="text-sm font-medium text-primary hover:underline"
              >
                Back to Login
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}