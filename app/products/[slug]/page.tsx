import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductGallery } from '@/components/product-gallery'
import { RelatedProductsCarousel } from '@/components/related-products-carousel'
import { ScrollReveal } from '@/components/scroll-reveal'
import { ProductPurchasePanel } from '@/components/product/product-purchase-panel'
import { ProductReviews } from '@/components/product/product-reviews'
import {
  ALL_PRODUCTS,
  applyProductControls,
  getProductBySlug,
} from '@/lib/site'
import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'

export const dynamic = 'force-dynamic'

const getProductStatus = unstable_cache(
  async (slug: string) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    )

    const { data, error } = await supabase
      .from('product_status')
      .select('status, mrp, price, retailer_price, offer_enabled, offer_label, featured, featured_priority, display_name, badges, image_url, image_urls, shipping_weight_kg')
      .eq('product_slug', slug)
      .maybeSingle()

    if (error) {
      console.error('Failed to load product status:', error)
      return {
        status: 'active' as const,
        mrp: null,
        price: null,
      }
    }

    return {
      status: data?.status || 'active',
      mrp: data?.mrp ?? null,
      price: data?.price ?? null,
      retailer_price: data?.retailer_price ?? null,
      offer_enabled: data?.offer_enabled ?? null,
      offer_label: data?.offer_label ?? null,
      featured: data?.featured ?? null,
      featured_priority: data?.featured_priority ?? null,
      display_name: data?.display_name ?? null,
      badges: data?.badges ?? null,
      image_url: data?.image_url ?? null,
      image_urls: data?.image_urls ?? null,
      shipping_weight_kg: data?.shipping_weight_kg ?? null,
    }
  },
  ['product-page-status'],
  { revalidate: 60 },
)


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = getProductBySlug(slug)

  if (!product) {
    return {
      title: 'Product Not Found | Tenoo',
    }
  }

  const productStatus = await getProductStatus(product.slug)
  const displayProduct = applyProductControls(product, productStatus)

  return {
    title: `${displayProduct.name} | Tenoo`,
    description:
      displayProduct.description ||
      `${displayProduct.name} by Tenoo — thoughtfully crafted food made for everyday goodness.`,
    alternates: {
      canonical: `https://www.tenoo.in/products/${displayProduct.slug}`,
    },
    openGraph: {
      title: `${displayProduct.name} | Tenoo`,
      description:
        displayProduct.description ||
        `${displayProduct.name} by Tenoo — thoughtfully crafted food made for everyday goodness.`,
      url: `https://www.tenoo.in/products/${displayProduct.slug}`,
      type: 'website',
      images: [
        {
          url: displayProduct.image,
          alt: displayProduct.name,
        },
      ],
    },
  }
}
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

const productStatus = await getProductStatus(product.slug)
const displayProduct = applyProductControls(product, productStatus)

if (productStatus.status === 'hidden') {
  notFound()
}

  const categoryLabel =
    product.category === 'kids'
      ? 'For Little Ones & Families'
      : 'For Adults & Wellness'

