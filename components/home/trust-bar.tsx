import { Truck, MapPin } from 'lucide-react'
import { WhatsAppIcon } from '@/components/whatsapp-icon'

const ITEMS = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹999' },
  {
    icon: WhatsAppIcon,
    title: 'Easy WhatsApp Orders',
    desc: 'Simple & convenient ordering',
  },
  { icon: MapPin, title: 'Made in India', desc: 'Proudly made for you' },
]

export function TrustBar() {
  return (
    <section className="border-y border-border/60 bg-card/50">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-3 md:px-8 md:divide-x md:divide-border/60">
        {ITEMS.map((item) => (
          <div
            key={item.title}
            className="flex items-center justify-center gap-3 md:px-6"
          >
            <item.icon className="h-7 w-7 text-leaf" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-primary">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
