import Image from 'next/image'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ScrollReveal } from '@/components/scroll-reveal'

export default function AboutPage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* =====================================================
            HERO
            ===================================================== */}
        <ScrollReveal>
          <section className="px-5 pb-14 pt-2 md:px-10 md:pb-16 md:pt-4">
            <div className="mx-auto max-w-6xl text-center">
              <Image
                src="/about-hero.png"
                alt="About Tenoo — Good Food. Made with Purpose."
                width={2048}
                height={768}
                priority
                className="mx-auto h-auto w-full object-contain scale-[1.4] lg:scale-100"
              />
            </div>
          </section>
        </ScrollReveal>

        {/* =====================================================
            OUR STORY
            ===================================================== */}
        <ScrollReveal delay={80}>
          <section className="bg-primary px-5 py-12 text-primary-foreground md:px-10 md:py-18">
            <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 md:items-center md:gap-16">

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  OUR STORY
                </p>

                <h2 className="mt-3 font-serif text-4xl font-bold leading-tight md:text-5xl">
                  A simple thought.
                  <br />
                  A meaningful beginning.
                </h2>
              </div>

              <div className="space-y-4 text-sm leading-7 text-primary-foreground/75 md:text-base">
                <p>
                  TENOO began with a simple thought — good food doesn’t have
                  to be complicated.
                </p>

                <p>
                  India has always had a beautiful food culture built around
                  grains, millets, nuts, seeds, fruits, vegetables and
                  traditional ingredients. But in today’s busy life, many of
                  these familiar foods are becoming less convenient to prepare
                  and include in our everyday routines.
                </p>

                <p>
                  That is where TENOO began.
                </p>

                <p>
                  We wanted to bring the goodness of thoughtfully chosen
                  Indian ingredients into simple, convenient food products
                  that families can enjoy in their everyday lives.
                </p>
              </div>

            </div>
          </section>
        </ScrollReveal>

        {/* =====================================================
            ROOTED IN TRADITION
            ===================================================== */}
        <ScrollReveal delay={80}>
          <section className="px-5 py-12 md:px-10 md:py-18">
            <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 md:items-center md:gap-16">

              <div className="relative overflow-hidden rounded-3xl bg-muted">
                <div className="relative aspect-[4/3]">
                  <Image
                    src="/lifestyle/family.png"
                    alt="Family enjoying time together"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  ROOTED IN TRADITION
                </p>

                <h2 className="mt-3 font-serif text-4xl font-bold leading-tight text-primary md:text-5xl">
                  Rooted in tradition.
                  <br />
                  Made for today.
                </h2>

                <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground md:text-base">
                  <p>
                    TENOO is inspired by the food wisdom that has always been
                    part of Indian homes, while being designed for the way
                    families live today.
                  </p>

                  <p>
                    We believe good food should feel familiar, honest and
                    easy to enjoy.
                  </p>

                  <p>
                    That belief guides everything we do — from the ingredients
                    we choose to the products we create.
                  </p>
                </div>
              </div>

            </div>
          </section>
        </ScrollReveal>

        {/* =====================================================
            OUR BELIEF
            ===================================================== */}
        <ScrollReveal delay={80}>
          <section className="bg-muted/40 px-5 py-12 md:px-10 md:py-16">
            <div className="mx-auto max-w-4xl text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                WHAT WE BELIEVE
              </p>

              <h2 className="mt-3 font-serif text-4xl font-bold leading-tight text-primary md:text-6xl">
                Good food should fit
                <br />
                into real life.
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base md:leading-8">
                We don’t believe wholesome food belongs to just one age
                group. From little ones to parents and grandparents, TENOO
                is created to bring thoughtful food choices to every
                generation.
              </p>

            </div>
          </section>
        </ScrollReveal>

        {/* =====================================================
            FOR EVERY GENERATION
            ===================================================== */}
        <ScrollReveal delay={80}>
          <section className="px-5 py-12 md:px-10 md:py-18">
            <div className="mx-auto max-w-6xl">

              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  MADE FOR EVERY GENERATION
                </p>

                <h2 className="mt-3 font-serif text-4xl font-bold text-primary md:text-5xl">
                  One brand. Every generation.
                </h2>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">

                <ScrollReveal delay={0}>
                  <div className="rounded-3xl border border-border bg-card p-6 md:p-7">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                      LITTLE ONES
                    </p>

                    <h3 className="mt-3 font-serif text-2xl font-bold text-primary">
                      Growing years matter.
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      Thoughtfully crafted food choices designed to make
                      everyday nourishment simpler for growing families.
                    </p>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={120}>
                  <div className="rounded-3xl border border-border bg-card p-6 md:p-7">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                      FAMILIES
                    </p>

                    <h3 className="mt-3 font-serif text-2xl font-bold text-primary">
                      Everyday food, made easier.
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      Convenient food products inspired by familiar Indian
                      ingredients and everyday family needs.
                    </p>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={240}>
                  <div className="rounded-3xl border border-border bg-card p-6 md:p-7">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                      ADULTS
                    </p>

                    <h3 className="mt-3 font-serif text-2xl font-bold text-primary">
                      Goodness for everyday living.
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      Traditional-inspired food products created for simple,
                      thoughtful everyday choices.
                    </p>
                  </div>
                </ScrollReveal>

              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* =====================================================
            OUR PROMISE
            ===================================================== */}
        <ScrollReveal delay={80}>
          <section className="px-5 py-14 md:px-10 md:py-20">
            <div className="mx-auto max-w-5xl text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                Our Promise
              </p>

              <h2 className="mt-4 font-serif text-5xl font-bold leading-[0.95] text-primary md:text-6xl lg:text-7xl">
                Keep it simple.
                <br />
                <span className="text-accent">Keep it meaningful.</span>
              </h2>

              <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                Every TENOO product begins with the same intention — choose meaningful
                ingredients, create thoughtfully, and make good food easier to bring
                into everyday life.
              </p>

              <p className="mt-10 font-serif text-2xl font-bold text-primary md:text-3xl">
                Good Food. Made for Every Generation.
              </p>

            </div>
          </section>
        </ScrollReveal>

      </main>

      <SiteFooter />
    </>
  )
}