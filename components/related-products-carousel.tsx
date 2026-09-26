'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PRODUCT_STATUS } from '@/lib/site'
import type { Product, ProductStatus } from '@/lib/site'
import { supabase } from '@/lib/supabase'

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

  const [productStatuses, setProductStatuses] =
  useState<Record<string, ProductStatus>>({})

useEffect(() => {
  const loadProductStatuses = async () => {
   

    const { data, error } = await supabase
      .from('product_status')
      .select('product_slug, status')

    if (error) {
      console.error(
        'Failed to load related product statuses:',
        error,
      )
      return
    }

    setProductStatuses(
      Object.fromEntries(
        (data || []).map((item) => [
          item.product_slug,
          item.status as ProductStatus,
        ]),
      ),
    )
  }

  loadProductStatuses()
}, [])

 const visibleProducts = products.filter((product) => {
  const status =
    productStatuses[product.slug] ??
    PRODUCT_STATUS[product.slug] ??
    'active'

  return status !== 'hidden'
})

  const productsPerPage = 4
  const totalPages = Math.ceil(visibleProducts.length / productsPerPage)

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
          {visibleProducts.map((item) => (
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

                {/* PRICE */}
                {item.price && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {item.mrp && (
                      <span className="text-xs text-muted-foreground line-through">
                        ₹{item.mrp}
                      </span>
                    )}

                    <span className="text-sm font-bold text-primary">
                      ₹{item.price}
                    </span>

                    {item.mrp &&
                      Number(item.mrp) > Number(item.price) && (
                        <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">
                          {Math.round(
                            ((Number(item.mrp) - Number(item.price)) /
                              Number(item.mrp)) *
                              100
                          )}
                          % OFF
                        </span>
                      )}
                  </div>
                )}

            {(() => {
  const status =
    productStatuses[item.slug] ??
    PRODUCT_STATUS[item.slug] ??
    'active'

  return (
    <div
      className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-[11px] font-bold ${
        status === 'coming-soon'
          ? 'bg-orange-100 text-orange-600'
          : status === 'out-of-stock'
            ? 'bg-red-100 text-red-600'
            : 'bg-muted text-muted-foreground'
      }`}
    >
      {status === 'coming-soon'
        ? 'COMING SOON'
        : status === 'out-of-stock'
          ? 'OUT OF STOCK'
          : 'View product →'}
    </div>
  )
})()}
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

                 const pageProducts = visibleProducts.slice(
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

                            {/* PRICE */}
                            {item.price && (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                {item.mrp && (
                                  <span className="text-sm text-muted-foreground line-through">
                                    ₹{item.mrp}
                                  </span>
                                )}

                                <span className="text-base font-bold text-primary">
                                  ₹{item.price}
                                </span>

                                {item.mrp &&
                                  Number(item.mrp) >
                                    Number(item.price) && (
                                    <span className="rounded-full bg-orange-100 px-2 py-1 text-[11px] font-bold text-orange-600">
                                      {Math.round(
                                        ((Number(item.mrp) -
                                          Number(item.price)) /
                                          Number(item.mrp)) *
                                          100
                                      )}
                                      % OFF
                                    </span>
                                  )}
                              </div>
                            )}

                          {(() => {
  const status =
    productStatuses[item.slug] ??
    PRODUCT_STATUS[item.slug] ??
    'active'

  return (
    <div
      className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-[11px] font-bold ${
        status === 'coming-soon'
          ? 'bg-orange-100 text-orange-600'
          : status === 'out-of-stock'
            ? 'bg-red-100 text-red-600'
            : 'bg-muted text-muted-foreground'
      }`}
    >
      {status === 'coming-soon'
        ? 'COMING SOON'
        : status === 'out-of-stock'
          ? 'OUT OF STOCK'
          : 'View product →'}
    </div>
  )
})()}
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