import Image from 'next/image'
import { Utensils, HeartHandshake, Leaf, Clock } from 'lucide-react'



export function FamilyBanner() {
  return (
    <section aria-labelledby="family-heading" className="px-4 md:px-8">

      {/* Premium Family Banner */}
      <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-primary shadow-sm">

        {/* Background image */}
        <Image
          src="/lifestyle/family.png"
          alt=""
          fill
          aria-hidden="true"
          className="scale-105 object-cover opacity-10 blur-xl"
        />

        {/* Main layout */}
        <div className="relative grid min-h-[430px] lg:grid-cols-[42%_58%]">

          {/* Text panel */}
          <div className="relative z-10 flex items-center px-8 py-14 sm:px-12 lg:px-14 xl:px-16">

            {/* Subtle vertical accent */}
            <div className="absolute left-0 top-1/2 hidden h-28 w-px -translate-y-1/2 bg-lime-400/50 lg:block" />

            <div className="max-w-lg text-primary-foreground">

              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-lime-400">
                Made for Every Generation
              </p>

              <h2
                id="family-heading"
                className="font-serif text-3xl font-bold leading-[1.12] sm:text-4xl"
              >
                Good food brings
                <br />
                generations together.
              </h2>

              <div className="my-6 h-px w-14 bg-primary-foreground/30" />

              <p className="max-w-md text-sm leading-7 text-primary-foreground/75 sm:text-base sm:leading-8">
                Wholesome ingredients, time-honoured recipes and nutritious
                blends for every stage of life.
              </p>

            </div>
          </div>

          {/* Family image */}
          <div className="relative min-h-[300px] lg:min-h-[430px]">

            <Image
              src="/lifestyle/family.png"
              alt="Three generations of a family sharing a warm meal together"
              fill
              className="object-cover"
            />

            {/* Soft blend between text and image */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-primary/40 to-transparent lg:w-32" />

          </div>

        </div>
      </div>

     

    </section>
  )
}