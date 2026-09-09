'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { Product } from '@/lib/site'

type CartItem = {
  product: Product
  quantity: number
}

type CartContextType = {
  items: CartItem[]
  addToCart: (product: Product) => void
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
    const savedCart = localStorage.getItem('tenoo-cart')

    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch {
        localStorage.removeItem('tenoo-cart')
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('tenoo-cart', JSON.stringify(items))
  }, [items])

  const addToCart = (product: Product) => {
    setItems((current) => {
      const existing = current.find(
        (item) => item.product.slug === product.slug,
      )

      if (existing) {
        return current.map((item) =>
          item.product.slug === product.slug
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }

      return [...current, { product, quantity: 1 }]
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
          ? { ...item, quantity }
          : item,
      ),
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const cartCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  )

  const cartTotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + (item.product.price ?? 0) * item.quantity,
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
    throw new Error('useCart must be used inside CartProvider')
  }

  return context
}