const managedGalleryImages =
  displayProduct.imageUrls && displayProduct.imageUrls.length > 0
    ? displayProduct.imageUrls
    : displayProduct.imageUrl
      ? [displayProduct.imageUrl]
      : ['/placeholder.svg']

  const relatedProducts = ALL_PRODUCTS.filter(
    (item) => item.slug !== product.slug
  )

  const offerText =
    displayProduct.offerEnabled !== false &&
    displayProduct.mrp &&
    Number(displayProduct.mrp) > Number(displayProduct.price)
      ? displayProduct.offerLabel ||
        `${Math.round(((Number(displayProduct.mrp) - Number(displayProduct.price)) / Number(displayProduct.mrp)) * 100)}% OFF`
      : null
  const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: displayProduct.name,
  description: displayProduct.description || displayProduct.tagline,
  image: managedGalleryImages,
  brand: {
    '@type': 'Brand',
    name: 'Tenoo',
  },
  url: `https://www.tenoo.in/products/${product.slug}`,
  ...(displayProduct.price
    ? {
        offers: {
          '@type': 'Offer',
          price: displayProduct.price,
          priceCurrency: 'INR',
          url: `https://www.tenoo.in/products/${product.slug}`,
        },
      }
    : {}),
}
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://www.tenoo.in/',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Our Products',
      item: 'https://www.tenoo.in/products',
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: product.name,
      item: `https://www.tenoo.in/products/${product.slug}`,
    },
  ],
}
return (
  <div className="flex min-h-screen flex-col">
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(productSchema).replace(/</g, '\\u003c'),
      }}
    />

  <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(breadcrumbSchema).replace(/</g, '\\u003c'),
      }}
    />
    <SiteHeader />

      <main className="flex-1">

        {/* =========================================================
            PRODUCT HERO
            ========================================================= */}
        <section className="px-5 py-8 md:px-10 md:py-12">
          <div className="mx-auto max-w-6xl">

            {/* =====================================================
                MOBILE ONLY — PRODUCT INTRO ABOVE IMAGE
                ===================================================== */}
            <div className="mb-6 md:hidden">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                {categoryLabel}
              </p>

              <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-primary">
                {displayProduct.name}
              </h1>

              <p className="mt-3 text-base leading-7 text-muted-foreground">
                {product.tagline}
              </p>

            </div>

            {/* =====================================================
                DESKTOP — TWO COLUMN LAYOUT
                ===================================================== */}
            <div className="grid items-start gap-8 md:grid-cols-2 md:gap-14">

              {/* ===================================================
                  PRODUCT GALLERY
                  =================================================== */}
              <div className="mx-auto w-full max-w-[520px]">
                <ProductGallery
                  images={managedGalleryImages}
                  productName={displayProduct.name}
                  tagline={displayProduct.tagline}
                  packSize={displayProduct.packSize}
                  fallbackImage={displayProduct.image}
                />
              </div>

              {/* ===================================================
                  DESKTOP PRODUCT INFORMATION
                  =================================================== */}
              <div className="hidden md:block md:py-4">

                {/* Back Button — Desktop Only */}
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent transition-opacity hover:opacity-70"
                >
                  ← Our Products
                </Link>

                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  {categoryLabel}
                </p>

                <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-primary md:text-5xl">
                  {displayProduct.name}
                </h1>

                <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
                  {product.tagline}
                </p>

                {/* Product Badges */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {displayProduct.badges.map((badge) => (
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
{/* PRICE */}
{displayProduct.price && (
  <div className="mt-5 flex items-center gap-3">
    {displayProduct.mrp && (
      <span className="text-base text-muted-foreground line-through">
        ₹{displayProduct.mrp}
      </span>
    )}

    <span className="text-2xl font-bold text-primary">
      ₹{displayProduct.price}
    </span>

    {offerText && (
      <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-600">
        {offerText}
      </span>
    )}
  </div>
)}
         {/* PURCHASE ACTIONS */}
<ProductPurchasePanel
  product={displayProduct}
  status={productStatus.status}
/>

              </div>
            </div>

            {/* =====================================================
                MOBILE ONLY — BADGES
                ===================================================== */}
            <div className="mt-5 md:hidden">
              <div className="flex flex-wrap gap-2">
                {displayProduct.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-primary"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* =====================================================
                MOBILE ONLY — NET WEIGHT + WHATSAPP
                Comes AFTER IMAGE
                ===================================================== */}
            <div className="mt-6 md:hidden">

              {product.packSize && (
                <div>
                  <span className="inline-flex rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-primary">
                    Net Weight: {product.packSize}
                  </span>
                </div>
              )}

     <ProductPurchasePanel
  product={displayProduct}
  status={productStatus.status}
/>

            </div>

          </div>
        </section>

        {/* =========================================================
            PRODUCT INFORMATION
            ========================================================= */}
        <section className="bg-card/40 px-5 pt-10 pb-4 md:px-10 md:pt-14 md:pb-6">
          <div className="mx-auto max-w-6xl">

            <div className="grid gap-5 md:grid-cols-2">

              {/* About */}
              <ScrollReveal delay={0}>
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
              </ScrollReveal>

              {/* Ingredients */}
              <ScrollReveal delay={100}>
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
              </ScrollReveal>

              {/* Nutrition */}
              <ScrollReveal delay={200}>
                <div className="rounded-2xl border border-border bg-background p-6 md:p-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                    Nutrition
                  </p>

                  <h2 className="mt-2 font-serif text-xl font-bold text-primary md:text-2xl">
                    Nutritional information
                  </h2>

                  {product.nutrition && product.nutrition.length > 0 ? (
                    <div className="mt-4 overflow-hidden rounded-xl border border-border">
                      {product.nutrition.map((item, index) => (
                        <div
                          key={item}
                          className={
                            index !== product.nutrition!.length - 1
                              ? 'grid grid-cols-2 gap-4 border-b border-border px-4 py-2.5 text-sm'
                              : 'grid grid-cols-2 gap-4 px-4 py-2.5 text-sm'
                          }
                        >
                          <span className="text-muted-foreground">
                            {item.split(':')[0]}
                          </span>

                          <span className="text-right font-semibold text-primary">
                            {item.split(':').slice(1).join(':').trim()}
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
              </ScrollReveal>

              {/* Preparation */}
              <ScrollReveal delay={300}>
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
              </ScrollReveal>

            </div>
          </div>
        </section>

        {/* =========================================================
            PRODUCT DETAILS
            ========================================================= */}
        <ScrollReveal>
          <section className="px-5 pt-0 pb-10 md:px-10 md:pt-0 md:pb-14">
            <div className="mx-auto max-w-6xl">

              <div className="rounded-2xl border border-border bg-background p-6 md:p-8">

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  Product Details
                </p>

                <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

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

                      <p className="mt-1.5 max-w-[260px] text-sm leading-6 text-muted-foreground">
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

                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>
{/* =========================================================
    CUSTOMER REVIEWS
    ========================================================= */}
<ScrollReveal>
  <ProductReviews
    productSlug={product.slug}
  />
</ScrollReveal>

        {/* =========================================================
            RELATED PRODUCTS
            ========================================================= */}
        <ScrollReveal>
          <RelatedProductsCarousel products={relatedProducts} />
        </ScrollReveal>

        {/* =========================================================
            BOTTOM CTA
            ========================================================= */}
        <ScrollReveal delay={100}>
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
                  href="https://wa.me/919585808590"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-7 inline-flex items-center justify-center rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
                >
                  CHAT WITH US ON WHATSAPP
                </a>

              </div>
            </div>
          </section>
        </ScrollReveal>

      </main>

      <SiteFooter />
    </div>
  )
}