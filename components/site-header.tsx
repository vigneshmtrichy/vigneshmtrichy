'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, Search } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { WhatsAppIcon } from '@/components/whatsapp-icon'
import { NAV_LINKS, WHATSAPP_URL, ALL_PRODUCTS } from '@/lib/site'
import { cn } from '@/lib/utils'
import { CartButton } from '@/components/cart/cart-button'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const pathname = usePathname()

  const searchResults =
    search.trim().length > 0
      ? ALL_PRODUCTS.filter((product) =>
          `${product.name} ${product.tagline ?? ''}`
            .toLowerCase()
            .includes(search.trim().toLowerCase()),
        ).slice(0, 5)
      : []

  const closeMobileMenu = () => {
    setOpen(false)
    setSearchOpen(false)
    setSearch('')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-md">

      {/* =========================================================
          DESKTOP / TABLET TOP ROW
          ========================================================= */}
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-1 md:px-8 md:py-2">

        <BrandLogo />

        {/* Desktop Search */}
        <div className="relative ml-auto hidden max-w-2xl flex-1 lg:block">
          <div className="flex h-11 items-center overflow-hidden rounded-full border border-border bg-background">
            <Search className="ml-4 h-4 w-4 shrink-0 text-muted-foreground" />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Search products"
            />
          </div>

          {search.trim() && (
            <div className="absolute left-0 right-0 top-13 overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
              {searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((product) => (
                    <Link
                      key={product.slug}
                      href={`/products/${product.slug}`}
                      onClick={() => setSearch('')}
                      className="block px-5 py-3 transition-colors hover:bg-secondary"
                    >
                      <p className="text-sm font-semibold text-primary">
                        {product.name}
                      </p>

                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {product.tagline}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="px-5 py-4 text-sm text-muted-foreground">
                  No products found.
                </p>
              )}
            </div>
          )}
        </div>
        {/* Desktop Cart */}
          <div className="hidden lg:inline-flex">
                <CartButton />
          </div>
        {/* Desktop WhatsApp */}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.03] sm:inline-flex lg:inline-flex"
        >
          <WhatsAppIcon className="h-4 w-4" />
          WhatsApp Us
        </a>

        {/* =========================================================
            MOBILE CONTROLS
            ========================================================= */}
{/* Mobile Cart */}
<div className="lg:hidden">
  <CartButton />
</div>
        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={() => {
            setSearchOpen((value) => !value)
            setOpen(false)
          }}
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-secondary lg:hidden"
          aria-label={searchOpen ? 'Close search' : 'Search products'}
          aria-expanded={searchOpen}
        >
          {searchOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </button>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => {
            setOpen((value) => !value)
            setSearchOpen(false)
          }}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-secondary lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* =========================================================
          MOBILE SEARCH
          ========================================================= */}
      {searchOpen && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3 lg:hidden">
          <div className="relative">
            <div className="flex h-12 items-center overflow-hidden rounded-full border border-border bg-background">
              <Search className="ml-4 h-4 w-4 shrink-0 text-muted-foreground" />

              <input
                type="search"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-base text-foreground outline-none placeholder:text-muted-foreground"
                aria-label="Search products"
              />
            </div>

            {search.trim() && (
              <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((product) => (
                      <Link
                        key={product.slug}
                        href={`/products/${product.slug}`}
                        onClick={() => {
                          setSearch('')
                          setSearchOpen(false)
                        }}
                        className="block px-4 py-3.5 transition-colors hover:bg-secondary"
                      >
                        <p className="text-sm font-semibold text-primary">
                          {product.name}
                        </p>

                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {product.tagline}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-4 text-sm text-muted-foreground">
                    No products found.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          DESKTOP NAVIGATION
          ========================================================= */}
      <div className="hidden border-t border-border/50 lg:block">
        <nav
          className="mx-auto flex max-w-7xl items-center justify-center gap-10 px-8 py-1"
          aria-label="Main navigation"
        >
          {NAV_LINKS.map((link) => {
            const isProductsActive =
              link.href === '/products'
                ? pathname === '/products' ||
                  pathname.startsWith('/products/')
                : pathname === link.href

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'group inline-flex items-center gap-1 text-sm font-semibold text-foreground/80 transition-colors hover:text-primary',
                  isProductsActive && 'text-[#8fbd24]',
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* =========================================================
          MOBILE MENU
          ========================================================= */}
      {open && (
        <nav
          className="border-t border-border/60 bg-background px-4 pb-5 pt-3 lg:hidden"
          aria-label="Mobile navigation"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const isProductsActive =
                link.href === '/products'
                  ? pathname === '/products' ||
                    pathname.startsWith('/products/')
                  : pathname === link.href

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      'flex min-h-11 items-center rounded-xl px-4 py-2.5 text-[15px] font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-primary',
                      isProductsActive &&
                        'bg-[#edf3dc] text-[#7fb51b]',
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}

            <li className="mt-3 border-t border-border/50 pt-4">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm"
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp Us
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}