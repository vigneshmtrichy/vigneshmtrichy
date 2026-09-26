import Link from 'next/link'
import { ArrowRight, Leaf } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import {
  ADULT_PRODUCTS,
  KIDS_PRODUCTS,
} from '@/lib/site'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

async function getProductStatuses() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )

  const { data, error } = await supabase
    .from('product_status')
    .select('product_slug, status')

  if (error) {
    console.error('Failed to load product statuses:', error)
    return {}
  }

  return Object.fromEntries(
    (data || []).map((item) => [
      item.product_slug,
      item.status,
    ]),
  )
}

export async function Generations() {
  const productStatuses = await getProductStatuses()

  const ALL_PRODUCTS = Array.from(
    new Map(
      [...KIDS_PRODUCTS, ...ADULT_PRODUCTS]
        .filter(
          (product) =>
            productStatuses[product.slug] !== 'hidden',
        )
        .map((product) => [
          product.slug,
          product,
        ]),
    ).values(),
  )

  const FEATURED_PRODUCTS = ALL_PRODUCTS.slice(0, 6)


  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 lg:py-10 max-md:py-7">
      {/* SECTION TITLE */}
      <div className="text-center">
        <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl max-md:text-[28px] max-md:leading-tight">
          Goodness for Every Generation
        </h2>

        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Wholesome blends made with natural ingredients for every family.
        </p>

        <div className="mx-auto mt-3 flex items-center justify-center gap-2 text-leaf">
          <span className="h-px w-8 bg-border" />
          <span className="text-lg leading-none">❦</span>
          <span className="h-px w-8 bg-border" />
        </div>
      </div>

      {/* ALL PRODUCTS */}
      <div className="relative mt-7 overflow-hidden rounded-3xl bg-[#F3F8F1] p-5 sm:p-6 max-md:mt-6 max-md:rounded-[26px] max-md:p-4">

        {/* Decorative leaves */}
        <Leaf
          className="pointer-events-none absolute -left-2 top-5 h-20 w-20 -rotate-45 text-emerald-200/60 max-md:h-16 max-md:w-16"
        />

        <Leaf
          className="pointer-events-none absolute -right-2 top-3 h-16 w-16 rotate-45 text-emerald-200/60 max-md:h-14 max-md:w-14"
        />

        <Leaf
          className="pointer-events-none absolute -bottom-4 -left-1 h-20 w-20 -rotate-12 text-emerald-200/50 max-md:h-16 max-md:w-16"
        />

        <Leaf
          className="pointer-events-none absolute -bottom-3 right-3 h-16 w-16 rotate-45 text-emerald-200/50 max-md:h-14 max-md:w-14"
        />

        {/* Collection heading */}
        <div className="relative z-10 text-center">
          <h3 className="font-serif text-2xl font-bold text-emerald-900 max-md:text-[22px]">
            Explore Our Collection
          </h3>

          <p className="mt-1 text-sm text-muted-foreground max-md:text-[13px] max-md:leading-5">
            Nutritious blends and traditional goodness for every generation
          </p>
        </div>

        {/* PRODUCTS */}
        <div
          className="
            relative z-10 mt-6
            flex gap-4 overflow-x-auto pb-2
            snap-x snap-mandatory
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden

            sm:grid sm:grid-cols-6
            sm:overflow-visible
            sm:pb-0
            sm:snap-none

            max-md:mt-5
            max-md:gap-3
          "
        >
          {FEATURED_PRODUCTS.map((product) => (
            <div
              key={product.slug}
              className="
                min-w-[58%]
                shrink-0
                snap-start
                sm:min-w-0
                sm:shrink
              "
            >
              <ProductCard
  product={product}
  status={productStatuses[product.slug]}
/>
            </div>
          ))}
        </div>

        {/* VIEW ALL */}
        <div className="relative z-10 mt-7 flex justify-center max-md:mt-6">
          <Link
            href="/products"
            className="
              inline-flex items-center gap-2
              rounded-full
              border border-emerald-800
              bg-transparent
              px-6 py-2.5
              text-sm font-bold
              uppercase tracking-wide
              text-emerald-800
              transition-all duration-200
              hover:scale-[1.03]
              hover:bg-emerald-800
              hover:text-white
              max-md:px-5
              max-md:py-2.5
              max-md:text-xs
            "
          >
            View All Products
            <ArrowRight className="h-4 w-4 max-md:h-3.5 max-md:w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}