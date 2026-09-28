import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      return NextResponse.json(
        { success: false, message: 'Cron secret is not configured.' },
        { status: 500 },
      )
    }

    const authorization = request.headers.get('authorization')

    if (authorization !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized.' },
        { status: 401 },
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const now = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({
        order_status: 'cancelled',
        pending_expires_at: null,
      })
      .eq('order_status', 'pending')
      .not('pending_expires_at', 'is', null)
      .lte('pending_expires_at', now)
      .select('id')

    if (error) {
      console.error('Failed to expire pending orders:', error)
      return NextResponse.json(
        { success: false, message: 'Unable to expire pending orders.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      cancelledOrderCount: data?.length || 0,
    })
  } catch (error) {
    console.error('Pending order expiry error:', error)

    return NextResponse.json(
      { success: false, message: 'Unable to process pending order expiry.' },
      { status: 500 },
    )
  }
}
