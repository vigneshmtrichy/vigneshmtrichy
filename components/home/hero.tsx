import Image from 'next/image'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden">
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
         className="absolute left-1/2 bottom-[5%] hidden -translate-x-1/2 rounded-full bg-orange-500 px-7 py-3 text-sm font-bold text-white shadow-lg transition-transform duration-200 hover:scale-105 md:inline-flex"
        >
          EXPLORE OUR PRODUCTS
        </Link>
      </div>
    </section>
  )
}