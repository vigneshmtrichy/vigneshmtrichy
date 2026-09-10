'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useCart } from '@/components/cart/cart-context'

const GALLERY_FOLDERS: Record<string, string> = {
  'millet-abc': 'Meltiva-Nutrimix',
  'pink-abc': 'Rubyblend-Nutrimix',
  'black-rice-milk-mix': 'blacko-cocoa-mix',
  'cotton-milk-mix': 'Paruthipaal-mix',
  'pirandai-rice-mix': 'Pirandai-rice-mix',
  'mudavattu-kilangu-rice-mix': 'Mudavaatukaal-rice-mix',
  'mudavaattu-kizhangu-soup-mix': 'Mudavaatukaal-soup-mix',
}

export default function CartPage() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    cartTotal,
  } = useCart()

  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [pincode, setPincode] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')

  const [error, setError] = useState('')

  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0,
  )

  const handleWhatsAppOrder = () => {
    const cleanPhone = phone.replace(/\D/g, '')
    const cleanPincode = pincode.replace(/\D/g, '')

    if (!customerName.trim()) {
      setError('Please enter your name.')
      return
    }

    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }

    if (!address.trim()) {
      setError('Please enter your delivery address.')
      return
    }

    if (cleanPincode.length !== 6) {
      setError('Please enter a valid 6-digit pincode.')
      return
    }

    if (!city.trim()) {
      setError('Please enter your city.')
      return
    }

    if (!state.trim()) {
      setError('Please enter your state.')
      return
    }

    setError('')

    const message = [
      'Hello TENOO, I would like to place an order.',
      '',
      'CUSTOMER DETAILS',
      `Name: ${customerName.trim()}`,
      `Phone: ${cleanPhone}`,
      `Address: ${address.trim()}`,
      `Pincode: ${cleanPincode}`,
      `City: ${city.trim()}`,
      `State: ${state.trim()}`,
      '',
      'ORDER DETAILS',
      ...items.map(
        (item) =>
          `${item.product.name} × ${item.quantity}`,
      ),
      '',
      `Total Items: ${totalItems}`,
      `Total: ₹${cartTotal}`,
    ].join('\n')

    window.open(
      `https://wa.me/919585808590?text=${encodeURIComponent(message)}`,
      '_blank',
    )
  }

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

                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  DELIVERY DETAILS
                </p>

                <div className="mt-5 space-y-3">

                  {/* NAME */}
                  <div>
                    <label
                      htmlFor="customer-name"
                      className="mb-1.5 block text-xs font-semibold text-primary"
                    >
                      Full Name *
                    </label>

                     <input
                          id="customer-name"
                          type="text"
                          value={customerName}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z\s]/g, '')
                            setCustomerName(value)
                            setError('')
                          }}
                          placeholder="Enter your name"
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none transition focus:border-accent"
                        />
                  </div>

                  {/* PHONE */}
                  <div>
                    <label
                      htmlFor="customer-phone"
                      className="mb-1.5 block text-xs font-semibold text-primary"
                    >
                      Mobile Number *
                    </label>

                    <input
                      id="customer-phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 10)

                        setPhone(value)
                        setError('')
                      }}
                      placeholder="10-digit mobile number"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none transition focus:border-accent"
                    />
                  </div>

                  {/* ADDRESS */}
                  <div>
                    <label
                      htmlFor="customer-address"
                      className="mb-1.5 block text-xs font-semibold text-primary"
                    >
                      Delivery Address *
                    </label>

                    <textarea
                      id="customer-address"
                      rows={3}
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value)
                        setError('')
                      }}
                      placeholder="House no, street, area"
                      className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none transition focus:border-accent"
                    />
                  </div>

                  {/* PINCODE */}
                  <div>
                    <label
                      htmlFor="customer-pincode"
                      className="mb-1.5 block text-xs font-semibold text-primary"
                    >
                      Pincode *
                    </label>

                    <input
                      id="customer-pincode"
                      type="tel"
                      inputMode="numeric"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 6)

                        setPincode(value)
                        setError('')
                      }}
                      placeholder="6-digit pincode"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none transition focus:border-accent"
                    />
                  </div>

                  {/* CITY + STATE */}
                  <div className="grid grid-cols-2 gap-3">

                    <div>
                      <label
                        htmlFor="customer-city"
                        className="mb-1.5 block text-xs font-semibold text-primary"
                      >
                        City *
                      </label>

                      <input
                        id="customer-city"
                        type="text"
                        value={city}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^a-zA-Z\s]/g, '')
                          setCity(value)
                          setError('')
                        }}
                        placeholder="City"
                        className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-primary outline-none transition focus:border-accent"
                      />
                    </div>

                    <div>
                        <label
                          htmlFor="customer-state"
                          className="mb-1.5 block text-xs font-semibold text-primary"
                        >
                          State *
                        </label>

                        <select
                          id="customer-state"
                          value={state}
                          onChange={(e) => {
                            setState(e.target.value)
                            setError('')
                          }}
                          className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-primary outline-none transition focus:border-accent"
                        >
                          <option value="">Select State</option>
                          <option value="Andhra Pradesh">Andhra Pradesh</option>
                          <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                          <option value="Assam">Assam</option>
                          <option value="Bihar">Bihar</option>
                          <option value="Chhattisgarh">Chhattisgarh</option>
                          <option value="Goa">Goa</option>
                          <option value="Gujarat">Gujarat</option>
                          <option value="Haryana">Haryana</option>
                          <option value="Himachal Pradesh">Himachal Pradesh</option>
                          <option value="Jharkhand">Jharkhand</option>
                          <option value="Karnataka">Karnataka</option>
                          <option value="Kerala">Kerala</option>
                          <option value="Madhya Pradesh">Madhya Pradesh</option>
                          <option value="Maharashtra">Maharashtra</option>
                          <option value="Manipur">Manipur</option>
                          <option value="Meghalaya">Meghalaya</option>
                          <option value="Mizoram">Mizoram</option>
                          <option value="Nagaland">Nagaland</option>
                          <option value="Odisha">Odisha</option>
                          <option value="Punjab">Punjab</option>
                          <option value="Rajasthan">Rajasthan</option>
                          <option value="Sikkim">Sikkim</option>
                          <option value="Tamil Nadu">Tamil Nadu</option>
                          <option value="Telangana">Telangana</option>
                          <option value="Tripura">Tripura</option>
                          <option value="Uttar Pradesh">Uttar Pradesh</option>
                          <option value="Uttarakhand">Uttarakhand</option>
                          <option value="West Bengal">West Bengal</option>
                          <option value="Andaman and Nicobar Islands">
                            Andaman and Nicobar Islands
                          </option>
                          <option value="Chandigarh">Chandigarh</option>
                          <option value="Dadra and Nagar Haveli and Daman and Diu">
                            Dadra and Nagar Haveli and Daman and Diu
                          </option>
                          <option value="Delhi">Delhi</option>
                          <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                          <option value="Ladakh">Ladakh</option>
                          <option value="Lakshadweep">Lakshadweep</option>
                          <option value="Puducherry">Puducherry</option>
                        </select>
                      </div>

                  </div>
                </div>

                {/* ERROR */}
                {error && (
                  <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                    {error}
                  </p>
                )}

                {/* ORDER SUMMARY */}
                <div className="mt-7 border-t border-border pt-6">

                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    ORDER SUMMARY
                  </p>

                  <div className="mt-5 flex items-center justify-between border-b border-border pb-4">
                    <span className="text-sm text-muted-foreground">
                      Items
                    </span>

                    <span className="text-sm font-semibold text-primary">
                      {totalItems}
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
                    onClick={handleWhatsAppOrder}
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

            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}