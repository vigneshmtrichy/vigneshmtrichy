'use client'
import { useState } from 'react'
import {
  CheckCircle2,
  Factory,
  Search,
  ShieldCheck,
} from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

const MANUFACTURERS = {
  TD: {
    manufacturer: 'Tiny Dot Foods Private Limited',
    address: [
      '51, Kavarai Street',
      'Athipet',
      'Chennai – 600058',
    ],
    fssai: '12425999000009',
  },

  VT: {
    manufacturer: 'Veetoon Health Foods',
    address: [
      'Tiruppur Dt – 638105',
      'Tamil Nadu, India',
    ],
    fssai: '12423027001124',
  },
} as const

type ManufacturerCode = keyof typeof MANUFACTURERS

export default function ManufacturerVerificationPage() {
  const [code, setCode] = useState('')
  const [manufacturer, setManufacturer] = useState<
    (typeof MANUFACTURERS)[ManufacturerCode] | null
  >(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = () => {
    const searchCode = code.trim().toUpperCase()

    setSearched(true)

    if (searchCode.length < 2) {
      setManufacturer(null)
      return
    }

    const match = Object.entries(MANUFACTURERS).find(([key]) =>
      key.startsWith(searchCode),
    )

    setManufacturer(match ? match[1] : null)
  }

  const handleChange = (value: string) => {
    const lettersOnly = value
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 3)

    setCode(lettersOnly)
    setSearched(false)
    setManufacturer(null)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* HEADER */}
      <SiteHeader />

      <main className="flex-1 px-5 py-7 md:px-8 md:py-10">
        <div className="mx-auto max-w-2xl">

         

          {/* MAIN CARD */}
          <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">

            {/* HEADER */}
            <div className="bg-primary px-6 py-5 text-primary-foreground md:px-8">
              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <div>
               

                  <h1 className="mt-0.5 font-serif text-xl font-bold md:text-2xl">
                    Manufacturer Verification
                  </h1>
                </div>

              </div>
            </div>

            {/* INSTRUCTIONS + SEARCH */}
            <div className="px-6 py-6 text-center md:px-8 md:py-7">

              <h2 className="font-serif text-lg font-bold text-primary md:text-xl">
                Verify Your Manufacturer
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-5 text-muted-foreground">
                Enter the first two or three characters of the batch code
                printed on your pack to find the manufacturing unit and
                FSSAI licence number. e.g., TD
              </p>

              {/* SEARCH */}
              <div className="mx-auto mt-5 flex max-w-md gap-2">

                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    type="text"
                    value={code}
                    onChange={(e) => handleChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch()
                      }
                    }}
                    placeholder="Enter batch code"
                    maxLength={3}
                    autoComplete="off"
                    className="h-11 w-full rounded-full border border-border bg-background pl-11 pr-4 text-sm uppercase text-primary outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
                    aria-label="Batch code"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSearch}
                  className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  SEARCH
                </button>

              </div>

              {/* NOT FOUND */}
              {searched && !manufacturer && (
                <p className="mt-4 text-xs text-red-600">
                  Manufacturer details not found. Please check the batch
                  code.
                </p>
              )}

            </div>

            {/* RESULT */}
            {manufacturer && (
              <div className="border-t border-border">

                {/* RESULT HEADER */}
                <div className="bg-[#f7f8f6] px-6 py-4 md:px-8">
                  <div className="flex items-center gap-2 text-sm font-semibold text-accent">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Manufacturer Details</span>
                  </div>
                </div>

                {/* DETAILS */}
                <div className="px-6 py-6 md:px-8">

                  <div className="flex items-start gap-4">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#edf3dc] text-accent">
                      <Factory className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">

                      {/* COMPANY */}
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Company Name
                        </p>

                        <h3 className="mt-1.5 text-base font-bold text-primary">
                          {manufacturer.manufacturer}
                        </h3>
                      </div>

                      {/* ADDRESS */}
                      <div className="mt-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Address
                        </p>

                        <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
                          {manufacturer.address.map((line) => (
                            <span
                              key={line}
                              className="block"
                            >
                              {line}
                            </span>
                          ))}
                        </p>
                      </div>

                      {/* FSSAI */}
                      <div className="mt-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          FSSAI Licence No.
                        </p>

                        <p className="mt-1.5 text-sm font-semibold text-primary">
                          {manufacturer.fssai}
                        </p>
                      </div>

                    </div>

                  </div>

                </div>

                {/* VERIFIED */}
                <div className="border-t border-border bg-[#f7f8f6] px-6 py-4 md:px-8">
                  <div className="flex items-center gap-2 text-xs font-semibold text-accent">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      Manufacturer information verified by Tenoo
                    </span>
                  </div>
                </div>

              </div>
            )}

          </section>

          {/* FOOTER NOTE */}
          <p className="mt-4 text-center text-[11px] leading-4 text-muted-foreground">
            Enter the batch code printed on your Tenoo product pack
            to verify the manufacturing details.
          </p>

        </div>
      </main>

      {/* FOOTER */}
      <SiteFooter />

    </div>
  )
}