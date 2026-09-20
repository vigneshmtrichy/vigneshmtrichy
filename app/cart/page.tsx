'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useCart } from '@/components/cart/cart-context'
import { useRouter } from 'next/navigation'

const GALLERY_FOLDERS: Record<string, string> = {
  'millet-abc': 'Meltiva-Nutrimix',
  'pink-abc': 'Rubyblend-Nutrimix',
  'black-rice-milk-mix': 'blacko-cocoa-mix',
  'cotton-milk-mix': 'Paruthipaal-mix',
  'pirandai-rice-mix': 'Pirandai-rice-mix',
  'mudavattu-kilangu-rice-mix': 'Mudavaatukaal-rice-mix',
  'mudavaattu-kizhangu-soup-mix': 'Mudavaatukaal-soup-mix',
  'nutaura': 'Nutaura',
}

export default function CartPage() {
  const router = useRouter()
  const [showFreeDeliveryPopup, setShowFreeDeliveryPopup] = useState(false)
  const {
    items,
    removeFromCart,
    updateQuantity,
    cartTotal,
  } = useCart()
  const freeDeliveryShownRef = useRef(false)
 

  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0,
  )
  const mrpTotal = items.reduce(
  (total, item) =>
    total + (Number(item.product.mrp) || 0) * item.quantity,
  0,
)

const totalSavings = mrpTotal - cartTotal
  const FREE_SHIPPING_THRESHOLD = 699

  const remainingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - cartTotal,
  )

const shippingCharge =
  cartTotal >= FREE_SHIPPING_THRESHOLD
    ? 0
    : null

const finalTotal = cartTotal + (shippingCharge ?? 0)
const shippingProgress = Math.min(
  100,
  (cartTotal / FREE_SHIPPING_THRESHOLD) * 100,
)


const previousTotalRef = useRef(finalTotal)

useEffect(() => {
  const previousTotal = previousTotalRef.current

  // Reset when cart goes below free-delivery threshold
  if (finalTotal < FREE_SHIPPING_THRESHOLD) {
    freeDeliveryShownRef.current = false
  }

  // Show popup only when crossing ₹699 from below
  if (
    !freeDeliveryShownRef.current &&
    previousTotal < FREE_SHIPPING_THRESHOLD &&
    finalTotal >= FREE_SHIPPING_THRESHOLD
  ) {
    freeDeliveryShownRef.current = true
    setShowFreeDeliveryPopup(true)

    const timer = setTimeout(() => {
      setShowFreeDeliveryPopup(false)
    }, 1000)

    return () => clearTimeout(timer)
  }

  previousTotalRef.current = finalTotal
}, [finalTotal])


const savingsPercentage =
  mrpTotal > 0
    ? Math.round((totalSavings / mrpTotal) * 100)
    : 0

return (
     <>
    {showFreeDeliveryPopup && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="free-delivery-popup relative mx-5 w-full max-w-md overflow-hidden rounded-3xl bg-background px-8 py-10 text-center shadow-2xl">

          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <span className="confetti confetti-1">🎉</span>
            <span className="confetti confetti-2">✨</span>
            <span className="confetti confetti-3">🎊</span>
            <span className="confetti confetti-4">🌿</span>
            <span className="confetti confetti-5">✨</span>
            <span className="confetti confetti-6">🎉</span>
          </div>

          <div className="free-delivery-icon relative z-10 mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-lime-100 text-4xl">
            🚚
          </div>

          <p className="relative z-10 text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Tenoo Delivery
          </p>

          <h2 className="relative z-10 mt-2 font-serif text-3xl font-bold text-primary md:text-4xl">
            FREE DELIVERY
          </h2>

          <p className="relative z-10 mt-3 text-base text-muted-foreground">
            You've unlocked free delivery on your order!
          </p>

          <div className="relative z-10 mx-auto mt-5 inline-flex rounded-full bg-green-50 px-5 py-2 text-sm font-bold text-green-700">
            🎉 Order above ₹699
          </div>
        </div>

        <style>{`
          .free-delivery-popup {
            animation: freeDeliveryPopup 450ms cubic-bezier(.2,.8,.2,1);
          }

          .free-delivery-icon {
            animation: freeDeliveryIcon 700ms ease-out;
          }

          .confetti {
            position: absolute;
            font-size: 24px;
            animation: confettiFall 1800ms ease-out forwards;
          }

          .confetti-1 { left: 10%; top: -10%; animation-delay: 100ms; }
          .confetti-2 { left: 28%; top: -15%; animation-delay: 250ms; }
          .confetti-3 { left: 50%; top: -10%; animation-delay: 50ms; }
          .confetti-4 { left: 68%; top: -15%; animation-delay: 300ms; }
          .confetti-5 { left: 82%; top: -10%; animation-delay: 180ms; }
          .confetti-6 { left: 42%; top: -20%; animation-delay: 400ms; }

          @keyframes freeDeliveryPopup {
            0% {
              opacity: 0;
              transform: scale(0.8) translateY(20px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          @keyframes freeDeliveryIcon {
            0% {
              transform: scale(0.5) rotate(-15deg);
              opacity: 0;
            }
            60% {
              transform: scale(1.15) rotate(5deg);
            }
            100% {
              transform: scale(1) rotate(0);
              opacity: 1;
            }
          }

          @keyframes confettiFall {
            0% {
              opacity: 0;
              transform: translateY(-20px) rotate(0deg);
            }
            20% {
              opacity: 1;
            }
            100% {
              opacity: 0;
              transform: translateY(420px) rotate(360deg);
            }
          }
        `}</style>
      </div>
    )}
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 px-5 pb-24 pt-10 md:px-10 md:py-16">
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
              <div className="space-y-4 lg:sticky lg:top-40 lg:self-start">
                {items.map((item) => {
                  const cartImage = GALLERY_FOLDERS[item.product.slug]
                    ? `/products/${GALLERY_FOLDERS[item.product.slug]}/1.png`
                    : item.product.image || '/placeholder.svg'

                  return (
                    <div
                      key={item.product.slug}
                      className="flex gap-4 rounded-2xl border border-border bg-card p-4"
                    >
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-background">
                        <img
                          src={cartImage}
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
                  )
                })}
              </div>

              {/* CUSTOMER DETAILS + ORDER SUMMARY */}
              <div className="h-fit rounded-3xl border border-border bg-card p-6">
                
           
                                {/* FREE SHIPPING PROGRESS */}
                <div className="mt-6 rounded-2xl border border-border bg-background p-4">
                  {cartTotal >= FREE_SHIPPING_THRESHOLD ? (
                    <>
                      <p className="free-delivery-unlocked text-sm font-semibold text-green-700">
  🎉 FREE DELIVERY UNLOCKED!
</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Your order qualifies for free delivery.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-primary">
                          Add ₹{remainingForFreeShipping.toLocaleString('en-IN')} more
                        </p>

                        <span className="text-xs font-semibold text-accent">
                          FREE DELIVERY
                        </span>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-accent transition-all duration-500"
                          style={{ width: `${shippingProgress}%` }}
                        />
                      </div>

                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Free delivery on orders above ₹699
                      </p>
      
                    </>
                  )}
                </div>

               {/* ORDER SUMMARY */}
