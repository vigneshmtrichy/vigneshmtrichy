import { NextResponse } from 'next/server'
import { finalizeCashfreePayment, verifyCashfreeWebhookSignature } from '@/lib/cashfree-server'

const escapeHtml = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char] as string)

async function notifyOwnerOfPaidOrder(input: {
  cashfreeOrderId: string
  internalOrderId: string | number
  amount: unknown
  paymentId: unknown
  customerName: unknown
}) {
  const apiKey = process.env.RESEND_API_KEY
  const recipient = process.env.TENOO_ORDER_NOTIFICATION_EMAIL
  const sender = process.env.TENOO_EMAIL_FROM

  // Payment confirmation must not depend on the optional email provider being configured.
  if (!apiKey || !recipient || !sender) {
    console.warn('Tenoo order email not sent: configure RESEND_API_KEY, TENOO_ORDER_NOTIFICATION_EMAIL and TENOO_EMAIL_FROM in Vercel.')
    return
  }

  const amount = Number(input.amount)
  const amountText = Number.isFinite(amount) ? '₹' + amount.toFixed(2) : 'See Cashfree payment details'
  const orderId = escapeHtml(input.internalOrderId)
  const cfOrderId = escapeHtml(input.cashfreeOrderId)
  const paymentId = escapeHtml(input.paymentId || 'Not provided')
  const customerName = escapeHtml(input.customerName || 'Customer')
  const subject = 'Tenoo: Payment successful - Order #' + String(input.internalOrderId)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      'Idempotency-Key': 'tenoo-paid-order-' + input.cashfreeOrderId,
    },
    body: JSON.stringify({
      from: sender,
      to: [recipient],
      subject,
      text: [
        'A Tenoo customer payment was verified successfully.',
        'Tenoo order: #' + String(input.internalOrderId),
        'Amount: ' + amountText,
        'Customer: ' + String(input.customerName || 'Customer'),
        'Cashfree order ID: ' + input.cashfreeOrderId,
        'Cashfree payment ID: ' + String(input.paymentId || 'Not provided'),
      ].join('\n'),
      html: '<h2>Tenoo payment successful</h2>' +
        '<p>A customer payment has been verified by Cashfree.</p>' +
        '<p><strong>Tenoo order:</strong> #' + orderId + '</p>' +
        '<p><strong>Amount:</strong> ' + escapeHtml(amountText) + '</p>' +
        '<p><strong>Customer:</strong> ' + customerName + '</p>' +
        '<p><strong>Cashfree order ID:</strong> ' + cfOrderId + '</p>' +
        '<p><strong>Cashfree payment ID:</strong> ' + paymentId + '</p>',
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error('Order notification email failed (' + response.status + '): ' + details.slice(0, 300))
  }
}

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

    // This calls Cashfree's server API and verifies the final order/payment amount;
    // the webhook payload alone is never treated as proof of payment.
    const result = await finalizeCashfreePayment(orderId)

    if (result.status === 'paid' && result.orderId) {
      const payment = payload?.data?.payment
      try {
        await notifyOwnerOfPaidOrder({
          cashfreeOrderId: orderId,
          internalOrderId: result.orderId,
          amount: payment?.payment_amount ?? payload?.data?.order?.order_amount,
          paymentId: payment?.cf_payment_id,
          customerName: payload?.data?.customer_details?.customer_name,
        })
      } catch (error) {
        // Ask Cashfree to retry transient email failures. Resend's idempotency key
        // prevents duplicate notifications when the webhook is delivered repeatedly.
        console.error('Tenoo paid-order notification failed:', error)
        return NextResponse.json({ success: false, message: 'Notification failed; retry webhook.' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cashfree webhook processing failed:', error)
    return NextResponse.json({ success: false, message: 'Webhook processing failed.' }, { status: 500 })
  }
}
