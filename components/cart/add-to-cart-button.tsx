'use client'

import { ShoppingCart, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { Product } from '@/lib/site'
import { useCart } from '@/components/cart/cart-context'

export function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [open, setOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)

  const quantityRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        quantityRef.current &&
        !quantityRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  const handleQuantityClick = () => {
    if (!quantityRef.current) return

    const rect = quantityRef.current.getBoundingClientRect()

    const dropdownHeight = 210
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    if (spaceBelow < dropdownHeight && spaceAbove >= dropdownHeight) {
      setOpenUp(true)
    } else {
      setOpenUp(false)
    }

    setOpen((current) => !current)
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product)
    }
  }

  return (
    <div className="mt-7 flex flex-col items-start gap-3">
      {/* Quantity */}
      <div ref={quantityRef} className="relative">
        <button
          type="button"
          onClick={handleQuantityClick}
          className="flex h-14 w-[190px] items-center justify-between rounded-full border border-border bg-background px-5 text-sm font-semibold text-primary"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span>
            Quantity:
            <span className="ml-2">{quantity}</span>
          </span>

          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>

        {open && (
          <div
            className={`absolute left-0 z-50 w-[190px] overflow-hidden rounded-xl border border-border bg-background shadow-lg ${
              openUp
                ? 'bottom-full mb-2'
                : 'top-full mt-2'
            }`}
          >
            <div className="max-h-[210px] overflow-y-auto">
              {Array.from({ length: 30 }, (_, index) => index + 1).map(
                (number) => (
                  <button
                    key={number}
                    type="button"
                    onClick={() => {
                      setQuantity(number)
                      setOpen(false)
                    }}
                    className={`block w-full px-5 py-2.5 text-left text-sm transition-colors hover:bg-primary/10 ${
                      quantity === number
                        ? 'bg-primary/10 font-semibold text-primary'
                        : 'text-primary'
                    }`}
                  >
                    {number}
                  </button>
                ),
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add to Cart */}
      <button
        type="button"
        onClick={handleAddToCart}
        className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <ShoppingCart className="h-5 w-5" />
        ADD TO CART
      </button>
    </div>
  )
}