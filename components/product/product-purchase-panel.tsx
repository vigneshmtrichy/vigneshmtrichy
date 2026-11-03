'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, MapPin, ShoppingBag, Truck, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

import type { Product } from '@/lib/site'
import { useCart } from '@/components/cart/cart-context'
import { AddToCartButton } from '@/components/cart/add-to-cart-button'
import { supabase } from '@/lib/supabase'

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
  const [skuOptions, setSkuOptions] = useState<Array<{
    id: string; sku_code: string; pack_size_value: number; pack_size_unit: string;
    mrp: number; online_price: number; gst_rate: number; shipping_weight_kg: number | null;
    is_default: boolean; is_available?: boolean | null
  }>>([])
  const [selectedSkuId, setSelectedSkuId] = useState('')
  const [hasSkuRecords, setHasSkuRecords] = useState(false)
  const [skuLoading, setSkuLoading] = useState(true)

  useEffect(() => {
    let active = true
    const loadSkus = async () => {
      const { data, error } = await supabase
        .from('product_skus')
        .select('id, sku_code, pack_size_value, pack_size_unit, mrp, online_price, gst_rate, shipping_weight_kg, is_default')
        .eq('product_slug', product.slug)
        .order('is_default', { ascending: false })
        .order('pack_size_value', { ascending: true })
      if (!active) return
      if (error) {
        console.error('Unable to load product pack variants:', error)
        setSkuOptions([])
      } else {
        const rows = (data || []) as typeof skuOptions
        const { data: availability } = await supabase.rpc('get_public_sku_availability', { p_product_slug: product.slug })
        setHasSkuRecords((availability || []).some((row: any) => row.is_configured))
        const availabilityById = new Map((availability || []).filter((row: any) => row.sku_id).map((row: any) => [row.sku_id, row.is_available]))
        const rowsWithAvailability = rows.map((sku) => ({ ...sku, is_available: availabilityById.get(sku.id) ?? null }))
        setSkuOptions(rowsWithAvailability)
        setSelectedSkuId(rows[0]?.id || '')
      }
      setSkuLoading(false)
    }
    void loadSkus()
    return () => { active = false }
  }, [product.slug])

  const selectedSku = useMemo(
    () => skuOptions.find((sku) => sku.id === selectedSkuId) || null,
    [skuOptions, selectedSkuId],
  )
  const selectedStock = selectedSku?.is_available === true ? 1 : selectedSku?.is_available === false ? 0 : null
  const cartProduct: Product = selectedSku ? {
    ...product,
    skuId: selectedSku.id,
    skuCode: selectedSku.sku_code,
    packSize: String(selectedSku.pack_size_value) + selectedSku.pack_size_unit,
    mrp: String(selectedSku.mrp),
    price: String(selectedSku.online_price),
    gstRate: Number(selectedSku.gst_rate),
    shippingWeightKg: selectedSku.shipping_weight_kg ?? product.shippingWeightKg,
  } : product
  const purchaseStatus = status === 'hidden' || status === 'coming-soon' ? status : hasSkuRecords && !selectedSku ? 'out-of-stock' : selectedSku && selectedStock !== null ? (selectedStock > 0 ? 'active' : 'out-of-stock') : status

  const handleBuyNow = () => {
    if (purchaseStatus !== 'active' || skuLoading) return

    addToCart(cartProduct, 1)
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
      {skuOptions.length > 0 && (
        <div className="mb-4 max-w-[320px]">
          <label className="block text-xs font-semibold text-muted-foreground">Pack size</label>
          <select value={selectedSkuId} onChange={(event) => setSelectedSkuId(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium text-primary">
            {skuOptions.map((sku) => <option key={sku.id} value={sku.id}>{sku.pack_size_value}{sku.pack_size_unit} · ₹{Number(sku.online_price).toLocaleString('en-IN')}</option>)}
          </select>
          {selectedSku && <p className="mt-2 text-sm text-primary"><span className="font-semibold">₹{Number(selectedSku.online_price).toLocaleString('en-IN')}</span> <span className="ml-2 text-muted-foreground line-through">₹{Number(selectedSku.mrp).toLocaleString('en-IN')}</span></p>}
          {selectedSku && selectedStock !== null && <p className="mt-1 text-xs text-muted-foreground">{selectedStock > 0 ? 'In stock' : 'Currently out of stock'}</p>}
        </div>
      )}

      {/* PURCHASE BUTTONS */}
<div className="w-full max-w-[260px]">

  {/* ADD TO CART */}
  <div
    className={
      purchaseStatus !== 'active' || skuLoading
        ? 'pointer-events-none opacity-50'
        : ''
    }
  >
    <AddToCartButton product={cartProduct} />
  </div>

  {/* BUY IT NOW */}
  <button
  type="button"
  onClick={handleBuyNow}
  disabled={purchaseStatus !== 'active' || skuLoading}
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
 {purchaseStatus === 'active'
  ? 'BUY IT NOW'
  : status === 'coming-soon'
    ? 'COMING SOON'
    : 'OUT OF STOCK'}
</button>
</div>

      {/* STOCK STATUS */}
      <div className="mt-4 flex items-center gap-2">
        {purchaseStatus === 'active' ? (
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