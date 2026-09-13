'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandLogo } from '@/components/brand-logo'
import { WhatsAppIcon } from '@/components/whatsapp-icon'
import { WHATSAPP_URL } from '@/lib/site'
import { cn } from '@/lib/utils'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M14 8.5V7c0-.8.2-1.2 1.3-1.2H17V3h-2.6C11.6 3 10.6 4.6 10.6 7v1.5H8.5V11h2.1v10H14v-10h2.3l.4-2.5H14Z" />
    </svg>
  )
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8ZM9.6 15.7V8.3l6.4 3.7-6.4 3.7Z" />
    </svg>
  )
}

const SOCIALS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/tenoo.ventures/',
    icon: InstagramIcon,
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61594267881063',
    icon: FacebookIcon,
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@Tenoo.ventures',
    icon: YoutubeIcon,
  },
]

const FOOTER_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Our Products', href: '/products' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'FAQs', href: '/faq' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
]

export function SiteFooter() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '#') return false

    if (href === '/products') {
      return pathname === '/products' || pathname.startsWith('/products/')
    }

    return pathname === href
  }

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">

        {/* MAIN FOOTER */}
        <div className="grid gap-10 md:grid-cols-3 lg:gap-14">

          {/* BRAND */}
          <div>
            <BrandLogo tone="light" />

            <div className="mt-2 space-y-0.5 text-[10px] leading-4 text-primary-foreground/60">
             
              <p>FSSAI No.: 22426590000330</p>
            </div>
          </div>

          {/* FOOTER LINKS */}
          <div className="md:pl-2 lg:pl-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-primary-foreground/70">
              Explore
            </h3>

            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5">
              {FOOTER_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className={cn(
                      'text-sm text-primary-foreground/85 transition-colors hover:text-primary-foreground',
                      isActive(link.href) && 'text-[#8fbd24]'
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* SOCIAL + CONTACT */}
          <div className="md:pl-4 lg:pl-8">

            <h3 className="text-sm font-bold uppercase tracking-wide text-primary-foreground/70">
              Follow Us
            </h3>

            <div className="mt-4 flex items-center gap-3">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/10 text-primary-foreground transition-colors hover:bg-primary-foreground/20"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>

            <div className="mt-7">
              <h3 className="text-sm font-bold uppercase tracking-wide text-primary-foreground/70">
                Get in Touch
              </h3>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm text-primary-foreground/85 transition-colors hover:text-primary-foreground"
              >
                <WhatsAppIcon className="h-5 w-5 text-leaf" />
                Chat with us on WhatsApp
              </a>
            </div>

          </div>

        </div>

        {/* BOTTOM */}
        <div className="mt-8 border-t border-primary-foreground/15 pt-5 text-center text-xs text-primary-foreground/70">
  <p>© 2026 Tenoo Ventures. All Rights Reserved.</p>
</div>

      </div>
    </footer>
  )
}