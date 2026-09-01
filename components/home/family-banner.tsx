import Image from 'next/image'
import { Utensils, HeartHandshake, Leaf, Clock } from 'lucide-react'

const VALUES = [
  {
    icon: Utensils,
    title: 'Indian Food Inspiration',
    desc: 'Rooted in our culture, made for today.',
  },
  {
    icon: HeartHandshake,
    title: 'Made with Care',
    desc: 'Hygienic, safe and high quality.',
  },
  {
    icon: Leaf,
    title: 'Thoughtfully Selected Ingredients',
    desc: 'Only the best nature has to offer.',
  },
  {
    icon: Clock,
    title: 'Easy for Everyday Life',
    desc: 'Quick to make, easy to love.',
  },
]

export function FamilyBanner() {
  return (
    <section aria-labelledby="family-heading">

      <div className="relative isolate h-[420px] overflow-hidden sm:h-[500px]">

        {/* Soft background fill */}
        <Image
          src="/lifestyle/family.png"
          alt=""
          fill
          aria-hidden="true"
          className="scale-110 object-cover blur-2xl opacity-30"
        />

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/75 to-primary/20" />

        {/* Full family photo — NOT cropped */}
        <div className="absolute inset-y-0 right-0 w-full sm:w-[62%]">
          <Image
            src="/lifestyle/family.png"
            alt="Three generations of a family sharing a warm meal together"
            fill
            className="object-contain object-center"
          />
        </div>

        {/* Text */}
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-7xl px-6 md:px-8">
            <div className="max-w-md text-primary-foreground">

              <h2
                id="family-heading"
                className="font-serif text-3xl font-bold leading-tight text-balance sm:text-4xl"
              >
                Good food brings generations together.
              </h2>

              <div className="mt-3 h-px w-20 bg-primary-foreground/40" />

              <p className="mt-3 text-sm leading-relaxed text-primary-foreground/90 sm:text-base">
                Wholesome ingredients, time-honoured recipes and nutritious
                blends for every stage of life.
              </p>

            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div key={v.title} className="flex items-start gap-3">

              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-peach text-terracotta">
                <v.icon className="h-5 w-5" />
              </span>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-primary">
                  {v.title}
                </h3>

                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {v.desc}
                </p>
              </div>

            </div>
          ))}
        </div>
      </div>

    </section>
  )
}