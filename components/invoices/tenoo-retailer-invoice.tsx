'use client'

type Props = { order: any; payments?: any[] }

const money = (value: unknown, decimals = 2) =>
  '₹' + Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

const dateText = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

const paymentLabel = (value: string) =>
  String(value || '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export default function TenooRetailerInvoice({ order, payments = [] }: Props) {
  const retailer = order.retailers || {}
  const items = Array.isArray(order.retailer_order_items) ? order.retailer_order_items : []
  const taxableValue = Number(order.taxable_value ?? order.subtotal ?? 0)
  const cgst = Number(order.cgst || 0)
  const sgst = Number(order.sgst || 0)
  const igst = Number(order.igst || 0)
  const gstTotal = Number(order.gst_total ?? (cgst + sgst + igst))
  const total = Number(order.total || 0)
  const paidAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const balanceDue = Math.max(total - paidAmount, 0)

  return (
    <>
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          html, body { background: #fff !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .retailer-invoice-page { min-height: auto !important; padding: 0 !important; background: #fff !important; }
          .retailer-invoice-shell { max-width: none !important; margin: 0 !important; }
          .retailer-invoice-card { border: 0 !important; border-radius: 0 !important; box-shadow: none !important; padding: 0 !important; }
          .print-hidden { display: none !important; }
          .keep-together, tr { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      <main className="retailer-invoice-page min-h-screen bg-muted/30 px-3 py-5 text-foreground sm:px-6 sm:py-10">
        <div className="retailer-invoice-shell mx-auto max-w-4xl">
          <div className="print-hidden mb-4 flex flex-col-reverse gap-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <a href="/admin/retailer-orders" className="inline-flex w-full items-center justify-center rounded-xl border bg-background px-5 py-3 text-sm font-semibold hover:bg-muted sm:w-auto">
              ← Back to Retailer Orders
            </a>
            <button type="button" onClick={() => window.print()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 sm:w-auto">
              🖨️ Print / Save as PDF
            </button>
          </div>

          <div className="retailer-invoice-card overflow-hidden rounded-2xl border bg-background p-4 shadow-sm sm:p-8">
            <div className="keep-together flex flex-col gap-6 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <img src="/tenoo-logo.png" alt="TENOO" className="h-14 w-auto max-w-[180px] object-contain sm:h-16" />
                <p className="mt-2 text-xs font-medium text-muted-foreground sm:text-sm">Good Food. Made for Every Generation.</p>
                <div className="mt-4 space-y-0.5 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                  <p className="font-semibold text-foreground">Tenoo Ventures</p>
                  <p>7/2, East Street, Nithyanandapuram,<br />Varaganeri, Trichy - 620008</p>
                  <p>Email: info@tenoo.in</p>
                  <p>Phone: +91 9585808590</p>
                  <p>FSSAI No: 22426590000330</p>
                </div>
              </div>

              <div className="sm:min-w-[255px] sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tax Invoice</p>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between gap-6 sm:justify-end"><span className="text-muted-foreground">Invoice No.</span><span className="font-medium">TENOO-R{String(order.id).padStart(5, '0')}</span></div>
                  <div className="flex justify-between gap-6 sm:justify-end"><span className="text-muted-foreground">Invoice Date</span><span className="font-medium">{dateText(order.created_at)}</span></div>
                  <div className="flex justify-between gap-6 sm:justify-end"><span className="text-muted-foreground">Order No.</span><span className="font-medium">#{order.id}</span></div>
                </div>
              </div>
            </div>

            <div className="keep-together grid gap-3 border-b py-5 sm:grid-cols-2 sm:gap-5 sm:py-6">
              <div className="rounded-xl border bg-muted/20 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Bill To</h3>
                <div className="mt-3 space-y-1 text-sm">
                  <p className="font-semibold">{retailer.billing_name || retailer.business_name}</p>
                  {retailer.contact_name && <p>{retailer.contact_name}</p>}
                  {retailer.phone && <p className="text-muted-foreground">{retailer.phone}</p>}
                  {retailer.email && <p className="break-all text-muted-foreground">{retailer.email}</p>}
                  {retailer.gstin && <p className="font-medium">GSTIN: {retailer.gstin}</p>}
                </div>
              </div>

              <div className="rounded-xl border bg-muted/20 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Billing Address</h3>
                <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {retailer.address && <p className="text-foreground">{retailer.address}</p>}
                  {(retailer.city || retailer.state) && <p>{[retailer.city, retailer.state].filter(Boolean).join(', ')}</p>}
                  {retailer.pincode && <p>{retailer.pincode}</p>}
                </div>
              </div>
            </div>

            <div className="py-5 sm:py-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Products</h3>
                <span className="text-xs text-muted-foreground">Retailer pricing (Excl. GST)</span>
              </div>

              <div className="hidden overflow-hidden rounded-xl border sm:block">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr className="border-b text-left">
                      <th className="px-4 py-3 font-semibold">Product</th>
                      <th className="px-4 py-3 text-center font-semibold">Qty</th>
                      <th className="px-4 py-3 text-right font-semibold">Unit Price</th>
                      <th className="px-4 py-3 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="px-4 py-4 font-medium">{item.product_name || 'Product'}</td>
                        <td className="px-4 py-4 text-center">{Number(item.quantity || 0)}</td>
                        <td className="px-4 py-4 text-right">{money(item.unit_price)}</td>
                        <td className="px-4 py-4 text-right font-semibold">{money(item.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 sm:hidden">
                {items.map((item: any) => (
                  <div key={item.id} className="rounded-xl border bg-muted/10 p-4">
                    <p className="font-semibold leading-snug">{item.product_name || 'Product'}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div><p className="text-muted-foreground">Qty</p><p className="mt-0.5 font-medium">{Number(item.quantity || 0)}</p></div>
                      <div><p className="text-muted-foreground">Unit Price</p><p className="mt-0.5 font-medium">{money(item.unit_price)}</p></div>
                      <div className="text-right"><p className="text-muted-foreground">Amount</p><p className="mt-0.5 font-semibold">{money(item.line_total)}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="keep-together border-t pt-5 sm:pt-6">
              <div className="ml-auto w-full max-w-sm rounded-xl border bg-muted/20 p-4 sm:p-5">
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between gap-6"><span className="text-muted-foreground">Taxable Value</span><span>{money(taxableValue)}</span></div>
                  {cgst > 0 && <div className="flex justify-between gap-6"><span className="text-muted-foreground">CGST (2.5%)</span><span>{money(cgst)}</span></div>}
                  {sgst > 0 && <div className="flex justify-between gap-6"><span className="text-muted-foreground">SGST (2.5%)</span><span>{money(sgst)}</span></div>}
                  {igst > 0 && <div className="flex justify-between gap-6"><span className="text-muted-foreground">IGST (5%)</span><span>{money(igst)}</span></div>}
                  {cgst + sgst + igst === 0 && <div className="flex justify-between gap-6"><span className="text-muted-foreground">GST</span><span>{money(gstTotal)}</span></div>}
                  <div className="flex justify-between gap-6 border-t pt-4"><span className="text-base font-semibold">Grand Total</span><span className="text-xl font-bold text-primary">{money(total)}</span></div>
                </div>
              </div>
            </div>

            <div className="keep-together mt-6 border-t pt-5 sm:mt-8 sm:pt-6">
              {payments.length > 0 && (
                <div className="mb-4 rounded-xl border bg-muted/20 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">Payments Received</p>
                    <p className="text-sm font-bold">{money(paidAmount)}</p>
                  </div>
                  <div className="space-y-2 text-xs">
                    {payments.map((payment: any, index: number) => {
                      const details = payment.retailer_payments || {}
                      return (
                        <div key={index} className="flex flex-wrap justify-between gap-3 border-t pt-2 first:border-t-0 first:pt-0">
                          <span>{details.payment_date ? dateText(details.payment_date) : 'Payment'} · {paymentLabel(details.payment_method)}</span>
                          <span className="font-semibold">{money(payment.amount)}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-3 flex justify-between border-t pt-3 text-sm font-semibold">
                    <span>Balance Due</span>
                    <span>{money(balanceDue)}</span>
                  </div>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border bg-muted/20 px-4 py-3"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Payment</p><p className="mt-1 text-sm font-semibold">{paymentLabel(order.payment_type)}</p></div>
                <div className="rounded-xl border bg-muted/20 px-4 py-3"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Payment Status</p><p className="mt-1 text-sm font-semibold capitalize">{order.payment_status}</p></div>
              </div>

              {order.notes && <div className="mt-3 rounded-xl border bg-muted/20 px-4 py-3"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Notes</p><p className="mt-1 text-sm">{order.notes}</p></div>}

              <div className="mt-6 border-t pt-5 text-center">
                <p className="text-sm font-semibold">Thank you for doing business with TENOO.</p>
                <p className="mt-1 text-xs text-muted-foreground">Good Food. Made for Every Generation.</p>
                <p className="mt-2 text-xs font-medium text-primary">www.tenoo.in</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
