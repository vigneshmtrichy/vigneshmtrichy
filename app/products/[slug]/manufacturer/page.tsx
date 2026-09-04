import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CheckCircle2, Factory, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Manufacturer Verification | TENOO',
  robots: {
    index: false,
    follow: false,
  },
}

type ManufacturerPageProps = {
  params: Promise<{
    slug: string
  }>
}

const MANUFACTURERS = {
  'millet-abc': {
  product: 'Meltiva Nutrimix',
  productFullName: 'TENOO Meltiva Nutrimix',
  manufacturer: 'Tiny Dot Foods Private Limited',
  address: [
    '51 Kavarai Street',
    'Athipet',
    'Chennai – 600058',
    'Tamil Nadu, India',
  ],
  fssai: '12425999000009',
},

'pink-abc': {
  product: 'Rubyblend Nutrimix',
  productFullName: 'TENOO Rubyblend Nutrimix',
  manufacturer: 'Tiny Dot Foods Private Limited',
  address: [
    '51 Kavarai Street',
    'Athipet',
    'Chennai – 600058',
    'Tamil Nadu, India',
  ],
  fssai: '12425999000009',
},

  'black-rice-milk-mix': {
    product: 'Karuppu Kavuni Cocoa Mix',
    productFullName: 'TENOO Karuppu Kavuni Cocoa Mix',
    manufacturer: 'Tiny Dot Foods Private Limited',
    address: [
      '51 Kavarai Street',
      'Athipet',
      'Chennai – 600058',
      'Tamil Nadu, India',
    ],
    fssai: '12425999000009',
  },

  'cotton-milk-mix': {
    product: 'Cotton Seed Milk Mix',
    productFullName: 'TENOO Cotton Seed Milk Mix',
    manufacturer: 'Tiny Dot Foods Private Limited',
    address: [
      '51 Kavarai Street',
      'Athipet',
      'Chennai – 600058',
      'Tamil Nadu, India',
    ],
    fssai: '12425999000009',
  },

  'pirandai-rice-mix': {
    product: 'Pirandai Rice Mix',
    productFullName: 'TENOO Pirandai Rice Mix',
    manufacturer: 'Veetoon',
    address: [
      '68/B2, Erode Road (West)',
      'Muthur Post',
      'Tiruppur Dt – 638105',
      'Tamil Nadu, India',
    ],
    fssai: '12423027001124',
  },

  'mudavattu-kilangu-rice-mix': {
    product: 'Mudavattu Kilangu Rice Mix',
    productFullName: 'TENOO Mudavattu Kilangu Rice Mix',
    manufacturer: 'Veetoon',
    address: [
      '68/B2, Erode Road (West)',
      'Muthur Post',
      'Tiruppur Dt – 638105',
      'Tamil Nadu, India',
    ],
    fssai: '12423027001124',
  },

  'mudavaattu-kizhangu-soup-mix': {
    product: 'Mudavaattu Kizhangu Soup Mix',
    productFullName: 'TENOO Mudavaattu Kizhangu Soup Mix',
    manufacturer: 'Veetoon',
    address: [
      '68/B2, Erode Road (West)',
      'Muthur Post',
      'Tiruppur Dt – 638105',
      'Tamil Nadu, India',
    ],
    fssai: '12423027001124',
  },
} as const

export default async function ManufacturerPage({
  params,
}: ManufacturerPageProps) {
  const { slug } = await params

  const manufacturer =
    MANUFACTURERS[slug as keyof typeof MANUFACTURERS]

  if (!manufacturer) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-background px-5 py-10 md:px-8 md:py-16">
      <div className="mx-auto max-w-2xl">

        {/* Brand */}
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="inline-block"
            aria-label="TENOO Home"
          >
            <span className="text-3xl font-bold tracking-tight text-primary">
              TENOO
            </span>
          </Link>

          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#8fbd24]">
            Product Verification
          </p>
        </div>

        {/* Main Card */}
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">

          {/* Header */}
          <div className="bg-primary px-6 py-8 text-primary-foreground md:px-10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                  TENOO
                </p>

                <h1 className="mt-1 font-serif text-2xl font-bold md:text-3xl">
                  Manufacturer Details
                </h1>
              </div>
            </div>
          </div>

          {/* Product */}
          <div className="border-b border-border px-6 py-6 md:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8fbd24]">
              Product
            </p>

            <h2 className="mt-2 font-serif text-2xl font-bold text-primary">
              {manufacturer.product}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {manufacturer.productFullName}
            </p>
          </div>

          {/* Manufacturer */}
          <div className="px-6 py-7 md:px-10 md:py-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf3dc] text-[#8fbd24]">
                <Factory className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Manufactured By
                </p>

                <h3 className="mt-2 text-lg font-bold text-primary">
                  {manufacturer.manufacturer}
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {manufacturer.address.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>

                {/* FSSAI */}
                <p className="mt-4 text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">
                    FSSAI Licence No.:
                  </span>{' '}
                  {manufacturer.fssai}
                </p>
              </div>
            </div>
          </div>

          {/* Verification */}
          <div className="border-t border-border bg-[#f7f8f6] px-6 py-5 md:px-10">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#8fbd24]">
              <CheckCircle2 className="h-5 w-5" />
              <span>Manufacturer information verified by TENOO</span>
            </div>
          </div>
        </section>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
          This page provides manufacturer information for the corresponding
          TENOO product packaging.
        </p>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} TENOO
        </p>
      </div>
    </main>
  )
}