import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductCard } from '@/components/product-card'
import { KIDS_PRODUCTS, ADULT_PRODUCTS } from '@/lib/site'

export default function ProductsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">

        {/* =========================
            PAGE HERO
        ========================== */}
        <section className="px-6 pb-10 pt-14 md:px-10 md:pb-14 md:pt-16">
          <div className="mx-auto max-w-5xl text-center">

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-orange-600 md:mb-4 md:text-sm">
              Our Collection
            </p>

            <h1 className="font-serif text-5xl font-bold leading-[1.02] tracking-tight text-primary md:text-7xl">
              Good Food.
              <br />
              <span className="text-orange-600">
                Made for You.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:mt-6 md:text-lg md:leading-8">
              Thoughtfully crafted food products inspired by Indian ingredients,
              made for growing families and everyday wellness.
            </p>

          </div>
        </section>


        {/* =========================
            KIDS COLLECTION
        ========================== */}
        <section className="px-6 pb-14 md:px-10 md:pb-16">
          <div className="mx-auto max-w-7xl">

            {/* Section heading */}
            <div className="mb-6 flex flex-col gap-2 md:mb-8 md:flex-row md:items-end md:justify-between">

              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-orange-600 md:text-sm">
                  For Little Ones
                </p>

                <h2 className="font-serif text-3xl font-bold leading-tight text-primary md:text-5xl">
                  Growing with Goodness
                </h2>
              </div>

              <p className="max-w-md text-sm leading-6 text-muted-foreground md:text-right md:text-base">
                Wholesome blends created for growing children and everyday
                nourishment.
              </p>

            </div>

            {/* Kids Products */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-7 md:gap-y-12">
              {KIDS_PRODUCTS.map((product) => (
                <ProductCard
                  key={product.slug}
                  product={product}
                />
              ))}
            </div>

          </div>
        </section>


        {/* =========================
            ADULTS COLLECTION
        ========================== */}
        <section className="border-y border-border/50 bg-card/40 px-6 py-14 md:px-10 md:py-16">
          <div className="mx-auto max-w-7xl">

            {/* Section heading */}
            <div className="mb-6 flex flex-col gap-2 md:mb-8 md:flex-row md:items-end md:justify-between">

              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-orange-600 md:text-sm">
                  For Everyday Wellness
                </p>

                <h2 className="font-serif text-3xl font-bold leading-tight text-primary md:text-5xl">
                  Traditional Goodness
                </h2>
              </div>

              <p className="max-w-md text-sm leading-6 text-muted-foreground md:text-right md:text-base">
                Familiar Indian ingredients thoughtfully crafted into
                convenient everyday food.
              </p>

            </div>

            {/* Adult Products
                Keep 4 columns so product images stay
                the same visual size as the Kids collection.
            */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-7 md:gap-y-12">
              {ADULT_PRODUCTS.map((product) => (
                <ProductCard
                  key={product.slug}
                  product={product}
                />
              ))}
            </div>

          </div>
        </section>


        {/* =========================
            BRAND STATEMENT
        ========================== */}
        <section className="px-6 py-12 text-center md:px-10 md:py-14">
          <div className="mx-auto max-w-3xl">

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">
              Made with Intention
            </p>

            <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-primary md:text-5xl">
              Good food belongs
              <br />
              <span className="text-orange-600">
                on every table.
              </span>
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground md:text-base md:leading-7">
              From traditional favourites to nourishing everyday blends,
              TENOO brings familiar goodness into modern homes.
            </p>

          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  )
}