'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TenooRetailerInvoice from '@/components/invoices/tenoo-retailer-invoice'

export default function RetailerInvoicePage() {
  const params = useParams<{ id: string }>()
  const [order, setOrder] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'denied' | 'error'>('loading')

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      if (user.email !== 'info@tenoo.in') {
        setStatus('denied')
        return
      }

      const { data, error } = await supabase
        .from('retailer_orders')
        .select('*, retailers(*), retailer_order_items(*)')
        .eq('id', params.id)
        .single()

      if (error || !data) {
        console.error('Failed to load retailer invoice:', error)
        setStatus('error')
        return
      }

      const { data: allocations } = await supabase
        .from('retailer_payment_allocations')
        .select('amount, retailer_payments(amount, payment_date, payment_method, reference)')
        .eq('retailer_order_id', params.id)

      setOrder(data)
      setPayments(allocations || [])
      setStatus('ready')
    }

    if (params?.id) void load()
  }, [params?.id])

  if (status === 'loading') {
    return <main className="min-h-screen grid place-items-center">Loading invoice…</main>
  }

  if (status === 'denied') {
    return <main className="min-h-screen grid place-items-center p-6 text-center">Admin access only.</main>
  }

  if (status === 'error') {
    return <main className="min-h-screen grid place-items-center p-6 text-center">Unable to load this retailer invoice.</main>
  }

  return <TenooRetailerInvoice order={order} payments={payments} />
}
