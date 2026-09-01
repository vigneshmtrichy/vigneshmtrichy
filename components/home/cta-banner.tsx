import Image from 'next/image'
import { WhatsAppIcon } from '@/components/whatsapp-icon'
import { WHATSAPP_URL } from '@/lib/site'

export function CtaBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 md:px-8">
      <div className="relative isolate flex items-center justify-between gap-4 overflow-hidden rounded-3xl bg-primary px-6 py-8 text-center text-primary-foreground sm:px-10">
        <div className="relative hidden h-32 w-40 shrink-0 sm:block">
          <Image
            src="/lifestyle/cta-bowl.png"
            alt="Bowl of porridge topped with nuts"
            fill
            sizes="160px"
            className="object-contain"
          />
        </div>

        <div className="mx-auto max-w-xl">
          <h2 className="font-serif text-2xl font-bold text-balance sm:text-3xl">
            Discover Your Tenoo Favourite.
          </h2>
          <p className="mt-2 text-sm text-primary-foreground/80">
            Good food choices today. Better generations tomorrow.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-terracotta px-6 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Chat with us on WhatsApp
          </a>
        </div>

        <div className="relative hidden h-32 w-40 shrink-0 sm:block">
          <Image
            src="/lifestyle/cta-bowl-2.png"
            alt="Bowl of yogurt topped with fresh berries"
            fill
            sizes="160px"
            className="object-contain"
          />
        </div>
      </div>
    </section>
  )
}
