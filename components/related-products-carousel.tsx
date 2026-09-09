'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import type { Product } from '@/lib/site'
const GALLERY_FOLDERS: Record<string, string> = {
  'millet-abc': 'Meltiva-Nutrimix',
  'pink-abc': 'Rubyblend-Nutrimix',
  'cotton-milk-mix': 'Paruthipaal-mix',
  'pirandai-rice-mix': 'Pirandai-rice-mix',
  'mudavattu-kilangu-rice-mix': 'Mudavaatukaal-rice-mix',
  'mudavaattu-kizhangu-soup-mix': 'Mudavaatukaal-soup-mix',
  'black-rice-milk-mix': 'blacko-cocoa-mix',
}
type RelatedProductsCarouselProps = {
  products: Product[]
}

export function RelatedProductsCarousel({
  products,
}: RelatedProductsCarouselProps) {
  const [page, setPage] = useState(0)

  const productsPerPage = 4
  const totalPages = Math.ceil(products.length / productsPerPage)

  const goNext = () => {
    setPage((current) =>
      current < totalPages - 1 ? current + 1 : current
    )
  }

  const goPrevious = () => {
    setPage((current) =>
      current > 0 ? current - 1 : current
    )
  }

  return (
    <section className="px-5 pb-12 pt-4 md:px-10 md:pb-20">
      <div className="mx-auto max-w-6xl">

        {/* HEADING */}
        <div className="mb-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            TENOO
          </p>

          <h2 className="mt-2 font-serif text-3xl font-bold text-primary md:text-4xl">
            You may also like.
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Discover more from Tenoo.
          </p>
        </div>

        {/* =====================================================
            MOBILE — EXISTING HORIZONTAL SWIPE
            ===================================================== */}
        <div className="flex gap-3 overflow-x-auto pb-2 md:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
          {products.map((item) => (
            <Link
              key={item.slug}
              href={`/products/${item.slug}`}
              className="group w-[calc(50vw-28px)] shrink-0 overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="relative aspect-square overflow-hidden bg-background">
                <Image
                  src={
  GALLERY_FOLDERS[item.slug]
    ? `/products/${GALLERY_FOLDERS[item.slug]}/1.png`
    : item.image || '/placeholder.svg'
}
                  alt={`${item.name} product`}
                  fill
                  sizes="50vw"
                  className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div className="p-3">
                <h3 className="font-serif text-sm font-bold leading-tight text-primary">
                  {item.name}
                </h3>

                <p className="mt-1 text-[11px] text-muted-foreground">
                  View product →
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* =====================================================
            DESKTOP — SMOOTH SLIDING CAROUSEL
            ===================================================== */}
        <div className="relative hidden md:block">

          {/* VIEWPORT */}
          <div className="overflow-hidden">

            {/* SLIDING TRACK */}
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${page * 100}%)`,
              }}
            >

              {/* PRODUCT PAGES */}
              {Array.from({ length: totalPages }).map((_, pageIndex) => {
                const startIndex = pageIndex * productsPerPage

                const pageProducts = products.slice(
                  startIndex,
                  startIndex + productsPerPage
                )

                return (
                  <div
                    key={pageIndex}
                    className="w-full shrink-0"
                  >
                    <div
                      className={`grid grid-cols-4 gap-6 ${
                        pageIndex === 0
                          ? 'pr-16'
                          : 'pl-16 pr-16'
                      }`}
                    >
                      {pageProducts.map((item) => (
                        <Link
                          key={item.slug}
                          href={`/products/${item.slug}`}
                          className="group overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-300 hover:-translate-y-1"
                        >
                          <div className="relative aspect-square overflow-hidden bg-background">
                            <Image
                              src={
  GALLERY_FOLDERS[item.slug]
    ? `/products/${GALLERY_FOLDERS[item.slug]}/1.png`
    : item.image || '/placeholder.svg'
}
                              alt={`${item.name} product`}
                              fill
                              sizes="25vw"
                              className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>

                          <div className="p-4">
                            <h3 className="font-serif text-base font-bold text-primary lg:text-lg">
                              {item.name}
                            </h3>

                            <p className="mt-1 text-xs text-muted-foreground">
                              View product →
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}

            </div>
          </div>

          {/* PREVIOUS */}
          {page > 0 && (
            <button
              type="button"
              onClick={goPrevious}
              aria-label="Previous products"
              className="absolute left-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-2xl text-primary shadow-sm transition hover:bg-primary hover:text-primary-foreground"
            >
              ←
            </button>
          )}

          {/* NEXT */}
          {page < totalPages - 1 && (
            <button
              type="button"
              onClick={goNext}
              aria-label="Next products"
              className="absolute right-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-2xl text-primary shadow-sm transition hover:bg-primary hover:text-primary-foreground"
            >
              →
            </button>
          )}

        </div>

      </div>
    </section>
  )
}