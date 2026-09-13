'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export function IntroAnimation() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const internalHome =
      sessionStorage.getItem('tenoo-internal-home') === '1'

    if (internalHome) {
      // Keep the flag briefly so React Strict Mode's
      // second effect run also sees it.
      window.setTimeout(() => {
        sessionStorage.removeItem('tenoo-internal-home')
      }, 100)

      return
    }

    // Show animation on initial page load / browser refresh
    setShow(true)

    const timer = window.setTimeout(() => {
      setShow(false)
    }, 1400)

    return () => window.clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#fcfcf9] pointer-events-none"
      aria-hidden="true"
    >
      <div className="flex flex-col items-center">
        <div className="relative h-[100px] w-[230px] animate-[tenooLogoReveal_650ms_cubic-bezier(0.22,1,0.36,1)_100ms_both]">
          <Image
            src="/tenoo-logo.png"
            alt="Tenoo"
            fill
            priority
            className="object-contain"
          />
        </div>

        <p className="mt-2 text-center text-[9px] font-semibold uppercase tracking-[0.34em] text-[#8fbd24] animate-[tenooTaglineReveal_450ms_ease-out_500ms_both]">
          Good Food. Made for Every Generation.
        </p>

        <div className="mt-5 h-px w-[42px] bg-[#8fbd24] animate-[tenooLineReveal_400ms_ease-out_750ms_both]" />
      </div>
    </div>
  )
}