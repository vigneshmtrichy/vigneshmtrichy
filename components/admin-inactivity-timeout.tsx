'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAIL = 'info@tenoo.in'
const INACTIVITY_LIMIT_MS = 20 * 1000
const WARNING_BEFORE_LOGOUT_MS = 10 * 1000
const ACTIVITY_CHECK_INTERVAL_MS = 1000

export function AdminInactivityTimeout() {
  const [showWarning, setShowWarning] = useState(false)

  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const isAdminRef = useRef(false)
  const logoutInProgressRef = useRef(false)

  useEffect(() => {
    const clearCheckInterval = () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }
    }

    const logoutForInactivity = async () => {
      if (logoutInProgressRef.current) return

      logoutInProgressRef.current = true
      clearCheckInterval()
      setShowWarning(false)

      await supabase.auth.signOut()
      localStorage.removeItem('tenoo-cart')
      window.location.href = '/login'
    }

    const checkInactivity = () => {
      if (!isAdminRef.current || logoutInProgressRef.current) return

      const inactiveFor = Date.now() - lastActivityRef.current

      if (inactiveFor >= INACTIVITY_LIMIT_MS) {
        void logoutForInactivity()
        return
      }

      setShowWarning(
        inactiveFor >= INACTIVITY_LIMIT_MS - WARNING_BEFORE_LOGOUT_MS,
      )
    }

    const resetInactivityTimer = () => {
      if (!isAdminRef.current || logoutInProgressRef.current) return

      lastActivityRef.current = Date.now()
      setShowWarning(false)
    }

    const startForCurrentUser = (user: any) => {
      const isAdmin = user?.email === ADMIN_EMAIL
      isAdminRef.current = isAdmin
      logoutInProgressRef.current = false

      clearCheckInterval()
      setShowWarning(false)

      if (isAdmin) {
        lastActivityRef.current = Date.now()
        checkIntervalRef.current = setInterval(
          checkInactivity,
          ACTIVITY_CHECK_INTERVAL_MS,
        )
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

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearCheckInterval()
      subscription.unsubscribe()

      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer)
      })

      document.removeEventListener('visibilitychange', handleVisibilityChange)
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
