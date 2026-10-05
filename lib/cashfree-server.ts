import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const API_VERSION = '2025-01-01'

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase server configuration is missing')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function config() {
  const appId = process.env.CASHFREE_APP_ID
  const secretKey = process.env.CASHFREE_SECRET_KEY
  if (!appId || !secretKey) throw new Error('Cashfree server configuration is missing')
  return {
    appId,
    secretKey,
    baseUrl: process.env.CASHFREE_ENV === 'production'
      ? 'https://api.cashfree.com'
      : 'https://sandbox.cashfree.com',
  }
}

async function cf(path: string, init: RequestInit = {}) {
  const { appId, secretKey, baseUrl } = config()
  const response = await fetch(baseUrl + path, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-client-id': appId,
      'x-client-secret': secretKey,
      'x-api-version': API_VERSION,
      ...(init.headers || {}),
    },
    cache: 'no-store',
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message || data?.message_description || ('Cashfree API error ' + response.status))
  return data
}

export function verifyCashfreeWebhookSignature(rawBody: string, signature: string | null, timestamp: string | null) {
  const { secretKey } = config()
  if (!signature || !timestamp) return false
  const expected = createHmac('sha256', secretKey).update(timestamp + rawBody).digest('base64')
  const actual = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer)
}

export async function createCashfreeOrder(input: {
  orderId: string
  amount: number
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  returnUrl: string
  notifyUrl: string
}) {
  return cf('/pg/orders', {
    method: 'POST',
    body: JSON.stringify({
      order_amount: input.amount,
      order_currency: 'INR',
      order_id: input.orderId,
      customer_details: {
        customer_id: input.customerId,
        customer_name: input.customerName,
        customer_email: input.customerEmail || undefined,
        customer_phone: input.customerPhone,
      },
      order_meta: { return_url: input.returnUrl, notify_url: input.notifyUrl },
    }),
  })
}

export async function getCashfreeOrder(orderId: string) {
  return cf('/pg/orders/' + encodeURIComponent(orderId), { method: 'GET' })
}

export async function getCashfreePayments(orderId: string) {
  return cf('/pg/orders/' + encodeURIComponent(orderId) + '/payments', { method: 'GET' })
}

export async function finalizeCashfreePayment(cashfreeOrderId: string) {
  const db = getSupabaseAdmin()
  const { data: intent, error } = await db
    .from('cashfree_payment_intents')
    .select('*')
    .eq('cashfree_order_id', cashfreeOrderId)
    .maybeSingle()

  if (error) throw error
  if (!intent) throw new Error('Payment intent not found')
  if (intent.order_id) return { status: 'paid', orderId: intent.order_id }

  const order = await getCashfreeOrder(cashfreeOrderId)
  const payments = await getCashfreePayments(cashfreeOrderId)
  const success = Array.isArray(payments)
    ? payments.find((p: any) => p?.payment_status === 'SUCCESS')
    : null

  const amountMatches =
    Number(order?.order_amount) === Number(intent.total) &&
    Number(success?.payment_amount) === Number(intent.total)

  if (order?.order_status !== 'PAID' || !success || !amountMatches) {
    const status = order?.order_status === 'EXPIRED' || order?.order_status === 'TERMINATED'
      ? 'failed'
      : 'pending'
    await db.from('cashfree_payment_intents').update({
      status,
      cashfree_payment_status: success?.payment_status || order?.order_status || null,
      updated_at: new Date().toISOString(),
    }).eq('id', intent.id)
    return { status, orderId: null }
  }

  const { data: result, error: rpcError } = await db.rpc(
    'create_paid_order_with_stock',
    { p_payment_intent_id: intent.id },
  )
  if (rpcError) throw rpcError
  if (!result?.success || !result?.order_id) {
    throw new Error(result?.message || 'Unable to create the paid order')
  }

  await db.from('cashfree_payment_intents').update({
    status: 'paid',
    order_id: result.order_id,
    cashfree_payment_id: String(success.cf_payment_id || ''),
    cashfree_payment_status: success.payment_status,
    updated_at: new Date().toISOString(),
  }).eq('id', intent.id).is('order_id', null)

  return { status: 'paid', orderId: result.order_id }
}
