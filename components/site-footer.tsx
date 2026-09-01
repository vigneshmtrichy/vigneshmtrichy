import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { WhatsAppIcon } from '@/components/whatsapp-icon'
import { WHATSAPP_URL } from '@/lib/site'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M14 8.5V7c0-.8.2-1.2 1.3-1.2H17V3h-2.6C11.6 3 10.6 4.6 10.6 7v1.5H8.5V11h2.1v10H14v-10h2.3l.4-2.5H14Z" />
    </svg>
  )
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M22 8.2a3 3 0 0 0-2.1-2.1C18 5.5 12 5.5 12 5.5s-6 0-7.9.6A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.9.6 7.9.6 7.9.6s6 0 7.9-.6a3 3 0 0 0 2.1-2.1c.3-1.2.4-2.5.4-3.8s-.1-2.6-.4-3.8ZM10 15V9l5.2 3L10 15Z" />
    </svg>
  )
}

const SOCIALS = [InstagramIcon, FacebookIcon, YoutubeIcon]

const COLUMNS = [
  {
    title: 'Shop',
    links: ['All Products', 'Kids & Family', 'Adults & Wellness'],
  },
  {
    title: 'Company',
    links: ['About Us', 'Our Story', 'Ingredients', 'Blog'],
  },
  {
    title: 'Help',
    links: ['Shipping & Delivery', 'Returns & Refunds', 'FAQs', 'Contact Us'],
  },
]

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <BrandLogo tone="light" />
            <div className="mt-5 flex items-center gap-3">
              {SOCIALS.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/10 text-primary-foreground transition-colors hover:bg-primary-foreground/20"
                  aria-label="Social media"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-primary-foreground/70">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-primary-foreground/85 transition-colors hover:text-primary-foreground"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-primary-foreground/70">
              Get in Touch
            </h3>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-primary-foreground/85 transition-colors hover:text-primary-foreground"
            >
              <WhatsAppIcon className="h-5 w-5 text-leaf" />
              Chat with us on WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-primary-foreground/15 pt-5 text-xs text-primary-foreground/70 md:flex-row md:items-center">
          <p>© 2025 Tenoo. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-primary-foreground">
              Terms &amp; Conditions
            </Link>
            <span aria-hidden="true">|</span>
            <Link href="#" className="hover:text-primary-foreground">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
