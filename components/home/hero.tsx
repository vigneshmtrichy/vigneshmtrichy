import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Leaf } from 'lucide-react'
import { WhatsAppIcon } from '@/components/whatsapp-icon'
import { WHATSAPP_URL } from '@/lib/site'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-5 px-4 pb-4 pt-6 md:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-6 lg:pt-8">

        <div className="relative z-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-terracotta">
            Rooted in Indian Food
          </p>

          <h1 className="mt-3 font-serif text-4xl font-black leading-[0.95] tracking-tight text-primary text-balance sm:text-5xl lg:text-6xl">
            Good Food, <br className="hidden sm:block" />
            Made for{' '}
            <span className="text-terracotta">Every</span>{' '}
            Generation.
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Thoughtfully crafted food products inspired by Indian ingredients,
            made for little ones, families and everyday living.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.03]"
            >
              Explore Products
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-secondary"
            >
              <WhatsAppIcon className="h-4 w-4 text-leaf" />
              Order on WhatsApp
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="absolute right-0 top-0 -z-0 hidden h-[80%] w-[80%] translate-x-4 rounded-full bg-peach/70 lg:block" />

          <div className="relative z-10">
            <div className="mb-1 flex items-center justify-center gap-2 text-sm font-medium text-leaf">
              <Leaf className="h-4 w-4" />
              Nourishing for every day
            </div>

            <Image
              src="/products/hero-showcase.png"
              alt="Range of TENOO food product packs with prepared bowls and natural ingredients"
              width={1100}
              height={825}
              priority
              className="mx-auto h-auto w-[92%] object-contain lg:w-[88%]"
            />
          </div>
        </div>

      </div>
    </section>
  )
}