'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAIL = 'info@tenoo.in'
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000

export function AdminInactivityTimeout() {
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let isAdmin = false

    const logoutForInactivity = async () => {
      await supabase.auth.signOut()
      localStorage.removeItem('tenoo-cart')
      window.location.href = '/login'
    }

    const resetInactivityTimer = () => {
      if (!isAdmin) return
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        void logoutForInactivity()
      }, INACTIVITY_LIMIT_MS)
    }

    const startForCurrentUser = (user: any) => {
      isAdmin = user?.email === ADMIN_EMAIL
      if (isAdmin) {
        resetInactivityTimer()
      } else if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
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

    const activityEvents = ['click', 'keydown', 'mousemove', 'mousedown', 'scroll', 'touchstart'] as const
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer, { passive: true })
    })

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer)
      })
    }
  }, [])

  return null
}
