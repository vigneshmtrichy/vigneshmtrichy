'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  applyProductControls,
  type Product,
} from '@/lib/site'
import { supabase } from '@/lib/supabase'

type CartItem = {
  product: Product
  quantity: number
}

type CartContextType = {
  items: CartItem[]
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (slug: string) => void
  updateQuantity: (slug: string, quantity: number) => void
  clearCart: () => void
  cartCount: number
  cartTotal: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    let mounted = true

    const loadCart = async () => {
      let savedItems: CartItem[] = []

      const savedCart = localStorage.getItem('tenoo-cart')

      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart)
          if (Array.isArray(parsed)) {
            savedItems = parsed
          }
        } catch {
          localStorage.removeItem('tenoo-cart')
        }
      }

      if (savedItems.length === 0) {
        if (mounted) setItems([])
        return
      }

      const slugs = savedItems.map((item) => item.product.slug)
      const { data } = await supabase
        .from('product_status')
        .select('product_slug, status, mrp, price, retailer_price, offer_enabled, offer_label, featured, featured_priority, display_name, badges, image_url, image_urls, shipping_weight_kg')
        .in('product_slug', slugs)

      const pricingBySlug = new Map(
        (data || []).map((item) => [
          item.product_slug,
          {
            status: item.status,
            mrp: item.mrp,
            price: item.price,
            retailer_price: item.retailer_price,
            offer_enabled: item.offer_enabled,
            offer_label: item.offer_label,
            featured: item.featured,
            featured_priority: item.featured_priority,
            display_name: item.display_name,
            badges: item.badges,
            image_url: item.image_url,
            image_urls: item.image_urls,
            shipping_weight_kg: item.shipping_weight_kg,
          },
        ]),
      )

      const refreshedItems = savedItems.map((item) => ({
        ...item,
        product: applyProductControls(
          item.product,
          pricingBySlug.get(item.product.slug),
        ),
      }))

      if (mounted) {
        setItems(refreshedItems)
      }
    }

    void loadCart()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('tenoo-cart', JSON.stringify(items))
  }, [items])

  const addToCart = (product: Product, quantity = 1) => {
    const safeQuantity = Math.max(1, quantity)

    setItems((current) => {
      const existing = current.find(
        (item) => item.product.slug === product.slug,
      )

      if (existing) {
        return current.map((item) =>
          item.product.slug === product.slug
            ? {
                ...item,
                quantity: item.quantity + safeQuantity,
              }
            : item,
        )
      }

      return [
        ...current,
        {
          product,
          quantity: safeQuantity,
        },
      ]
    })
  }

  const removeFromCart = (slug: string) => {
    setItems((current) =>
      current.filter((item) => item.product.slug !== slug),
    )
  }

  const updateQuantity = (slug: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(slug)
      return
    }

    setItems((current) =>
      current.map((item) =>
        item.product.slug === slug
          ? {
              ...item,
              quantity,
            }
          : item,
      ),
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const cartCount = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.quantity,
        0,
      ),
    [items],
  )

  const cartTotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total +
          (Number(item.product.price) || 0) * item.quantity,
        0,
      ),
    [items],
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error(
      'useCart must be used inside CartProvider',
    )
  }

  return context
}