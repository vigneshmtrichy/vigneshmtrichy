import { Leaf, Sparkles, Ban, Droplet } from 'lucide-react'

const FEATURES = [
  {
    icon: Leaf,
    title: '100% Natural',
    desc: 'No artificial additives or preservatives',
    bg: 'bg-leaf/15',
    fg: 'text-leaf',
  },
  {
    icon: Sparkles,
    title: 'Clean Label',
    desc: 'Simple & honest ingredients',
    bg: 'bg-peach',
    fg: 'text-terracotta',
  },
  {
    icon: Ban,
    title: 'Zero Refined Sugar',
    desc: 'Naturally sweet, naturally better',
    bg: 'bg-leaf/15',
    fg: 'text-leaf',
  },
  {
    icon: Droplet,
    title: 'No Palm Oil',
    desc: 'Good for you, good for nature',
    bg: 'bg-peach',
    fg: 'text-terracotta',
  },
]

export function FeatureStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 md:px-8">
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-border/70 bg-card px-4 py-6 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border/70">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex items-center gap-4 px-2 lg:px-6">
            <span
              className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${f.bg} ${f.fg}`}
            >
              <f.icon className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-primary">
                {f.title}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
