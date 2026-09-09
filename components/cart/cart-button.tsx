'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'

import { useCart } from '@/components/cart/cart-context'

export function CartButton() {
  const { cartCount } = useCart()

  return (
    <Link
      href="/cart"
      aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
    >
      <ShoppingCart className="h-5 w-5" />

      {cartCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
          {cartCount}
        </span>
      )}
    </Link>
  )
}