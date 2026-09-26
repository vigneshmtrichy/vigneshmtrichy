'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TenooInvoice from '@/components/invoices/tenoo-invoice'

export default function InvoicePage() {
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (error) {
        console.error('Failed to load admin invoice:', error)
        setLoading(false)
        return
      }

      setOrder(data)
      setLoading(false)
    }

    loadOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading invoice...
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Order not found.
      </div>
    )
  }

  return (
    <TenooInvoice
      order={order}
      backHref="/admin/orders"
      backLabel="Back to Orders"
    />
  )
}