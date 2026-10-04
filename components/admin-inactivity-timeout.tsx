'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAIL = 'info@tenoo.in'
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000
const WARNING_BEFORE_LOGOUT_MS = 2 * 60 * 1000

export function AdminInactivityTimeout() {
  const [showWarning, setShowWarning] = useState(false)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isAdminRef = useRef(false)

  useEffect(() => {
    const clearTimers = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
        warningTimeoutRef.current = null
      }
    }

    const logoutForInactivity = async () => {
      clearTimers()
      await supabase.auth.signOut()
      localStorage.removeItem('tenoo-cart')
      window.location.href = '/login'
    }

    const resetInactivityTimer = () => {
      if (!isAdminRef.current) return

      clearTimers()
      setShowWarning(false)

      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true)
      }, INACTIVITY_LIMIT_MS - WARNING_BEFORE_LOGOUT_MS)

      timeoutRef.current = setTimeout(() => {
        void logoutForInactivity()
      }, INACTIVITY_LIMIT_MS)
    }

    const startForCurrentUser = (user: any) => {
      const isAdmin = user?.email === ADMIN_EMAIL
      isAdminRef.current = isAdmin

      if (isAdmin) {
        resetInactivityTimer()
      } else {
        clearTimers()
        setShowWarning(false)
      }
    }

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      startForCurrentUser(user)
    }

    void loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      startForCurrentUser(session?.user ?? null)
    })

    const activityEvents = [
      'click',
      'keydown',
      'mousemove',
      'mousedown',
      'scroll',
      'touchstart',
      'pointermove',
    ] as const

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer, { passive: true })
    })

    return () => {
      clearTimers()
      subscription.unsubscribe()

      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer)
      })
    }
  }, [])

  if (!showWarning) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"
      onMouseMove={() => {
        window.dispatchEvent(new Event('mousemove'))
      }}
      onPointerMove={() => {
        window.dispatchEvent(new Event('pointermove'))
      }}
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-900">
          ⚠️ You’re about to be logged out
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          You have been inactive for a while. Move your mouse or click anywhere
          to stay signed in.
        </p>

        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new Event('click'))
          }}
          className="mt-5 w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white"
        >
          Stay Signed In
        </button>
      </div>
    </div>
  )
}