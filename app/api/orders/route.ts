import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ALL_PRODUCTS } from '@/lib/site'

const FLAT_SHIPPING = 79
const FREE_SHIPPING_THRESHOLD = 699
const MAX_ITEMS = 20
const MAX_QUANTITY_PER_PRODUCT = 100

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase server configuration is missing')
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function getSupabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publicKey) {
    throw new Error('Supabase public configuration is missing')
  }

  return createClient(url, publicKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function readText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const result = value.trim()
  return result.length > 0 && result.length <= maxLength ? result : null
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

async function verifyPincode(pincode: string): Promise<
  | { status: 'valid'; state: string }
  | { status: 'invalid' }
  | { status: 'error' }
> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`,
      {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      return { status: 'error' }
    }

    const data = await response.json()

    if (data?.[0]?.Status === 'Success' && data?.[0]?.PostOffice?.length) {
      const verifiedState = data[0].PostOffice[0]?.State

      if (typeof verifiedState === 'string' && verifiedState.trim()) {
        return {
          status: 'valid',
          state: verifiedState.trim(),
        }
      }
    }

    if (data?.[0]?.Status === 'Error') {
      return { status: 'invalid' }
    }

    return { status: 'error' }
  } catch (error) {
    console.error('Pincode verification failed:', error)
    return { status: 'error' }
  } finally {
    clearTimeout(timeout)
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const authorization = request.headers.get('authorization')
    const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
    let user: { id: string; email?: string } | null = null

    if (authorization && !accessToken) {
      return NextResponse.json(
        { success: false, message: 'Invalid authentication' },
        { status: 401 },
      )
    }

    if (accessToken) {
      const {
        data: { user: authenticatedUser },
        error: authError,
      } = await supabaseAdmin.auth.getUser(accessToken)

      if (authError || !authenticatedUser) {
        return NextResponse.json(
          { success: false, message: 'Invalid authentication' },
          { status: 401 },
        )
      }

      user = authenticatedUser
    }

    const body = await request.json()
    const customerName = readText(body?.customer_name, 120)
    const phone = readText(body?.phone, 20)
    const address = readText(body?.address, 500)
    const pincode = readText(body?.pincode, 6)
    const city = readText(body?.city, 100)
    const state = readText(body?.state, 100)
    const submittedEmail = body?.customer_email
    const customerEmail = user?.email || (typeof submittedEmail === 'string' ? submittedEmail.trim() : '')

    if (
      !customerName ||
      !phone ||
      !/^[6-9]\d{9}$/.test(phone) ||
      !address ||
      !pincode ||
      !/^\d{6}$/.test(pincode) ||
      !city ||
      !state ||
      (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail))
    ) {
      return NextResponse.json(
        { success: false, message: 'Please check your delivery details and try again.' },
        { status: 400 },
      )
    }

    const pincodeVerification = await verifyPincode(pincode)

    if (pincodeVerification.status === 'error') {
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to verify pincode right now. Please try again.',
        },
        { status: 503 },
      )
    }

    if (pincodeVerification.status === 'invalid') {
      return NextResponse.json(
        {
          success: false,
          message: 'Please enter a valid pincode.',
        },
        { status: 400 },
      )
    }

    if (state !== pincodeVerification.state) {
      return NextResponse.json(
        {
          success: false,
          message: 'State does not match the pincode.',
        },
        { status: 400 },
      )
    }


    if (!Array.isArray(body?.items) || body.items.length === 0 || body.items.length > MAX_ITEMS) {
      return NextResponse.json(
        { success: false, message: 'Your cart is invalid. Please refresh and try again.' },
        { status: 400 },
      )
    }

    const slugs = [...new Set<string>(body.items.map((item: any) => readText(item?.product_slug, 100)).filter((value: string | null): value is string => Boolean(value)))]
    if (slugs.length !== body.items.length) {
      return NextResponse.json({ success: false, message: 'Your cart has an invalid product.' }, { status: 400 })
    }

    const [{ data: statuses, error: statusError }, { data: skuRows, error: skuError }] = await Promise.all([
      supabaseAdmin.from('product_status').select('product_slug, status, stock_quantity, mrp, price, gst_rate').in('product_slug', slugs),
      supabaseAdmin.from('product_skus').select('id, product_slug, sku_code, pack_size_value, pack_size_unit, mrp, online_price, gst_rate, shipping_weight_kg, status, sku_inventory(stock_quantity)').in('product_slug', slugs).eq('status', 'active'),
    ])
    if (statusError || skuError) {
      console.error('Failed to verify product/SKU availability:', statusError || skuError)
      return NextResponse.json({ success: false, message: 'Unable to verify your cart right now. Please try again.' }, { status: 503 })
    }

    const statusBySlug = new Map((statuses || []).map((item: any) => [item.product_slug, item]))
    const skuById = new Map((skuRows || []).map((item: any) => [item.id, item]))
    const activeSkuSlugs = new Set((skuRows || []).map((item: any) => item.product_slug))
    const seen = new Set<string>()
    const orderItems: any[] = []

    for (const submittedItem of body.items) {
      const slug = readText(submittedItem?.product_slug, 100)
      const skuId = readText(submittedItem?.sku_id, 64)
      const quantity = submittedItem?.quantity
      const key = slug + ':' + (skuId || 'legacy')
      if (!slug || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_PRODUCT || seen.has(key)) {
        return NextResponse.json({ success: false, message: 'Your cart has an invalid product or quantity.' }, { status: 400 })
      }

      const product = ALL_PRODUCTS.find((item) => item.slug === slug)
      const managed = statusBySlug.get(slug)
      if (!product || !managed) {
        return NextResponse.json({ success: false, message: 'Your cart contains a product we could not verify.' }, { status: 409 })
      }
      if (['hidden', 'coming-soon'].includes(managed.status)) {
        return NextResponse.json({ success: false, message: 'A product in your cart is no longer available. Please refresh your cart.' }, { status: 409 })
      }

      let unitPrice = Number(managed.price ?? product.price)
      let mrp = Number(managed.mrp ?? product.mrp ?? product.price)
      let gstRate = Number(managed.gst_rate ?? product.gstRate ?? 0)
      const snapshot: any = {
        product_slug: slug, product_name: product.name, quantity, unit_price: unitPrice,
        mrp, gst_rate: gstRate, image: product.image, shipping_weight_kg: null,
      }

      if (skuId) {
        const sku = skuById.get(skuId)
        if (!sku || sku.product_slug !== slug || sku.status !== 'active') {
          return NextResponse.json({ success: false, message: 'The selected pack is no longer available. Please refresh your cart.' }, { status: 409 })
        }
        unitPrice = Number(sku.online_price)
        mrp = Number(sku.mrp)
        gstRate = Number(sku.gst_rate)
        const inventory = Array.isArray(sku.sku_inventory) ? sku.sku_inventory[0] : sku.sku_inventory
        const available = inventory?.stock_quantity ?? managed.stock_quantity
        if (available != null && available < quantity) {
          return NextResponse.json({ success: false, message: 'There is not enough stock for the selected pack.' }, { status: 409 })
        }
        Object.assign(snapshot, {
          sku_id: sku.id, sku_code: sku.sku_code,
          pack_size_value: Number(sku.pack_size_value), pack_size_unit: sku.pack_size_unit,
          shipping_weight_kg: sku.shipping_weight_kg == null ? null : Number(sku.shipping_weight_kg),
        })
      } else if (activeSkuSlugs.has(slug)) {
        return NextResponse.json({ success: false, message: 'Please select a pack size for ' + product.name + '. Refresh the product page and choose a pack.' }, { status: 409 })
      } else if (managed.status === 'out-of-stock' || (managed.stock_quantity != null && managed.stock_quantity < quantity)) {
        return NextResponse.json({ success: false, message: 'There is not enough stock for one of the products in your cart.' }, { status: 409 })
      }

      if (!Number.isFinite(unitPrice) || unitPrice <= 0 || !Number.isFinite(mrp) || mrp < unitPrice || !Number.isFinite(gstRate) || gstRate < 0 || gstRate > 100) {
        return NextResponse.json({ success: false, message: 'A product in your cart has invalid pricing. Please try again.' }, { status: 409 })
      }
      snapshot.unit_price = unitPrice
      snapshot.mrp = mrp
      snapshot.gst_rate = gstRate
      orderItems.push(snapshot)
      seen.add(key)
    }

    const productTotal = roundCurrency(
      orderItems.reduce((total, item) => total + item.unit_price * item.quantity, 0),
    )
    const mrpTotal = roundCurrency(
      orderItems.reduce((total, item) => total + item.mrp * item.quantity, 0),
    )
    const taxableValue = roundCurrency(
      orderItems.reduce((total, item) => {
        const rate = item.gst_rate / 100
        return total + (item.unit_price / (1 + rate)) * item.quantity
      }, 0),
    )
    const gstTotal = roundCurrency(productTotal - taxableValue)
    const isTamilNadu = state === 'Tamil Nadu'
    const cgst = isTamilNadu ? roundCurrency(gstTotal / 2) : 0
    const sgst = isTamilNadu ? roundCurrency(gstTotal / 2) : 0
    const igst = isTamilNadu ? 0 : gstTotal
    const deliveryCharge =
      productTotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING
    const total = roundCurrency(productTotal + deliveryCharge)

    const { data: orderResult, error: insertError } = await supabaseAdmin.rpc(
      'create_order_with_stock',
      {
        p_order: {
          user_id: user?.id ?? null,
          customer_name: customerName,
          customer_email: customerEmail,
          phone,
          address,
          pincode,
          city,
          state,
          items: orderItems,
          mrp_total: mrpTotal,
          product_total: productTotal,
          taxable_value: taxableValue,
          gst_total: gstTotal,
          cgst,
          sgst,
          igst,
          delivery_charge: deliveryCharge,
          total,
        },
        p_items: orderItems.map((item) => ({
          product_slug: item.product_slug,
          sku_id: item.sku_id || null,
          quantity: item.quantity,
        })),
      },
    )

    if (insertError || !orderResult?.success || !orderResult?.order_id) {
      console.error('Failed to create order:', insertError || orderResult)
      const stockConflict =
        orderResult?.message?.includes('stock') ||
        insertError?.message?.includes('INSUFFICIENT_STOCK')

      return NextResponse.json(
        {
          success: false,
          message: stockConflict
            ? orderResult?.message ||
              'There is not enough stock for one of the products in your cart. Please update the quantity and try again.'
            : orderResult?.message ||
              'Unable to place your order. Please try again.',
        },
        { status: stockConflict ? 409 : 500 },
      )
    }

    const order = { id: orderResult.order_id }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        items: orderItems,
        mrp_total: mrpTotal,
        product_total: productTotal,
        taxable_value: taxableValue,
        gst_total: gstTotal,
        cgst,
        sgst,
        igst,
        delivery_charge: deliveryCharge,
        total,
      },
    })
  } catch (error) {
    console.error('Order creation failed:', error)
    return NextResponse.json(
      { success: false, message: 'Unable to place your order. Please try again.' },
      { status: 500 },
    )
  }
}
