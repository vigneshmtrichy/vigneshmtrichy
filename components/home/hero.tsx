'use client'

import Image from 'next/image'
import Link from 'next/link'

export function Hero() {
  return (
    <section id="tenoo-hero" className="relative mt-3 w-full overflow-hidden">
      <div className="relative aspect-[2048/768] w-full overflow-hidden">
        <Image
          src="/home-banner.png"
          alt="TENOO — Rooted in Indian Food"
          fill
          priority
          className="tenoo-hero-final"
        />

        <div className="tenoo-hero-half tenoo-hero-half-left" aria-hidden="true">
          <Image
            src="/home-banner.png"
            alt=""
            fill
            priority
            className="tenoo-hero-half-image"
          />
        </div>

        <div className="tenoo-hero-half tenoo-hero-half-right" aria-hidden="true">
          <Image
            src="/home-banner.png"
            alt=""
            fill
            priority
            className="tenoo-hero-half-image"
          />
        </div>

        <Link
          href="/products"
          className="absolute left-1/2 bottom-[1%] z-20 hidden -translate-x-1/2 rounded-full bg-orange-500 px-7 py-3 text-sm font-bold text-white shadow-lg transition-transform duration-200 hover:scale-105 md:inline-flex"
        >
          EXPLORE OUR PRODUCTS
        </Link>
      </div>
    </section>
  )
}
