import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import {
  ALL_PRODUCTS,
  getProductBySlug,
  whatsAppOrderUrl,
} from '@/lib/site'

export function generateStaticParams() {
  return ALL_PRODUCTS.map((product) => ({
    slug: product.slug,
  }))
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const categoryLabel =
    product.category === 'kids'
      ? 'For Little Ones & Families'
      : 'For Adults & Wellness'

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">

        {/* ================= PRODUCT HERO ================= */}
        <section className="px-5 py-8 md:px-10 md:py-12">
          <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-2 md:gap-14">

            {/* Product Image */}
            <div className="relative mx-auto aspect-square w-full max-w-[520px] overflow-hidden rounded-[2rem] bg-card/50">
              <Image
                src={product.image || '/placeholder.svg'}
                alt={`${product.name} product pack`}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain p-7 md:p-10"
              />
            </div>

            {/* Product Information */}
            <div className="md:py-4">

              <Link
                href="/products"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-accent"
              >
                ← Our Products
              </Link>

              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                {categoryLabel}
              </p>

              <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-primary md:text-5xl">
                {product.name}
              </h1>

              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
                {product.tagline}
              </p>

              {/* Badges */}
              <div className="mt-6 flex flex-wrap gap-2">
                {product.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-primary"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              {/* Pack Size */}
              {product.packSize && (
                <div className="mt-6">
                  <span className="inline-flex rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-primary">
                    Net Weight: {product.packSize}
                  </span>
                </div>
              )}

              {/* Order Button */}
              <div className="mt-7">
                <a
                  href={whatsAppOrderUrl(product.name)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  ORDER ON WHATSAPP
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ================= PRODUCT INFORMATION ================= */}
        <section className="bg-card/40 px-5 py-10 md:px-10 md:py-14">
          <div className="mx-auto max-w-6xl">

            <div className="grid gap-5 md:grid-cols-2">

              {/* About */}
              <div className="rounded-2xl border border-border bg-background p-6 md:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  About the Product
                </p>

                <h2 className="mt-2 font-serif text-xl font-bold text-primary md:text-2xl">
                  Made for everyday goodness.
                </h2>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {product.description ||
                    'Product information coming soon.'}
                </p>
              </div>

              {/* Ingredients */}
              <div className="rounded-2xl border border-border bg-background p-6 md:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  Ingredients
                </p>

                <h2 className="mt-2 font-serif text-xl font-bold text-primary md:text-2xl">
                  What&apos;s inside
                </h2>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {product.ingredients ||
                    'Product information coming soon.'}
                </p>
              </div>

              {/* Nutrition */}
              <div className="rounded-2xl border border-border bg-background p-6 md:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  Nutrition
                </p>

                <h2 className="mt-2 font-serif text-xl font-bold text-primary md:text-2xl">
                  Nutritional information
                </h2>

                {product.nutrition &&
                product.nutrition.length > 0 ? (
                  <div className="mt-4 overflow-hidden rounded-xl border border-border">
                    {product.nutrition.map((item, index) => (
                      <div
                        key={item}
                        className={`grid grid-cols-2 gap-4 px-4 py-2.5 text-sm ${
                          index !== product.nutrition.length - 1
                            ? 'border-b border-border'
                            : ''
                        }`}
                      >
                        <span className="text-muted-foreground">
                          {item.split(':')[0]}
                        </span>

                        <span className="text-right font-semibold text-primary">
                          {item
                            .split(':')
                            .slice(1)
                            .join(':')
                            .trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Nutrition information coming soon.
                  </p>
                )}
              </div>

              {/* Preparation */}
              <div className="rounded-2xl border border-border bg-background p-6 md:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  How to Prepare
                </p>

                <h2 className="mt-2 font-serif text-xl font-bold text-primary md:text-2xl">
                  Simple everyday preparation
                </h2>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {product.preparation ||
                    'Preparation information coming soon.'}
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ================= PRODUCT DETAILS ================= */}
        <section className="px-5 py-10 md:px-10 md:py-14">
          <div className="mx-auto max-w-6xl">

            <div className="rounded-2xl border border-border bg-background p-6 md:p-8">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Product Details
              </p>

              <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

                {/* Allergen */}
                {product.allergen && (
                  <div>
                    <h3 className="text-sm font-semibold text-primary">
                      Allergen Information
                    </h3>

                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      {product.allergen}
                    </p>
                  </div>
                )}

                {/* Storage */}
                {product.storage && (
                  <div>
                    <h3 className="text-sm font-semibold text-primary">
                      Storage
                    </h3>

                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      {product.storage}
                    </p>
                  </div>
                )}

                {/* Country */}
                {product.countryOfOrigin && (
                  <div>
                    <h3 className="text-sm font-semibold text-primary">
                      Country of Origin
                    </h3>

                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      {product.countryOfOrigin}
                    </p>
                  </div>
                )}

                {/* Manufacturer */}
                {product.manufacturedBy && (
                  <div>
                    <h3 className="text-sm font-semibold text-primary">
                      Manufactured By
                    </h3>

                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      {product.manufacturedBy}
                    </p>
                  </div>
                )}

              </div>
            </div>
          </div>
        </section>

        {/* ================= BOTTOM CTA ================= */}
        {/* ================= BOTTOM CTA ================= */}
<section className="bg-background px-5 py-10 md:px-10 md:py-14">
  <div className="mx-auto max-w-6xl">
    <div className="rounded-[2rem] bg-primary px-6 py-10 text-center md:px-10 md:py-14">

      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/70">
        TENOO
      </p>

      <h2 className="mt-2 font-serif text-3xl font-bold text-primary-foreground md:text-5xl">
        Discover your Tenoo favourite.
      </h2>

      <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/80 md:text-base">
        Good food, made for every generation.
      </p>

      <a
        href={whatsAppOrderUrl(product.name)}
        target="_blank"
        rel="noreferrer"
        className="mt-7 inline-flex items-center justify-center rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
      >
        CHAT WITH US ON WHATSAPP
      </a>

    </div>
  </div>
</section>

      </main>

      <SiteFooter />
    </div>
  )
}