import Image from 'next/image'
import Link from 'next/link'

export function Hero() {
  return (
    <section id="tenoo-hero" className="relative mt-3 = 12px w-full overflow-hidden">
      <div className="relative">
        <Image
          src="/home-banner.png"
          alt="TENOO — Rooted in Indian Food"
          width={2048}
          height={768}
          priority
          className="block h-auto w-full"
        />

        <Link
          href="/products"
         className="tenoo-products-cta absolute left-1/2 bottom-[1%] inline-flex -translate-x-1/2 rounded-full bg-orange-500 px-4 py-2 text-[11px] sm:px-7 sm:py-3 sm:text-sm whitespace-nowrap font-bold text-white shadow-lg transition-transform duration-200 hover:scale-105 md:inline-flex"
        >
          EXPLORE OUR PRODUCTS
        </Link>
      </div>
    </section>
  )
}