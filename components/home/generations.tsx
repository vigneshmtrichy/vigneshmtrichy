import Link from 'next/link'
import { ArrowRight, User, Users } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { ADULT_PRODUCTS, KIDS_PRODUCTS } from '@/lib/site'

function ViewAll() {
  return (
    <div className="mt-6 flex justify-center">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 rounded-full border border-terracotta/40 bg-card px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-terracotta transition-colors hover:bg-terracotta hover:text-primary-foreground"
      >
        View All Products
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

export function Generations() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 lg:py-10">
      <div className="text-center">
        <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
          Goodness for Every Generation
        </h2>
        <div className="mx-auto mt-3 flex items-center justify-center gap-2 text-leaf">
          <span className="h-px w-10 bg-border" />
          <span className="text-lg leading-none">❦</span>
          <span className="h-px w-10 bg-border" />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Kids & Family */}
        <div className="rounded-3xl bg-peach/60 p-6 sm:p-8">
          <div className="text-center">
            <h3 className="inline-flex items-center gap-2 font-serif text-2xl font-bold text-terracotta">
              <Users className="h-6 w-6" />
              Kids &amp; Family
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Nourishing blends for growing minds &amp; bodies
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {KIDS_PRODUCTS.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
          <ViewAll />
        </div>

        {/* Adults & Wellness */}
        <div className="rounded-3xl bg-leaf/10 p-6 sm:p-8">
          <div className="text-center">
            <h3 className="inline-flex items-center gap-2 font-serif text-2xl font-bold text-leaf">
              <User className="h-6 w-6" />
              Adults &amp; Wellness
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Traditional ingredients for modern wellness
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3">
            {ADULT_PRODUCTS.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
          <ViewAll />
        </div>
      </div>
    </section>
  )
}
