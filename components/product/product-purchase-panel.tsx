'use client'

import { useState } from 'react'
import { Check, MapPin, ShoppingBag, Truck, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

import type { Product } from '@/lib/site'
import { useCart } from '@/components/cart/cart-context'
import { AddToCartButton } from '@/components/cart/add-to-cart-button'

export function ProductPurchasePanel({
  product,
status = 'active',
}: {
  product: Product
  status?: 'active' | 'hidden' | 'coming-soon' | 'out-of-stock'
}) {
  const { addToCart } = useCart()
  const router = useRouter()

  const [pincode, setPincode] = useState('')
  const [deliveryMessage, setDeliveryMessage] = useState('')

  const handleBuyNow = () => {
    if (status !== 'active') return

    addToCart(product, 1)
    router.push('/cart')
  }

  const checkDelivery = () => {
    const cleanPincode = pincode
      .replace(/\D/g, '')
      .slice(0, 6)

    setPincode(cleanPincode)

    if (cleanPincode.length !== 6) {
      setDeliveryMessage(
        'Please enter a valid 6-digit pincode.',
      )
      return
    }

    const start = new Date()
    const end = new Date()

    start.setDate(start.getDate() + 3)
    end.setDate(end.getDate() + 5)

    const formatDate = (date: Date) =>
      date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      })

    setDeliveryMessage(
      `Expected delivery: ${formatDate(start)} – ${formatDate(end)}`,
    )
  }

  return (
    <div className="mt-7">

      {/* PURCHASE BUTTONS */}
<div className="w-full max-w-[260px]">

  {/* ADD TO CART */}
  <div
    className={
      status !== 'active'
        ? 'pointer-events-none opacity-50'
        : ''
    }
  >
    <AddToCartButton product={product} />
  </div>

  {/* BUY IT NOW */}
  <button
  type="button"
  onClick={handleBuyNow}
  disabled={status !== 'active'}
  style={{
    width: '260px',
    maxWidth: '100%',
  }}
  className="
    mt-3
    flex
    h-14
    items-center
    justify-center
    gap-2
    rounded-full
    border-2
    border-primary
    bg-background
    text-sm
    font-bold
    uppercase
    tracking-wide
    text-primary
    transition-all
    duration-200
    hover:bg-primary
    hover:text-primary-foreground
    active:scale-[0.99]
    disabled:cursor-not-allowed
    disabled:opacity-50
  "
>
  <ShoppingBag className="h-5 w-5" />
 {status === 'active'
  ? 'BUY IT NOW'
  : status === 'coming-soon'
    ? 'COMING SOON'
    : 'OUT OF STOCK'}
</button>
</div>

      {/* STOCK STATUS */}
      <div className="mt-4 flex items-center gap-2">
        {status === 'active' ? (
          <>
            <span
              className="
                flex
                h-6
                w-6
                items-center
                justify-center
                rounded-full
                bg-green-100
                text-green-700
              "
            >
              <Check className="h-4 w-4" />
            </span>

            <span className="text-sm font-semibold text-green-700">
              IN STOCK
            </span>
          </>
        ) : (
          <>
            <span
              className="
                flex
                h-6
                w-6
                items-center
                justify-center
                rounded-full
                bg-red-100
                text-red-600
              "
            >
              <X className="h-4 w-4" />
            </span>

            <span className="text-sm font-semibold text-red-600">
  {status === 'coming-soon' ? 'COMING SOON' : 'OUT OF STOCK'}
</span>
          </>
        )}
      </div>

      {/* EXPECTED DELIVERY */}
      <div
        className="
          mt-5
          rounded-2xl
          border
          border-border
          bg-card/40
          p-4
        "
      >
        <div className="flex items-start gap-3">

          {/* ICON */}
          <div
            className="
              mt-0.5
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-background
            "
          >
            <Truck className="h-4 w-4 text-primary" />
          </div>

          <div className="min-w-0 flex-1">

            <p className="text-sm font-semibold text-primary">
              Expected Delivery
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Enter your pincode to check estimated delivery.
            </p>

            {/* PINCODE */}
            <div className="mt-3 flex gap-2">

              <div className="relative min-w-0 flex-1">

                <MapPin
                  className="
                    pointer-events-none
                    absolute
                    left-3
                    top-1/2
                    h-4
                    w-4
                    -translate-y-1/2
                    text-muted-foreground
                  "
                />

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => {
                    setPincode(
                      e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 6),
                    )

                    setDeliveryMessage('')
                  }}
                  placeholder="Pincode"
                  className="
                    h-10
                    w-full
                    rounded-full
                    border
                    border-border
                    bg-background
                    pl-9
                    pr-3
                    text-sm
                    outline-none
                    transition
                    focus:border-primary
                  "
                />
              </div>

              <button
                type="button"
                onClick={checkDelivery}
                className="
                  h-10
                  shrink-0
                  rounded-full
                  bg-primary
                  px-4
                  text-xs
                  font-bold
                  uppercase
                  text-primary-foreground
                  transition-opacity
                  hover:opacity-90
                "
              >
                CHECK
              </button>
            </div>

            {/* DELIVERY RESULT */}
            {deliveryMessage && (
              <p
                className={`
                  mt-2
                  text-xs
                  font-medium
                  ${
                    deliveryMessage.startsWith(
                      'Expected',
                    )
                      ? 'text-green-700'
                      : 'text-red-600'
                  }
                `}
              >
                {deliveryMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}