<div className="mt-7 border-t border-border pt-6">

  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
    ORDER SUMMARY
  </p>

  {/* ITEMS */}
  <div className="mt-5 flex items-center justify-between border-b border-border pb-4">
    <span className="text-sm text-muted-foreground">
      Items
    </span>

    <span className="text-sm font-semibold text-primary">
      {totalItems}
    </span>
  </div>

  {/* MRP TOTAL */}
  <div className="mt-4 flex items-center justify-between">
    <span className="text-sm text-muted-foreground">
      MRP Total
    </span>

    <span className="text-sm text-muted-foreground line-through">
      ₹{mrpTotal.toLocaleString('en-IN')}
    </span>
  </div>
  {/* PRODUCT PRICE */}
<div className="mt-3 flex items-center justify-between">
  <span className="text-sm text-muted-foreground">
    Product Price
  </span>

  <span className="text-sm font-semibold text-primary">
    ₹{cartTotal.toLocaleString('en-IN')}
  </span>
</div>
   
  {/* SAVINGS */}
  {totalSavings > 0 && (
    <div className="mt-3 flex items-center justify-between rounded-xl bg-green-50 px-3 py-2.5">
      <span className="text-sm font-semibold text-green-700">
        You Save
      </span>

     <span
  key={`${totalSavings}-${savingsPercentage}`}
  className="discount-pop text-sm font-bold text-green-700"
>
  ₹{totalSavings.toLocaleString('en-IN')}
  {savingsPercentage > 0 && (
    <span className="ml-1">
      ({savingsPercentage}% OFF)
    </span>
  )}
</span>
    </div>
  )}

  {/* TOTAL */}
  <div className="mt-5 flex items-center justify-between">
    <span className="font-semibold text-primary">
      Total
    </span>

  <span className="font-serif text-2xl font-bold text-primary">
  ₹{finalTotal.toLocaleString('en-IN')}
</span>
  </div>

  {/* SAVINGS MESSAGE */}
{totalSavings > 0 && (
  <p className="mt-2 text-center text-xs font-medium text-green-700">
    🎉 You’re saving ₹{totalSavings.toLocaleString('en-IN')} on this order!
  </p>
)}

  <button
    type="button"
   onClick={() => router.push('/checkout')}
    className="flex h-11 w-full items-center justify-center rounded-full bg-primary px-4 text-xs font-bold uppercase text-primary-foreground shadow-sm transition-all duration-150 hover:opacity-90 active:scale-[0.96] active:shadow-inner"
  >
 PROCEED TO CHECKOUT
  </button>


  <Link
    href="/products"
    className="mt-3 block text-center text-sm font-semibold text-accent"
  >
    Continue Shopping
  </Link>

</div>
               
              </div>

            </div>
          )}
        </div>
      </main>

      <style>{`
        .discount-pop {
          animation: discountPop 700ms ease-out;
        }

        .free-delivery-unlocked {
          animation: freeDeliveryPop 700ms ease-out;
        }

        @keyframes discountPop {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          60% {
            transform: scale(1.08);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes freeDeliveryPop {
          0% {
            transform: scale(0.85);
            opacity: 0;
          }
          60% {
            transform: scale(1.05);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>

      <SiteFooter />
    </div>
    </>
  )
}