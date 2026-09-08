import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function Story() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
      <div className="relative overflow-hidden rounded-3xl bg-beige/70 lg:grid lg:grid-cols-2 lg:items-stretch">

        {/* Text */}
        <div
          className="
            relative z-10 flex flex-col justify-end
            px-6 pb-7 pt-10
            max-lg:absolute max-lg:inset-x-0 max-lg:bottom-0
            max-lg:bg-gradient-to-t max-lg:from-primary max-lg:via-primary/90 max-lg:to-transparent
            max-lg:text-primary-foreground
            sm:px-8
            lg:p-10
          "
        >
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-terracotta max-lg:text-lime-400">
            Our Story
          </p>

          <h2
            className="
              mt-3 font-serif text-3xl font-bold leading-tight text-primary text-balance
              sm:text-4xl
              max-lg:text-white
            "
          >
            Traditional Roots. <br />
            Modern Everyday Food.
          </h2>

          <p
            className="
              mt-4 max-w-md text-base leading-relaxed text-muted-foreground
              max-lg:text-white/75
            "
          >
            At Tenoo, we bring the goodness of Indian food traditions into your
            daily life with clean ingredients, thoughtful nutrition and real
            taste.
          </p>

          <div className="mt-6">
            <Link
              href="/about"
              className="
                inline-flex items-center gap-2 rounded-full
                bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground
                transition-transform hover:scale-[1.03]
                max-lg:bg-white max-lg:text-primary
              "
            >
              Know More About Us
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Image */}
        <div className="relative min-h-[240px] max-lg:min-h-[500px]">
          <Image
            src="/lifestyle/ingredients.png"
            alt="Assortment of natural Indian ingredients, grains, lentils and spices in wooden bowls"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />

          {/* Mobile dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/20 to-transparent lg:hidden" />
        </div>

      </div>
    </section>
  )
}