export function CtaBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <div className="rounded-3xl bg-primary px-6 py-12 text-center md:px-12 md:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-leaf">
          Made for every generation
        </p>

        <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-white md:text-5xl">
          Good food for every generation.
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
          From growing years to everyday wellness, TENOO brings familiar
          Indian goodness into modern life.
        </p>

        <div className="mx-auto mt-10 grid max-w-4xl gap-8 border-t border-white/10 pt-8 sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-leaf">
              01
            </p>
            <h3 className="mt-2 font-serif text-xl font-semibold text-white">
              Growing Years
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              Thoughtfully crafted nourishment for little ones.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-leaf">
              02
            </p>
            <h3 className="mt-2 font-serif text-xl font-semibold text-white">
              Family Everyday
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              Simple food choices for busy family life.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-leaf">
              03
            </p>
            <h3 className="mt-2 font-serif text-xl font-semibold text-white">
              Everyday Wellness
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              Traditional ingredients made convenient for today.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}