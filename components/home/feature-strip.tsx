import { Leaf, Sparkles, Ban, Droplet } from 'lucide-react'

const FEATURES = [
  {
    icon: Leaf,
    title: 'Natural Goodness',
    desc: 'Naturally sourced ingredients',
    bg: 'bg-leaf/15',
    fg: 'text-leaf',
  },
  {
    icon: Sparkles,
    title: 'Clean Ingredients',
    desc: 'Simple & honest ingredients',
    bg: 'bg-peach',
    fg: 'text-terracotta',
  },
  {
    icon: Ban,
    title: 'Everyday Nutrition',
    desc: 'Thoughtfully crafted for everyday nourishment',
    bg: 'bg-leaf/15',
    fg: 'text-leaf',
  },
  {
    icon: Droplet,
    title: 'Made for Families',
    desc: 'Made for little ones & families',
    bg: 'bg-peach',
    fg: 'text-terracotta',
  },
]

export function FeatureStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-4 md:px-8">
      <div
        className="
          grid grid-cols-2 gap-y-5 gap-x-3
          rounded-2xl border border-border/70 bg-card
          px-3 py-4

          sm:grid-cols-2
          lg:grid-cols-4
          lg:divide-x lg:divide-border/70
          lg:gap-y-0
          lg:px-4
        "
      >
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="
              flex items-start gap-2.5 px-1
              sm:gap-3 sm:px-2
              lg:items-center lg:px-5
            "
          >
            <span
              className={`
                inline-flex h-9 w-9 shrink-0 items-center justify-center
                rounded-full
                sm:h-10 sm:w-10
                ${f.bg} ${f.fg}
              `}
            >
              <f.icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </span>

            <div className="min-w-0">
              <h3
                className="
                  text-[11px] font-bold uppercase tracking-wide text-primary
                  sm:text-sm
                "
              >
                {f.title}
              </h3>

              <p
                className="
                  mt-0.5 text-[10px] leading-4 text-muted-foreground
                  sm:text-sm sm:leading-normal
                "
              >
                {f.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}