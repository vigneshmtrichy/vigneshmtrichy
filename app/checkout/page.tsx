'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/components/cart/cart-context'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { supabase } from '@/lib/supabase'

const FLAT_SHIPPING = 79
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
    clearCart,
  } = useCart()

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [pincodeStatus, setPincodeStatus] = useState<
    'idle' | 'valid' | 'invalid' | 'error'
  >('idle')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [pincode, setPincode] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincodeState, setPincodeState] = useState('')

  const lookupPincode = async (cleanPincode: string) => {
    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${cleanPincode}`,
      )

      if (!response.ok) {
        setPincodeStatus('error')
        return false
      }

      const data = await response.json()

      if (data?.[0]?.Status === 'Success' && data?.[0]?.PostOffice?.length) {
        const postOffice = data[0].PostOffice[0]
        setCity(postOffice.District)
        setState(postOffice.State)
        setPincodeState(postOffice.State)
        setPincodeStatus('valid')
        return true
      }

      setPincodeState('')
      setPincodeStatus('invalid')
      return false
    } catch (error) {
      console.error('Pincode lookup failed:', error)
      setPincodeState('')
      setPincodeStatus('error')
      return false
    }
  }

  useEffect(() => {
  const loadCustomerProfile = async () => {
   const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) return

setCustomerEmail(user.email || '')

    const { data, error } = await supabase
      .from('customer_profiles')
      .select('name, phone, address, pincode, city, state')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Failed to load customer profile:', error)
      return
    }

    if (!data) return

    setCustomerName(data.name || '')
    setPhone(data.phone || '')
    setAddress(data.address || '')
    setPincode(data.pincode || '')
    setCity(data.city || '')
    setState(data.state || '')
    setPincodeState('')
    setPincodeStatus('idle')

    if (/^\d{6}$/.test(data.pincode || '')) {
      await lookupPincode(data.pincode)
    }
  }

  loadCustomerProfile()
}, [])

  const handlePincodeChange = async (value: string) => {
    const cleanPincode = value.replace(/\D/g, '').slice(0, 6)

    setPincode(cleanPincode)
    setPincodeState('')
    setPincodeStatus('idle')

    if (cleanPincode.length !== 6) return

    await lookupPincode(cleanPincode)
  }
  const [error, setError] = useState('')
  const [whatsappOrderUrl, setWhatsappOrderUrl] = useState('')

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

// GST calculation - product-wise
const taxableValue = items.reduce((total, item) => {
  const price = Number(item.product.price || 0)
  const gstRate = Number(item.product.gstRate || 0) / 100

  const itemTaxableValue = price / (1 + gstRate)

  return total + itemTaxableValue * item.quantity
}, 0)

const totalGST = cartTotal - taxableValue

const isTamilNadu = state === 'Tamil Nadu'

const cgst = isTamilNadu ? totalGST / 2 : 0
const sgst = isTamilNadu ? totalGST / 2 : 0
const igst = isTamilNadu ? 0 : totalGST

  
const handleWhatsAppOrder = async () => {
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

    if (pincodeStatus === 'invalid') {
      setError('Please enter a valid pincode.')
      return
    }

    if (pincodeStatus === 'error') {
      setError('Unable to verify pincode. Please try again.')
      return
    }

    if (pincodeStatus !== 'valid') {
      setError('Please enter and verify your pincode.')
      return
    }

   if (pincodeState && state !== pincodeState) {
  setError('State does not match the pincode.')
  return
}

    setError('')

    const {
  data: { user },
} = await supabase.auth.getUser()

if (user) {
  const { error: profileError } = await supabase
    .from('customer_profiles')
    .upsert(
      {
        user_id: user.id,
        name: customerName.trim(),
        phone,
        address: address.trim(),
        pincode,
        city: city.trim(),
        state,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      },
    )

  if (profileError) {
    console.error(
      'Failed to save customer profile:',
      profileError,
    )
  }
}

const {
  data: { session },
} = await supabase.auth.getSession()

let orderResponse: Response

try {
  orderResponse = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
    },
    body: JSON.stringify({
      customer_name: customerName.trim(),
      customer_email: customerEmail.trim(),
      phone,
      address: address.trim(),
      pincode,
      city: city.trim(),
      state,
      items: items.map((item) => ({
        product_slug: item.product.slug,
        quantity: item.quantity,
      })),
    }),
  })
} catch {
  setError('Unable to place your order. Please try again.')
  return
}

const orderResult = await orderResponse.json().catch(() => null)

if (!orderResponse.ok || !orderResult?.success || !orderResult?.order) {
  setError(orderResult?.message || 'Unable to place your order. Please try again.')
  return
}

clearCart()

const savedOrder = orderResult.order
const savedSavings = Number(savedOrder.mrp_total) - Number(savedOrder.product_total)

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
      ...savedOrder.items.map(
        (item: {
          product_name: string
          quantity: number
          unit_price: number
        }) =>
          `${item.product_name} × ${item.quantity} — ₹${Number(item.unit_price) * item.quantity}`,
      ),
      '',
      `MRP Total: ₹${Number(savedOrder.mrp_total).toFixed(2)}`,
      `Product Price (Incl. GST): ₹${Number(savedOrder.product_total).toFixed(2)}`,
      `Taxable Value / Price Excl. GST: ₹${Number(savedOrder.taxable_value).toFixed(2)}`,
      ...(state === 'Tamil Nadu'
        ? [
            `CGST: ₹${Number(savedOrder.cgst).toFixed(2)}`,
            `SGST: ₹${Number(savedOrder.sgst).toFixed(2)}`,
          ]
        : [`IGST: ₹${Number(savedOrder.igst).toFixed(2)}`]),
      `You Save: ₹${savedSavings.toFixed(2)}`,
      `Delivery: ${Number(savedOrder.delivery_charge) === 0 ? 'FREE' : `₹${savedOrder.delivery_charge}`}`,
      `Total: ₹${Number(savedOrder.total).toFixed(2)}`,
    ].join('\n')

    setWhatsappOrderUrl(
      `https://wa.me/919585808590?text=${encodeURIComponent(message)}`,
    )
  }

  if (whatsappOrderUrl) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto flex max-w-2xl justify-center px-4 py-12 sm:px-5 md:py-20">
          <section className="w-full rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-2xl text-primary" aria-hidden="true">
              ✓
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              ORDER SAVED
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-primary">
              Your order is ready
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Your order has been saved. Continue to WhatsApp to confirm it with our team.
            </p>
            <a
              href={whatsappOrderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-sm transition-all hover:opacity-90 sm:w-auto"
            >
              Continue to WhatsApp
            </a>
            <p className="mt-4 text-xs text-muted-foreground">
              Your cart is now clear.
            </p>
          </section>
        </main>
        <SiteFooter />
      </div>
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
               onChange={(e) =>
  setCustomerName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))
}
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
               onChange={(e) => handlePincodeChange(e.target.value)}
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
                  onChange={(e) =>
                  setCity(e.target.value.replace(/[^a-zA-Z\s]/g, ''))
                  }
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
                  disabled={!!pincodeState}
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
  🚚 Flat ₹79 delivery across India • Free delivery on orders above ₹699
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
  <span>Product Price (Incl. GST)</span>
  <span>₹{cartTotal.toFixed(2)}</span>
</div>

{state && (
  <>
<div className="flex justify-between">
  <span>Taxable Value / Price Excl. GST</span>
  <span>₹{taxableValue.toFixed(2)}</span>
</div>

{isTamilNadu ? (
  <>
    <div className="flex justify-between">
      <span>CGST</span>
      <span>₹{cgst.toFixed(2)}</span>
    </div>

    <div className="flex justify-between">
      <span>SGST</span>
      <span>₹{sgst.toFixed(2)}</span>
    </div>
  </>
) : (
  <div className="flex justify-between">
    <span>IGST</span>
    <span>₹{igst.toFixed(2)}</span>
  </div>
)}
  </>
)}

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
            CONFIRM ORDER ON WHATSAPP
          </button>

         <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground">
  Your order details will be sent to WhatsApp. Payment and delivery will be confirmed with you before dispatch.
</p>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}