'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export function IntroAnimation() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const navigationEntry = performance.getEntriesByType(
      'navigation',
    )[0] as PerformanceNavigationTiming | undefined
    const isRefresh = navigationEntry?.type === 'reload'

    if (isRefresh) {
      sessionStorage.setItem('tenoo-intro-shown', '1')
      return
    }

    const internalHome =
      sessionStorage.getItem('tenoo-internal-home') === '1'

    if (internalHome) {
      // Visiting home through an in-site link uses up this session's intro.
      sessionStorage.setItem('tenoo-intro-shown', '1')

      // Keep the flag briefly so React Strict Mode's
      // second effect run also sees it.
      const internalHomeTimer = window.setTimeout(() => {
        sessionStorage.removeItem('tenoo-internal-home')
      }, 100)

      return () => window.clearTimeout(internalHomeTimer)
    }

    if (sessionStorage.getItem('tenoo-intro-shown') === '1') return

    // Mark the intro after the effect has settled so React Strict Mode's
    // development-only second effect run can still start its timer.
    setShow(true)
    const seenTimer = window.setTimeout(() => {
      sessionStorage.setItem('tenoo-intro-shown', '1')
    }, 0)

    const timer = window.setTimeout(() => {
      setShow(false)
    }, 1200)

    return () => {
      window.clearTimeout(seenTimer)
      window.clearTimeout(timer)
    }
  }, [])

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#fcfcf9] pointer-events-none"
      aria-hidden="true"
    >
      <div className="flex flex-col items-center">
        <div className="relative h-[100px] w-[230px] animate-[tenooLogoReveal_750ms_cubic-bezier(0.22,1,0.36,1)_100ms_both]">
          <Image
            src="/tenoo-logo.png"
            alt="Tenoo"
            fill
            priority
            className="object-contain"
          />
        </div>

        <p className="mt-2 text-center text-[9px] font-semibold uppercase tracking-[0.34em] text-[#8fbd24] animate-[tenooTaglineReveal_400ms_ease-out_500ms_both]">
          Good Food. Made for Every Generation.
        </p>

        <div className="mt-5 h-px w-[42px] bg-[#8fbd24] animate-[tenooLineReveal_300ms_ease-out_750ms_both]" />
      </div>
    </div>
  )
}