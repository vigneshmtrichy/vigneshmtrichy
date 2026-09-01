'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Menu, X } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { WhatsAppIcon } from '@/components/whatsapp-icon'
import { NAV_LINKS, WHATSAPP_URL } from '@/lib/site'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <BrandLogo />

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'group inline-flex items-center gap-1 text-sm font-semibold text-foreground/80 transition-colors hover:text-primary',
                link.label === 'Home' && 'text-primary',
              )}
            >
              {link.label}
              {link.label === 'Our Products' ? (
                <ChevronDown className="h-4 w-4 opacity-70" />
              ) : null}
              {link.label === 'Home' ? (
                <span className="sr-only">(current page)</span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.03] sm:inline-flex"
          >
            <WhatsAppIcon className="h-4 w-4" />
            WhatsApp Us
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-primary lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          className="border-t border-border/60 bg-background px-4 py-4 lg:hidden"
          aria-label="Mobile navigation"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-base font-semibold text-foreground/80 hover:bg-secondary hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-2">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp Us
              </a>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  )
}
