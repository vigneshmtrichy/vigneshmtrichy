'use client'

import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useCart } from '@/components/cart/cart-context'

export default function CartPage() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    cartTotal,
  } = useCart()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 px-5 py-10 md:px-10 md:py-16">
        <div className="mx-auto max-w-5xl">

          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              YOUR CART
            </p>

            <h1 className="mt-2 font-serif text-4xl font-bold text-primary md:text-5xl">
              Your Order
            </h1>
          </div>

          {items.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card px-6 py-14 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />

              <h2 className="mt-4 font-serif text-2xl font-bold text-primary">
                Your cart is empty
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Add some products to get started.
              </p>

              <Link
                href="/products"
                className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                EXPLORE PRODUCTS
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_340px]">

              {/* CART ITEMS */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.product.slug}
                    className="flex gap-4 rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-background">
                      <img
                        src={item.product.image || '/placeholder.svg'}
                        alt={item.product.name}
                        className="h-full w-full object-contain p-2"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="font-serif text-lg font-bold text-primary">
                        {item.product.name}
                      </h2>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.product.packSize}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="flex items-center rounded-full border border-border">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.product.slug,
                                item.quantity - 1,
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center text-primary"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </button>

                          <span className="w-8 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.product.slug,
                                item.quantity + 1,
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center text-primary"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(item.product.slug)
                          }
                          className="text-muted-foreground transition-colors hover:text-red-600"
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ORDER SUMMARY */}
              <div className="h-fit rounded-3xl border border-border bg-card p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  ORDER SUMMARY
                </p>

                <div className="mt-5 flex items-center justify-between border-b border-border pb-4">
                  <span className="text-sm text-muted-foreground">
                    Items
                  </span>

                  <span className="text-sm font-semibold text-primary">
                    {items.reduce(
                      (total, item) => total + item.quantity,
                      0,
                    )}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="font-semibold text-primary">
                    Total
                  </span>

                  <span className="font-serif text-2xl font-bold text-primary">
                    ₹{cartTotal}
                  </span>
                </div>

                <button
  type="button"
  onClick={() => {
    const message = [
      'Hello TENOO, I would like to order:',
      '',
      ...items.map(
        (item) =>
          `${item.product.name} × ${item.quantity}`,
      ),
      '',
      `Total Items: ${items.reduce(
        (total, item) => total + item.quantity,
        0,
      )}`,
      `Total: ₹${cartTotal}`,
    ].join('\n')

    window.open(
      `https://wa.me/919585808590?text=${encodeURIComponent(message)}`,
      '_blank',
    )
  }}
  className="mt-6 w-full rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
>
  BUY ON WHATSAPP
</button>

                <Link
                  href="/products"
                  className="mt-3 block text-center text-sm font-semibold text-accent"
                >
                  Continue Shopping
                </Link>
              </div>

            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}