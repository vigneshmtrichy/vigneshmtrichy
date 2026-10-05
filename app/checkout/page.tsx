'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
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
  const pincodeRequestRef = useRef(0)

  const lookupPincode = async (cleanPincode: string) => {
    const requestId = ++pincodeRequestRef.current
    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${cleanPincode}`,
      )

      if (!response.ok) {
        if (requestId === pincodeRequestRef.current) setPincodeStatus('error')
        return false
      }

      const data = await response.json()

      if (requestId !== pincodeRequestRef.current) return false

      if (data?.[0]?.Status === 'Success' && data?.[0]?.PostOffice?.length) {
        const postOffice = data[0].PostOffice[0]
        setCity(postOffice.District)
        setState(postOffice.State)
        setPincodeState(postOffice.State)
        setPincodeStatus('valid')
        return true
      }

      if (data?.[0]?.Status === 'Error') {
        setPincodeState('')
        setPincodeStatus('invalid')
        return false
      }

      setPincodeState('')
      setPincodeStatus('error')
      return false
    } catch (error) {
      console.error('Pincode lookup failed:', error)
      if (requestId === pincodeRequestRef.current) {
        setPincodeState('')
        setPincodeStatus('error')
      }
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
  const [paymentLoading, setPaymentLoading] = useState(false)

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

  
const handleCashfreePayment = async () => {
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
    
    const { data: { user } } = await supabase.auth.getUser()

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
            city,
            state,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )

      if (profileError) console.error('Failed to save customer profile:', profileError)
    }

    const { data: { session } } = await supabase.auth.getSession()
    setPaymentLoading(true)

    try {
      const response = await fetch('/api/cashfree/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token
            ? { Authorization: 'Bearer ' + session.access_token }
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

      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.success || !result?.payment_session_id) {
        setError(result?.message || 'Unable to start payment. Please try again.')
        return
      }

      const cashfreeFactory = (window as any).Cashfree
      if (typeof cashfreeFactory !== 'function') {
        setError('Payment gateway is still loading. Please try again.')
        return
      }

      const cashfree = cashfreeFactory({ mode: 'sandbox' })
      const checkoutResult = await cashfree.checkout({
        paymentSessionId: result.payment_session_id,
        redirectTarget: '_modal',
      })

      if (checkoutResult?.paymentDetails) {
        // Cashfree invokes this callback after a payment attempt, including
        // failed/user-dropped transactions. Verify the final status server-side.
        window.location.href = '/checkout/payment?order_id=' + encodeURIComponent(result.order_id)
        return
      }

      if (checkoutResult?.error) {
        setError(checkoutResult.error.message || 'Unable to open payment checkout.')
      }
    } catch (error) {
      console.error('Cashfree checkout failed:', error)
      setError('Unable to start payment. Please try again.')
    } finally {
      setPaymentLoading(false)
    }
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
      <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="afterInteractive" />
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
            onClick={handleCashfreePayment}
            disabled={paymentLoading}
            className="mt-6 flex h-13 w-full items-center justify-center rounded-full bg-primary px-4 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-sm transition-all active:scale-[0.97]"
          >
            {paymentLoading ? 'OPENING PAYMENT...' : 'PROCEED TO PAY'}
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