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
      sessionStorage.setItem('tenoo-intro-shown', '1')

      const internalHomeTimer = window.setTimeout(() => {
        sessionStorage.removeItem('tenoo-internal-home')
      }, 100)

      return () => window.clearTimeout(internalHomeTimer)
    }

    if (sessionStorage.getItem('tenoo-intro-shown') === '1') return

    setShow(true)

    const seenTimer = window.setTimeout(() => {
      sessionStorage.setItem('tenoo-intro-shown', '1')
    }, 0)

    // Give the merge + tagline a little more breathing room before removal.
    const timer = window.setTimeout(() => {
      setShow(false)
    }, 1450)

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
        {/* Two separate logo panels converge into one clean mark. */}
        <div className="relative h-[100px] w-[230px] overflow-visible">
          <div className="tenoo-logo-panel tenoo-logo-panel-left">
            <Image
              src="/tenoo-logo.png"
              alt=""
              fill
              priority
              className="object-contain"
            />
          </div>

          <div className="tenoo-logo-panel tenoo-logo-panel-right">
            <Image
              src="/tenoo-logo.png"
              alt="Tenoo"
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>

        <p className="mt-2 text-center text-[9px] font-semibold uppercase tracking-[0.34em] text-[#8fbd24] animate-[tenooTaglineReveal_400ms_cubic-bezier(0.22,1,0.36,1)_720ms_both]">
          Good Food. Made for Every Generation.
        </p>

        <div className="mt-5 h-px w-[42px] bg-[#8fbd24] animate-[tenooLineReveal_300ms_ease-out_920ms_both]" />
      </div>
    </div>
  )
}