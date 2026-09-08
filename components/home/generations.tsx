import Link from 'next/link'
import { ArrowRight, Heart, Leaf, Sun, User, Users } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { ADULT_PRODUCTS, KIDS_PRODUCTS } from '@/lib/site'

const VISIBLE_KIDS_PRODUCTS = KIDS_PRODUCTS.filter(
  (product) => product.slug !== 'black-rice-milk-mix',
)

function ViewAll({
  variant,
}: {
  variant: 'kids' | 'adults'
}) {
  const isKids = variant === 'kids'

  return (
    <div className="mt-7 flex justify-center">
      <Link
        href="/products"
        className={`inline-flex items-center gap-2 rounded-full border bg-transparent px-6 py-2.5 text-sm font-bold uppercase tracking-wide transition-all duration-200 hover:scale-[1.03] ${
          isKids
            ? 'border-orange-600 text-orange-700 hover:bg-orange-600 hover:text-white'
            : 'border-emerald-800 text-emerald-800 hover:bg-emerald-800 hover:text-white'
        }`}
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

      {/* Section heading */}
      <div className="text-center">
        <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
          Goodness for Every Generation
        </h2>

        <div className="mx-auto mt-2 flex items-center justify-center gap-2 text-leaf">
          <span className="h-px w-8 bg-border" />
          <span className="text-lg leading-none">❦</span>
          <span className="h-px w-8 bg-border" />
        </div>
      </div>

      {/* Category cards */}
      <div className="mt-7 grid gap-5 lg:grid-cols-2">

        {/* Kids & Family */}
        <div className="relative overflow-hidden rounded-3xl bg-[#FFF1E1] p-5 sm:p-6">

          <Sun className="pointer-events-none absolute left-5 top-6 h-12 w-12 text-orange-300/70" />

          <Heart
            className="pointer-events-none absolute right-7 top-10 h-8 w-8 fill-orange-200/50 text-orange-200/70"
          />

          <Leaf
            className="pointer-events-none absolute -bottom-2 -left-2 h-20 w-20 -rotate-45 text-orange-200/60"
          />

          <Leaf
            className="pointer-events-none absolute -bottom-5 left-10 h-14 w-14 -rotate-12 text-orange-200/50"
          />

          <div className="relative z-10 text-center">
            <h3 className="inline-flex items-center gap-2 font-serif text-2xl font-bold text-orange-700">
              <Users className="h-6 w-6" />
              Kids &amp; Family
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Nourishing blends for growing minds &amp; bodies
            </p>
          </div>

          <div className="relative z-10 mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {VISIBLE_KIDS_PRODUCTS.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>

          <div className="relative z-10">
            <ViewAll variant="kids" />
          </div>
        </div>

        {/* Adults & Wellness */}
        <div className="relative overflow-hidden rounded-3xl bg-[#E8F5EC] p-5 sm:p-6">

          <Leaf
            className="pointer-events-none absolute -left-1 top-5 h-20 w-20 -rotate-45 text-emerald-200/70"
          />

          <Leaf
            className="pointer-events-none absolute -right-2 top-2 h-16 w-16 rotate-45 text-emerald-200/70"
          />

          <Leaf
            className="pointer-events-none absolute -bottom-4 -left-1 h-20 w-20 -rotate-12 text-emerald-200/60"
          />

          <Leaf
            className="pointer-events-none absolute -bottom-3 right-3 h-16 w-16 rotate-45 text-emerald-200/60"
          />

          <div className="relative z-10 text-center">
            <h3 className="inline-flex items-center gap-2 font-serif text-2xl font-bold text-emerald-900">
              <User className="h-6 w-6" />
              Adults &amp; Wellness
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Traditional ingredients for modern wellness
            </p>
          </div>

          <div className="relative z-10 mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {ADULT_PRODUCTS.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>

          <div className="relative z-10">
            <ViewAll variant="adults" />
          </div>
        </div>

      </div>
    </section>
  )
}