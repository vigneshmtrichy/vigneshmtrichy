import { Truck, MapPin, ShieldCheck } from 'lucide-react'

const ITEMS = [
  {
    icon: Truck,
    title: 'Free Shipping',
    desc: 'On orders above ₹699',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Payments',
    desc: 'Safe & secure online checkout',
  },
  {
    icon: MapPin,
    title: 'Made in India',
    desc: 'Proudly made for you',
  },
]

export function TrustBar() {
  return (
    <section className="border-y border-border/60 bg-card/50">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 md:grid-cols-3 md:px-8 md:divide-x md:divide-border/60">

        {ITEMS.map((item) => (
          <div
            key={item.title}
            className="flex items-center justify-center gap-3 md:px-5"
          >
            <item.icon className="h-6 w-6 text-leaf" />

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-primary">
                {item.title}
              </h3>

              <p className="text-xs text-muted-foreground sm:text-sm">
                {item.desc}
              </p>
            </div>
          </div>
        ))}

      </div>
    </section>
  )
}