import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function Story() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-5 md:px-8">
      <div className="grid items-stretch overflow-hidden rounded-3xl bg-beige/70 lg:grid-cols-2">

        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">

          <p className="text-sm font-bold uppercase tracking-[0.2em] text-terracotta">
            Our Story
          </p>

          <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-primary text-balance sm:text-4xl">
            Traditional Roots. <br />
            Modern Everyday Food.
          </h2>

          <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            At Tenoo, we bring the goodness of Indian food traditions into your
            daily life with clean ingredients, thoughtful nutrition and real
            taste.
          </p>

          <div className="mt-6">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
            >
              Know More About Us
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        </div>

        <div className="relative min-h-[240px]">
          <Image
            src="/lifestyle/ingredients.png"
            alt="Assortment of natural Indian ingredients, grains, lentils and spices in wooden bowls"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

      </div>
    </section>
  )
}