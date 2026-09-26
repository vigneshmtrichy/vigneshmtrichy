import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Order ID is required',
        },
        { status: 400 },
      )
    }

    // 1. Get the actual TENOO order from Supabase
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        {
          success: false,
          message: 'Order not found',
        },
        { status: 404 },
      )
    }

    // Prevent duplicate Shiprocket orders
    if (order.shiprocket_order_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'This order is already connected to Shiprocket',
          data: {
            shiprocket_order_id: order.shiprocket_order_id,
            shiprocket_shipment_id:
              order.shiprocket_shipment_id || null,
          },
        },
        { status: 409 },
      )
    }

    const items = Array.isArray(order.items)
      ? order.items
      : []

    if (!items.length) {
      return NextResponse.json(
        {
          success: false,
          message: 'No products found in this order',
        },
        { status: 400 },
      )
    }

    // 2. Get Shiprocket API token
    const authResponse = await fetch(
      'https://apiv2.shiprocket.in/v1/external/auth/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: process.env.SHIPROCKET_API_EMAIL,
          password: process.env.SHIPROCKET_API_PASSWORD,
        }),
      },
    )

    const authData = await authResponse.json()

    if (!authResponse.ok || !authData?.token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Shiprocket authentication failed',
          details: authData,
        },
        { status: 500 },
      )
    }

    const token = authData.token

    // 3. Convert TENOO order items to Shiprocket items
    const shiprocketItems = items.map((item: any) => ({
      name: item.product_name,
      sku: item.product_slug,
      units: Number(item.quantity || 1),
      selling_price: Number(item.unit_price || 0),
      discount: 0,
      tax: 0,
      hsn: '21069099',
    }))

    const subTotal = items.reduce(
      (total: number, item: any) =>
        total +
        Number(item.unit_price || 0) *
          Number(item.quantity || 0),
      0,
    )

    // Temporary development weight.
    // Replace with actual packed weight once products arrive.
    const shipmentWeight = 0.5

    // 4. Create order in Shiprocket
    const orderResponse = await fetch(
      'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: `TENOO-${order.id}`,
          order_date: order.created_at || new Date().toISOString(),
          pickup_location: 'Home',

          billing_customer_name: order.customer_name,
          billing_last_name: '',
          billing_address: order.address,
          billing_address_2: '',
          billing_city: order.city,
          billing_pincode: order.pincode,
          billing_state: order.state,
          billing_country: 'India',
          billing_email:
            order.customer_email || 'info@tenoo.in',
          billing_phone: order.phone,

          shipping_is_billing: true,

          order_items: shiprocketItems,

          payment_method:
            order.payment_method === 'COD'
              ? 'COD'
              : 'Prepaid',

          sub_total: subTotal,

          length: 20,
          breadth: 15,
          height: 10,
          weight: shipmentWeight,
        }),
      },
    )

    const orderData = await orderResponse.json()

    if (!orderResponse.ok || !orderData?.order_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Shiprocket order creation failed',
          details: orderData,
        },
        { status: 500 },
      )
    }

    console.log('Shiprocket orderData:', orderData)

    // 5. Save Shiprocket IDs back to TENOO order
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        shiprocket_order_id: String(orderData.order_id),
        shiprocket_shipment_id: orderData.shipment_id
          ? String(orderData.shipment_id)
          : null,
        shipping_method: 'shiprocket',
      })
      .eq('id', order.id)

    if (updateError) {
      console.error(
        'Failed to save Shiprocket IDs:',
        updateError,
      )

      return NextResponse.json(
        {
          success: false,
          message:
            'Shiprocket order created, but failed to save the Shiprocket IDs in TENOO.',
          details: updateError.message,
          shiprocket: orderData,
        },
        { status: 500 },
      )
    }

   return NextResponse.json({
  success: true,
  message: 'Shiprocket order created successfully',
  data: {
    order_id: orderData.order_id,
    shipment_id: orderData.shipment_id || null,
    shiprocket_response: orderData,
  },
})
  } catch (error) {
    console.error(
      'Shiprocket create order error:',
      error,
    )

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to create Shiprocket order',
      },
      { status: 500 },
    )
  }
}