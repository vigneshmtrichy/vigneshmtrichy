'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

export function FamilyBanner() {
  const sectionRef = useRef<HTMLElement>(null)
  const [mergeProgress, setMergeProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const section = sectionRef.current
      if (!section) return

      const rect = section.getBoundingClientRect()
      const start = window.innerHeight * 0.92
      const end = window.innerHeight * 0.42
      const rawProgress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)))
      const progress = 1 - Math.pow(1 - rawProgress, 3)
      setMergeProgress(progress)
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)

    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  const desktopOffset = (1 - mergeProgress) * 150
  const desktopScale = 0.96 + mergeProgress * 0.04

  return (
    <section ref={sectionRef} aria-labelledby="family-heading" className="px-4 md:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-primary shadow-sm">

        {/* =====================================================
            DESKTOP
            ===================================================== */}
        <div className="relative hidden min-h-[430px] lg:grid lg:grid-cols-[42%_58%]">

          {/* Background glow */}
          <Image
            src="/lifestyle/family.png"
            alt=""
            fill
            aria-hidden="true"
            className="scale-105 object-cover opacity-10 blur-xl"
          />

          {/* Text */}
          <div
            className="relative z-10 flex items-center px-14 py-14 xl:px-16 motion-reduce:transform-none"
            style={{ transform: `translate3d(-${desktopOffset}px, 0, 0) scale(${desktopScale})` }}
          >
            <div className="absolute left-0 top-1/2 h-28 w-px -translate-y-1/2 bg-lime-400/50" />

            <div className="max-w-lg text-primary-foreground">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-lime-400">
                Made for Every Generation
              </p>

              <h2
                id="family-heading"
                className="font-serif text-3xl font-bold leading-[1.12] sm:text-4xl"
              >
                Good food brings
                <br />
                generations together.
              </h2>

              <div className="my-6 h-px w-14 bg-primary-foreground/30" />

              <p className="max-w-md text-sm leading-7 text-primary-foreground/75 sm:text-base sm:leading-8">
                Wholesome ingredients, time-honoured recipes and nutritious
                blends for every stage of life.
              </p>
            </div>
          </div>

          {/* Family image */}
          <div
            className="relative motion-reduce:transform-none"
            style={{ transform: `translate3d(${desktopOffset}px, 0, 0) scale(${desktopScale})` }}
          >
            <Image
              src="/lifestyle/family.png"
              alt="Three generations of a family sharing a warm meal together"
              fill
              className="object-cover"
            />

            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-primary/40 to-transparent" />
          </div>
        </div>


        {/* =====================================================
            MOBILE
            ===================================================== */}
        <div className="relative lg:hidden">

          {/* Family photo */}
          <div className="relative h-[500px] w-full">
            <Image
              src="/lifestyle/family.png"
              alt="Three generations of a family sharing a warm meal together"
              fill
              className="object-cover"
            />

            {/* Dark bottom gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/55 to-transparent" />
          </div>

          {/* Text over image */}
          <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-7">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-lime-400">
              Made for Every Generation
            </p>

            <h2
              id="family-heading-mobile"
              className="font-serif text-[25px] font-bold leading-[1.12] text-white"
            >
              Good food brings
              <br />
              generations together.
            </h2>

            <div className="my-4 h-px w-10 bg-white/30" />

            <p className="max-w-[300px] text-xs leading-5 text-white/75">
              Wholesome ingredients, time-honoured recipes and nutritious
              blends for every stage of life.
            </p>
          </div>

        </div>

      </div>
    </section>
  )
}