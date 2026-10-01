import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import TenooRetailerInvoice from '@/components/invoices/tenoo-retailer-invoice'

type Props = { params: Promise<{ id: string }> }

export default async function RetailerInvoicePage({ params }: Props) {
  const { id } = await params
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: order, error } = await supabase
    .from('retailer_orders')
    .select('*, retailers(*), retailer_order_items(*)')
    .eq('id', id)
    .single()

  if (error || !order) notFound()

  return <TenooRetailerInvoice order={order} />
}
