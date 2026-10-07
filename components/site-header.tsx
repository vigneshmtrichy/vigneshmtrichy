'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, Search, User, ChevronDown } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { NAV_LINKS, ALL_PRODUCTS } from '@/lib/site'
import { cn } from '@/lib/utils'
import { CartButton } from '@/components/cart/cart-button'
import { AnnouncementBar } from '@/components/announcement-bar'
import { supabase } from '@/lib/supabase'


export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [hiddenProductSlugs, setHiddenProductSlugs] = useState<Set<string>>(new Set())
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const updateHeaderHeight = () => {
      const height = headerRef.current?.getBoundingClientRect().height ?? 0
      document.documentElement.style.setProperty('--tenoo-site-header-height', `${height}px`)
    }

    updateHeaderHeight()
    const observer = new ResizeObserver(updateHeaderHeight)
    if (headerRef.current) observer.observe(headerRef.current)
    window.addEventListener('resize', updateHeaderHeight)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateHeaderHeight)
      document.documentElement.style.removeProperty('--tenoo-site-header-height')
    }
  }, [])
  const [user, setUser] = useState<any>(null)
  const [adminOpen, setAdminOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const headerRef = useRef<HTMLElement | null>(null)
const isAdminPage = pathname.startsWith('/admin')

useEffect(() => {
  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    setUser(user)
  }

  loadUser()

  const loadHiddenProducts = async () => {
    const { data, error } = await supabase
      .from('product_status')
      .select('product_slug, status')

    if (error) {
      console.error('Failed to load product visibility for search:', error)
      return
    }

    setHiddenProductSlugs(
      new Set(
        (data || [])
          .filter((item) => item.status === 'hidden')
          .map((item) => item.product_slug),
      ),
    )
  }

  loadHiddenProducts()

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null)
  })

  return () => subscription.unsubscribe()
}, [])

  const visibleSearchProducts = ALL_PRODUCTS.filter(
    (product) => !hiddenProductSlugs.has(product.slug),
  )

  const searchResults =
    search.trim().length > 0
      ? visibleSearchProducts.filter((product) =>
          `${product.name} ${product.tagline ?? ''}`
            .toLowerCase()
            .includes(search.trim().toLowerCase()),
        ).slice(0, 5)
      : visibleSearchProducts.slice(0, 5)

  const showSearchSuggestions =
    !isAdminPage && searchFocused


  const closeMobileMenu = () => {
    setOpen(false)
    setSearchOpen(false)
    setSearch('')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('tenoo-cart')
    window.location.href = '/'
  }

  return (
      <>
    {!isAdminPage && <AnnouncementBar />}
    <header
      ref={headerRef}
      onClickCapture={(event) => {
        const target = event.target as HTMLElement
        const link = target.closest('a')

        if (link?.getAttribute('href') === '/') {
          sessionStorage.setItem('tenoo-internal-home', '1')
        }
      }}
      className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-md"
    >
      {/* =========================================================
          DESKTOP / TABLET TOP ROW
          ========================================================= */}
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-1 md:px-8 md:py-2">

        <BrandLogo />

        {/* Desktop Search */}
        {!isAdminPage && (
        <div className="relative z-50 ml-auto hidden max-w-2xl flex-1 lg:block">
          <div className="flex h-11 items-center overflow-hidden rounded-full border border-border bg-background">
            <Search className="ml-4 h-4 w-4 shrink-0 text-muted-foreground" />

            <input
              type="search"
              value={search}
             onChange={(e) => {
  const value = e.target.value
  setSearch(value)

  if (isAdminPage) {
    const query = value.trim()

    router.replace(
      query
        ? `/admin/orders?search=${encodeURIComponent(query)}`
        : '/admin/orders',
      { scroll: false }
    )
  }
}}
              placeholder={
                isAdminPage
                  ? 'Search order ID, name, phone, email or tracking number...'
                  : 'Search products...'
              }
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {
                window.setTimeout(() => setSearchFocused(false), 150)
              }}
              aria-label={isAdminPage ? 'Search orders' : 'Search products'}
            />
          </div>

          {showSearchSuggestions && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
              {searchResults.length > 0 ? (
                <div className="py-2">
                  {!search.trim() && (
                    <p className="px-5 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Explore our products
                    </p>
                  )}
                  {searchResults.map((product) => (
                    <a
                      key={product.slug}
                      href={`/products/${product.slug}`}
                      onPointerDown={(event) => {
                        if (event.button === 0) {
                          window.location.assign(`/products/${product.slug}`)
                        }
                      }}
                      className="block cursor-pointer px-5 py-3 transition-colors hover:bg-secondary"
                    >
                      <p className="text-sm font-semibold text-primary">
                        {product.name}
                      </p>

                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {product.tagline}
                      </p>
                    </a>
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
        )}

        {/* Desktop Cart */}
        {!isAdminPage && (
          <div className="hidden lg:inline-flex">
            <CartButton />
          </div>
        )}
          {/* Desktop Account */}
{user ? (
  <>
    {user?.email === 'info@tenoo.in' ? (
      isAdminPage ? (
        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Admin navigation"
        >
          {[
            { href: '/admin', label: 'Dashboard' },
            { href: '/admin/orders', label: 'Online Orders' },
            { href: '/admin/products', label: 'Products' },
            { href: '/admin/retailers', label: 'Retailers' },
            { href: '/admin/retailer-orders', label: 'Retailer Orders' },
            { href: '/admin/expenses', label: 'GST / Expenses' },
            { href: '/admin/gst-reports', label: 'GST Reports' },
            { href: '/admin/manufacturers', label: 'Manufacturers' },
          ].map((link) => {
            const active =
              link.href === '/admin'
                ? pathname === '/admin'
                : pathname === link.href || pathname.startsWith(`${link.href}/`)

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'inline-flex items-center rounded-full px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 ease-out hover:scale-105 hover:bg-secondary hover:shadow-md active:scale-[0.98]',
                  active
                    ? 'bg-[#edf3dc] text-[#7fb51b]'
                    : 'text-foreground/80',
                )}
              >
                {link.label}
              </Link>
            )
          })}

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center rounded-full px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-all duration-200 ease-out hover:scale-105 hover:bg-red-50 hover:shadow-md active:scale-[0.98]"
          >
            🚪 Logout
          </button>
        </nav>
      ) : (
        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/admin"
            className="inline-flex items-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 ease-out hover:scale-105 hover:bg-secondary hover:shadow-md active:scale-[0.98]"
          >
            Admin
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center rounded-full px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-all duration-200 ease-out hover:scale-105 hover:bg-red-50 hover:shadow-md active:scale-[0.98]"
          >
            🚪 Logout
          </button>
        </div>
      )
    ) : (
      <div className="relative hidden lg:block">
        <button
          type="button"
          onClick={() => setAccountOpen((value) => !value)}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
        >
          Hi,{' '}
          {user?.user_metadata?.full_name ||
            user?.user_metadata?.name ||
            'Customer'}

          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              accountOpen && 'rotate-180',
            )}
          />
        </button>

        {accountOpen && (
          <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-border bg-background p-1.5 shadow-xl">
            <Link
              href="/account/orders"
              onClick={() => setAccountOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              📦 My Orders
            </Link>
            <Link
              href="/account/profile"
              onClick={() => setAccountOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              👤 My Account
            </Link>
            <Link
              href="/account/help"
              onClick={() => setAccountOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              💬 Help & Support
            </Link>
            <div className="my-1 border-t border-border/60" />
            <button
              type="button"
              onClick={async () => {
                setAccountOpen(false)
                await handleLogout()
              }}
              className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    )}
  </>
) : (
  <Link
    href="/login"
    className="hidden items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 ease-out hover:scale-105 hover:bg-secondary hover:shadow-md active:scale-[0.98] lg:inline-flex"
  >
    <User className="h-4 w-4" />
    Login
  </Link>
)}
        {/* =========================================================
            MOBILE CONTROLS
            ========================================================= */}
        {/* Mobile Cart */}
        {!isAdminPage && (
          <div className="lg:hidden">
            <CartButton />
          </div>
        )}

          

        {!isAdminPage && (
        <>
        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={() => {
            setSearchOpen((value) => !value)
            setOpen(false)
          }}
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-secondary lg:hidden"
          aria-label={
            searchOpen
              ? 'Close search'
              : isAdminPage
                ? 'Search orders'
                : 'Search products'
          }
          aria-expanded={searchOpen}
        >
          {searchOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </button>
        </>
        )}

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => {
            setOpen((value) => !value)
            setSearchOpen(false)
          }}
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-secondary lg:hidden"
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
      {!isAdminPage && searchOpen && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3 lg:hidden">
          <div className="relative">
            <div className="flex h-12 items-center overflow-hidden rounded-full border border-border bg-background">
              <Search className="ml-4 h-4 w-4 shrink-0 text-muted-foreground" />

              <input
                type="search"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  isAdminPage
                    ? 'Search order ID, name, phone...'
                    : 'Search products...'
                }
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-base text-foreground outline-none placeholder:text-muted-foreground"
                aria-label={isAdminPage ? 'Search orders' : 'Search products'}
              />
            </div>

            {!isAdminPage && (
              <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((product) => (
                      <a
                        key={product.slug}
                        href={`/products/${product.slug}`}
                      onPointerDown={(event) => {
                        if (event.button === 0) {
                          window.location.assign(`/products/${product.slug}`)
                        }
                      }}
                        className="block cursor-pointer px-4 py-3.5 transition-colors hover:bg-secondary"
                      >
                        <p className="text-sm font-semibold text-primary">
                          {product.name}
                        </p>

                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {product.tagline}
                        </p>
                      </a>
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
     {!isAdminPage && (
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
)}

      {/* =========================================================
          MOBILE MENU
          ========================================================= */}
      {open && (
        <nav
          className="border-t border-border/60 bg-background px-4 pb-5 pt-3 lg:hidden"
          aria-label="Mobile navigation"
        >
          <ul className="flex flex-col gap-1">
  {!isAdminPage && NAV_LINKS.map((link) => {
              const isProductsActive =
                link.href === '/products'
                  ? pathname === '/products' ||
                    pathname.startsWith('/products/')
                  : pathname === link.href

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
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
            {user ? (
  <>
    {user?.email === 'info@tenoo.in' ? (
      <div>
        {/* EXISTING ADMIN MOBILE MENU */}
        <button
          type="button"
          onClick={() => setAdminOpen((value) => !value)}
          className="flex min-h-11 w-full items-center justify-between rounded-xl px-4 py-2.5 text-[15px] font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-primary"
        >
          <span>Admin</span>

          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              adminOpen && 'rotate-180',
            )}
          />
        </button>

        {adminOpen && (
          <div className="ml-3 mt-1 space-y-1 border-l border-border/60 pl-3">
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-secondary hover:text-primary"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/orders"
              onClick={() => setOpen(false)}
              className="flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-secondary hover:text-primary"
            >
              Online Orders
            </Link>

            <Link
              href="/admin/products"
              onClick={() => setOpen(false)}
              className="flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-secondary hover:text-primary"
            >
              Products
            </Link>
            <Link
              href="/admin/retailers"
              onClick={() => setOpen(false)}
              className="flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-secondary hover:text-primary"
            >
              Retailers
            </Link>

            <Link
              href="/admin/retailer-orders"
              onClick={() => setOpen(false)}
              className="flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-secondary hover:text-primary"
            >
              Retailer Orders
            </Link>
            <Link
              href="/admin/expenses"
              onClick={() => setOpen(false)}
              className="flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-secondary hover:text-primary"
            >
              GST / Expenses
            </Link>
            <Link
              href="/admin/gst-reports"
              onClick={() => setOpen(false)}
              className="flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-secondary hover:text-primary"
            >
              GST Reports
            </Link>

            <Link
              href="/admin/manufacturers"
              onClick={() => setOpen(false)}
              className="flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-secondary hover:text-primary"
            >
              Manufacturers
            </Link>
          </div>
        )}

        <button
          type="button"
          onClick={async () => {
            setAdminOpen(false)
            setOpen(false)
            await handleLogout()
          }}
          className="mt-2 flex min-h-10 w-full items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          🚪 Logout
        </button>
      </div>
    ) : (
      <div>
        {/* CUSTOMER ACCOUNT */}
        <button
          type="button"
          onClick={() => setAccountOpen((value) => !value)}
          className="flex min-h-11 w-full items-center justify-between rounded-xl px-4 py-2.5 text-[15px] font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-primary"
        >
          <span>
            Hi,{' '}
            {user?.user_metadata?.full_name ||
              user?.user_metadata?.name ||
              'Customer'}
          </span>

          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              accountOpen && 'rotate-180',
            )}
          />
        </button>

        {accountOpen && (
          <div className="ml-3 mt-1 space-y-1 border-l border-border/60 pl-3">

            <Link
              href="/account/orders"
              onClick={() => setOpen(false)}
              className="flex min-h-10 items-center rounded-xl px-4 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-primary"
            >
              📦 My Orders
            </Link>

            <Link
  href="/account/profile"
  onClick={() => setOpen(false)}
  className="flex min-h-10 items-center rounded-xl px-4 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-primary"
>
  👤 My Account
</Link>
            <Link
              href="/account/help"
              onClick={() => setOpen(false)}
              className="flex min-h-10 items-center rounded-xl px-4 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-primary"
            >
              💬 Help & Support
            </Link>

            <div className="my-2 border-t border-border/50" />

            <button
              type="button"
              onClick={async () => {
                setAccountOpen(false)
                setOpen(false)
                await handleLogout()
              }}
              className="flex min-h-10 w-full items-center rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              🚪 Logout
            </button>

          </div>
        )}
      </div>
    )}
  </>
) : (
  <Link
    href="/login"
    onClick={() => setOpen(false)}
    className="flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-primary"
  >
    <User className="h-4 w-4" />
    Login
  </Link>
)}
          </ul>
        </nav>
      )}
    </header>
    </>
  )
}