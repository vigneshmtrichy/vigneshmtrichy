'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export function IntroAnimation() {
  // Render the cover on the first server paint so the homepage never flashes underneath it.
  const [show, setShow] = useState(true)

  useEffect(() => {
    const navigationEntry = performance.getEntriesByType(
      'navigation',
    )[0] as PerformanceNavigationTiming | undefined
    const isRefresh = navigationEntry?.type === 'reload'

    if (isRefresh) {
      sessionStorage.setItem('tenoo-intro-shown', '1')
      setShow(false)
      return
    }

    const internalHome =
      sessionStorage.getItem('tenoo-internal-home') === '1'

    if (internalHome) {
      sessionStorage.setItem('tenoo-intro-shown', '1')
      sessionStorage.removeItem('tenoo-internal-home')
      setShow(false)
      return
    }

    if (sessionStorage.getItem('tenoo-intro-shown') === '1') {
      setShow(false)
      return
    }

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
      <div className="flex items-center justify-center">
        <div className="tenoo-intro-mark">
          <Image
            src="/tenoo-logo.png"
            alt="Tenoo"
            width={230}
            height={100}
            className="tenoo-intro-logo"
          />
        </div>
      </div>
    </div>
  )
}
