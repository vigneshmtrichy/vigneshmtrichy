'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/components/cart/cart-context'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

const FLAT_SHIPPING = 59
const FREE_SHIPPING_THRESHOLD = 699

const STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
]
const UNION_TERRITORIES = [
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
]
export default function CheckoutPage() {
  const router = useRouter()

  const {
    items,
    cartTotal,
  } = useCart()

  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [pincode, setPincode] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')

  const [error, setError] = useState('')

 const shippingCharge =
  cartTotal >= FREE_SHIPPING_THRESHOLD
    ? 0
    : FLAT_SHIPPING

  const finalTotal = cartTotal + (shippingCharge ?? 0)

  const mrpTotal = items.reduce(
    (total, item) =>
      total + Number(item.product.mrp || item.product.price || 0) * item.quantity,
    0,
  )

  const savings = mrpTotal - cartTotal

  const handleWhatsAppOrder = () => {
    if (!customerName.trim()) {
      setError('Please enter your name.')
      return
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }

    if (!address.trim()) {
      setError('Please enter your delivery address.')
      return
    }

    if (!/^\d{6}$/.test(pincode)) {
      setError('Please enter a valid 6-digit pincode.')
      return
    }

    if (!city.trim()) {
      setError('Please enter your city.')
      return
    }

    if (!state) {
      setError('Please select your state.')
      return
    }

    setError('')

    const message = [
      '🌿 TENOO ORDER',
      '',
      'Customer Details',
      `Name: ${customerName}`,
      `Mobile: ${phone}`,
      `Address: ${address}`,
      `Pincode: ${pincode}`,
      `City: ${city}`,
      `State: ${state}`,
      '',
      'Order Details',
      ...items.map(
        (item) =>
          `${item.product.name} × ${item.quantity} — ₹${Number(item.product.price || 0) * item.quantity}`,
      ),
      '',
      `MRP Total: ₹${mrpTotal}`,
      `You Save: ₹${savings}`,
      `Delivery: ${shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}`,
      `Total: ₹${finalTotal}`,
    ].join('\n')

    window.open(
      `https://wa.me/919585808590?text=${encodeURIComponent(message)}`,
      '_blank',
    )
  }

  if (items.length === 0) {
    return (
      <>
        <SiteHeader />

        <main className="mx-auto max-w-7xl px-5 py-20 text-center">
          <p className="text-sm text-muted-foreground">
            Your cart is empty.
          </p>

          <Link
            href="/products"
            className="mt-5 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
          >
            CONTINUE SHOPPING
          </Link>
        </main>

        <SiteFooter />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-2xl px-4 py-5 sm:px-5 sm:py-8 md:py-14">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-medium text-muted-foreground"
          >
            ← Back to Cart
          </button>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            CHECKOUT
          </p>

          <h1 className="mt-2 font-serif text-3xl font-bold text-primary md:text-4xl">
            Delivery Details
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Enter your details to place your Tenoo order.
          </p>
        </div>

       <div className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5 md:p-7">
          <div className="space-y-5">

            <div>
              <label className="text-xs font-semibold text-primary">
                Full Name *
              </label>

              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                className="mt-2 h-12 w-full rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-primary">
                Mobile Number *
              </label>

              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, ''))
                }
                placeholder="10-digit mobile number"
                className="mt-2 h-12 w-full rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-primary">
                Delivery Address *
              </label>

              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House no, street, area"
                rows={4}
                className="mt-2 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-primary">
                Pincode *
              </label>

              <input
                type="tel"
                inputMode="numeric"
                maxLength={6}
                value={pincode}
                onChange={(e) =>
                  setPincode(e.target.value.replace(/\D/g, ''))
                }
                placeholder="6-digit pincode"
                className="mt-2 h-12 w-full rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-primary">
                  City *
                </label>

                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="mt-2 h-12 w-full rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-primary">
                  State *
                </label>

                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="mt-2 h-12 w-full rounded-full border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  <option value="">Select State</option>
                   <optgroup label="States">
    {STATES.map((item) => (
      <option key={item} value={item}>
        {item}
      </option>
    ))}
  </optgroup>

  <optgroup label="Union Territories">
    {UNION_TERRITORIES.map((item) => (
      <option key={item} value={item}>
        {item}
      </option>
    ))}
  </optgroup>
                </select>
              </div>
            </div>
<p className="text-xs leading-relaxed text-muted-foreground">
  🚚 Flat ₹59 delivery across India • Free delivery on orders above ₹699
</p>
            {error && (
              <div className="rounded-full bg-red-50 px-4 py-2 text-xs font-medium text-red-600">
                {error}
              </div>
            )}
          </div>

          {/* ORDER SUMMARY */}

          <div className="mt-8 border-t border-border pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              ORDER SUMMARY
            </p>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Items
                </span>

                <span className="font-medium text-primary">
                  {items.reduce(
                    (total, item) => total + item.quantity,
                    0,
                  )}
                </span>
              </div>

             <div className="flex justify-between">
  <span>MRP Total</span>
  <span>₹{mrpTotal}</span>
</div>

<div className="flex justify-between">
  <span>Product Price</span>
  <span>₹{cartTotal}</span>
</div>

<div className="flex justify-between">
  <span>Delivery</span>
  <span className="font-semibold text-primary">
    {shippingCharge === 0 ? 'FREE' : `+₹${shippingCharge}`}
  </span>
</div>

<div className="flex justify-between rounded-full bg-accent/10 px-4 py-2 text-xs font-semibold text-primary">
  <span>You Save</span>
  <span>−₹{savings}</span>
</div>

              <div className="flex items-center justify-between pt-3">
                <span className="font-medium text-primary">
                  Total
                </span>

                <span className="font-serif text-2xl font-bold text-primary">
                  ₹{finalTotal}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleWhatsAppOrder}
            className="mt-6 flex h-13 w-full items-center justify-center rounded-full bg-primary px-4 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-sm transition-all active:scale-[0.97]"
          >
            BUY ON WHATSAPP
          </button>

         <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground">
  Delivery charges are calculated automatically. Payment details will be confirmed directly on WhatsApp.
</p>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}