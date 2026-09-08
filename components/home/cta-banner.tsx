export function CtaBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <div className="rounded-3xl bg-primary px-5 py-8 text-center md:px-12 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-leaf md:text-sm">
          Made for every generation
        </p>

        <h2 className="mt-2 font-serif text-3xl font-bold leading-tight text-white md:mt-3 md:text-5xl">
          Good food for every generation.
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-5 text-white/75 md:mt-5 md:text-lg md:leading-relaxed">
          From growing years to everyday wellness, TENOO brings familiar
          Indian goodness into modern life.
        </p>

        <div className="mx-auto mt-5 max-w-4xl border-t border-white/10 pt-4 md:mt-10 md:grid md:grid-cols-3 md:gap-8 md:pt-8">

          {/* 01 */}
          <div className="pb-4 md:pb-0">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-leaf md:text-sm">
              01
            </p>

            <h3 className="mt-1 font-serif text-lg font-semibold text-white md:mt-2 md:text-xl">
              Growing Years
            </h3>

            <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-white/65 md:mt-2 md:text-sm md:leading-relaxed">
              Thoughtfully crafted nourishment for little ones.
            </p>
          </div>

          {/* 02 */}
          <div className="border-t border-white/10 py-4 md:border-t-0 md:py-0">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-leaf md:text-sm">
              02
            </p>

            <h3 className="mt-1 font-serif text-lg font-semibold text-white md:mt-2 md:text-xl">
              Family Everyday
            </h3>

            <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-white/65 md:mt-2 md:text-sm md:leading-relaxed">
              Simple food choices for busy family life.
            </p>
          </div>

          {/* 03 */}
          <div className="border-t border-white/10 pt-4 md:border-t-0 md:pt-0">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-leaf md:text-sm">
              03
            </p>

            <h3 className="mt-1 font-serif text-lg font-semibold text-white md:mt-2 md:text-xl">
              Everyday Wellness
            </h3>

            <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-white/65 md:mt-2 md:text-sm md:leading-relaxed">
              Traditional ingredients made convenient for today.
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}