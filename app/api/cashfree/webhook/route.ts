import { NextResponse } from 'next/server'
import { finalizeCashfreePayment, verifyCashfreeWebhookSignature } from '@/lib/cashfree-server'

export async function POST(request: Request) {
  const rawBody = await request.text()
  if (!verifyCashfreeWebhookSignature(rawBody, request.headers.get('x-webhook-signature'), request.headers.get('x-webhook-timestamp'))) {
    return NextResponse.json({ success: false, message: 'Invalid webhook signature.' }, { status: 401 })
  }

  try {
    const payload = JSON.parse(rawBody)
    const orderId = payload?.data?.order?.order_id
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ success: false, message: 'Missing Cashfree order ID.' }, { status: 400 })
    }

    // Verify payment server-side and create the paid order only after validation.
    await finalizeCashfreePayment(orderId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cashfree webhook processing failed:', error)
    return NextResponse.json({ success: false, message: 'Webhook processing failed.' }, { status: 500 })
  }
}
