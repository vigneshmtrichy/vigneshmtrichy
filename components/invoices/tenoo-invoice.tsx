'use client'

type InvoiceProps = {
  order: any
  backHref?: string
  backLabel?: string
}

const money = (value: any, decimals = 0) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

export default function TenooInvoice({
  order,
  backHref = '/account/orders',
  backLabel = 'Back to My Orders',
}: InvoiceProps) {
  const items = Array.isArray(order.items) ? order.items : []

  const mrpTotal = Number(order.mrp_total || 0)
  const productTotal = Number(order.product_total || 0)
  const savings = Math.max(mrpTotal - productTotal, 0)

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          html,
          body {
            background: #fff !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .invoice-page {
            min-height: auto !important;
            padding: 0 !important;
            background: #fff !important;
          }

          .invoice-shell {
            max-width: none !important;
            margin: 0 !important;
          }

          .invoice-card {
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 0 !important;
          }

          .print-hidden {
            display: none !important;
          }

          .invoice-section,
          .invoice-summary,
          .invoice-footer {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .invoice-products {
            break-inside: auto;
          }

          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <main className="invoice-page min-h-screen bg-muted/30 px-3 py-5 text-foreground sm:px-6 sm:py-10">
        <div className="invoice-shell mx-auto max-w-4xl">

          {/* ACTIONS */}
          <div className="print-hidden mb-4 flex flex-col-reverse gap-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <a
              href={backHref}
              className="inline-flex w-full items-center justify-center rounded-xl border bg-background px-5 py-3 text-sm font-semibold transition hover:bg-muted sm:w-auto"
            >
              ← {backLabel}
            </a>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 sm:w-auto"
            >
              🖨️ Print / Save as PDF
            </button>
          </div>

          {/* INVOICE */}
          <div className="invoice-card overflow-hidden rounded-2xl border bg-background p-4 shadow-sm sm:p-8">

            {/* HEADER */}
            <div className="invoice-section flex flex-col gap-6 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">

              <div className="min-w-0">

                <img
                  src="/tenoo-logo.png"
                  alt="TENOO"
                  className="h-14 w-auto max-w-[180px] object-contain sm:h-16"
                />

                <p className="mt-2 text-xs font-medium text-muted-foreground sm:text-sm">
                  Good Food. Made for Every Generation.
                </p>

                <div className="mt-4 space-y-0.5 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">

                  <p className="font-semibold text-foreground">
                    Tenoo Ventures
                  </p>

                  <p>
                    7/2, East Street, Nithyanandapuram,
                    <br className="sm:hidden" />
                    {' '}Varaganeri, Trichy - 620008
                  </p>

                  <p>Email: info@tenoo.in</p>

                  <p>Phone: +91 9585808590</p>

                  <p>FSSAI No: 22426590000330</p>

                </div>
              </div>

              {/* INVOICE DETAILS */}
              <div className="sm:min-w-[245px] sm:text-right">

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Tax Invoice
                </p>

                <div className="mt-3 space-y-1 text-sm">

                  <div className="flex justify-between gap-6 sm:justify-end">
                    <span className="text-muted-foreground">
                      Invoice No.
                    </span>

                    <span className="font-medium">
                      TENOO{String(order.id).padStart(5, '0')}
                    </span>
                  </div>

                  <div className="flex justify-between gap-6 sm:justify-end">
                    <span className="text-muted-foreground">
                      Invoice Date
                    </span>

                    <span className="font-medium">
                      {formatDate(order.created_at)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-6 sm:justify-end">
                    <span className="text-muted-foreground">
                      Order No.
                    </span>

                    <span className="font-medium">
                      #{order.id}
                    </span>
                  </div>

                </div>
              </div>

            </div>

            {/* BILL TO / SHIP TO */}
            <div className="invoice-section grid gap-3 border-b py-5 sm:grid-cols-2 sm:gap-5 sm:py-6">

              {/* BILL TO */}
              <div className="rounded-xl border bg-muted/20 p-4">

                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Bill To
                </h3>

                <div className="mt-3 space-y-1 text-sm">

                  <p className="font-semibold">
                    {order.customer_name}
                  </p>

                  {order.customer_email && (
                    <p className="break-all text-muted-foreground">
                      {order.customer_email}
                    </p>
                  )}

                  <p className="text-muted-foreground">
                    {order.phone}
                  </p>

                </div>
              </div>

              {/* SHIP TO */}
              <div className="rounded-xl border bg-muted/20 p-4">

                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Ship To
                </h3>

                <div className="mt-3 text-sm leading-relaxed text-muted-foreground">

                  <p className="text-foreground">
                    {order.address}
                  </p>

                  <p>
                    {order.city}, {order.state}
                  </p>

                  <p>
                    {order.pincode}
                  </p>

                </div>
              </div>

            </div>

            {/* PRODUCTS */}
            <div className="invoice-products py-5 sm:py-6">

              <div className="mb-3">
                <h3 className="text-sm font-semibold">
                  Products
                </h3>
              </div>

              {/* DESKTOP TABLE */}
              <div className="hidden overflow-hidden rounded-xl border sm:block">

                <table className="w-full text-sm">

                  <thead className="bg-muted/40">

                    <tr className="border-b text-left">

                      <th className="px-4 py-3 font-semibold">
                        Product
                      </th>

                      <th className="px-4 py-3 text-center font-semibold">
                        Qty
                      </th>

                      <th className="px-4 py-3 text-right font-semibold">
                        Unit Price
                      </th>

                      <th className="px-4 py-3 text-right font-semibold">
                        Total
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {items.map((item: any, index: number) => {

                      const qty = Number(item.quantity || 0)
                      const unitPrice = Number(item.unit_price || 0)
                      const amount = qty * unitPrice

                      return (
                        <tr
                          key={index}
                          className="border-b last:border-0"
                        >

                          <td className="px-4 py-4 font-medium">
                            {item.product_name || 'Product'}
                          </td>

                          <td className="px-4 py-4 text-center">
                            {qty}
                          </td>

                          <td className="px-4 py-4 text-right">
                            {money(unitPrice)}
                          </td>

                          <td className="px-4 py-4 text-right font-semibold">
                            {money(amount)}
                          </td>

                        </tr>
                      )
                    })}

                  </tbody>

                </table>

              </div>

              {/* MOBILE PRODUCTS */}
              <div className="space-y-3 sm:hidden">

                {items.map((item: any, index: number) => {

                  const qty = Number(item.quantity || 0)
                  const unitPrice = Number(item.unit_price || 0)
                  const amount = qty * unitPrice

                  return (
                    <div
                      key={index}
                      className="rounded-xl border bg-muted/10 p-4"
                    >

                      <p className="font-semibold leading-snug">
                        {item.product_name || 'Product'}
                      </p>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">

                        <div>
                          <p className="text-muted-foreground">
                            Qty
                          </p>

                          <p className="mt-0.5 font-medium">
                            {qty}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">
                            Unit Price
                          </p>

                          <p className="mt-0.5 font-medium">
                            {money(unitPrice)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-muted-foreground">
                            Amount
                          </p>

                          <p className="mt-0.5 font-semibold">
                            {money(amount)}
                          </p>
                        </div>

                      </div>

                    </div>
                  )
                })}

              </div>

            </div>

            {/* SUMMARY */}
            <div className="invoice-summary border-t pt-5 sm:pt-6">

              <div className="ml-auto w-full max-w-sm rounded-xl border bg-muted/20 p-4 sm:p-5">

                <div className="space-y-2.5 text-sm">

                  <div className="flex justify-between gap-6">
                    <span className="text-muted-foreground">
                      MRP Total
                    </span>

                    <span>
                      {money(mrpTotal)}
                    </span>
                  </div>

                  {savings > 0 && (
                    <div className="flex justify-between gap-6">

                      <span className="font-medium text-green-700">
                        You Saved
                      </span>

                      <span className="font-medium text-green-700">
                        -{money(savings)}
                      </span>

                    </div>
                  )}

                  <div className="flex justify-between gap-6">

                    <span className="text-muted-foreground">
                      Product Total
                    </span>

                    <span>
                      {money(productTotal)}
                    </span>

                  </div>

                  <div className="flex justify-between gap-6">

                    <span className="text-muted-foreground">
                      Taxable Value
                    </span>

                    <span>
                      {money(order.taxable_value, 2)}
                    </span>

                  </div>

                  {Number(order.cgst || 0) > 0 && (
                    <div className="flex justify-between gap-6">

                      <span className="text-muted-foreground">
                        CGST
                      </span>

                      <span>
                        {money(order.cgst, 2)}
                      </span>

                    </div>
                  )}

                  {Number(order.sgst || 0) > 0 && (
                    <div className="flex justify-between gap-6">

                      <span className="text-muted-foreground">
                        SGST
                      </span>

                      <span>
                        {money(order.sgst, 2)}
                      </span>

                    </div>
                  )}

                  {Number(order.igst || 0) > 0 && (
                    <div className="flex justify-between gap-6">

                      <span className="text-muted-foreground">
                        IGST
                      </span>

                      <span>
                        {money(order.igst, 2)}
                      </span>

                    </div>
                  )}

                  <div className="flex justify-between gap-6">

                    <span className="text-muted-foreground">
                      Delivery
                    </span>

                    <span>
                      {Number(order.delivery_charge || 0) === 0
                        ? 'FREE'
                        : money(order.delivery_charge)}
                    </span>

                  </div>

                </div>

                {/* GRAND TOTAL */}
                <div className="mt-4 flex items-center justify-between gap-6 border-t pt-4">

                  <span className="text-base font-semibold">
                    Grand Total
                  </span>

                  <span className="text-xl font-bold text-primary">
                    {money(order.total)}
                  </span>

                </div>

              </div>

            </div>

            {/* PAYMENT / STATUS */}
            <div className="invoice-footer mt-6 border-t pt-5 sm:mt-8 sm:pt-6">

              <div className="grid gap-3 sm:grid-cols-2">

                <div className="rounded-xl border bg-muted/20 px-4 py-3">

                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Payment Method
                  </p>

                  <p className="mt-1 text-sm font-semibold capitalize">
                    {order.payment_method}
                  </p>

                </div>

                <div className="rounded-xl border bg-muted/20 px-4 py-3">

                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Order Status
                  </p>

                  <p className="mt-1 text-sm font-semibold capitalize">
                    {order.order_status}
                  </p>

                </div>

              </div>

              {/* FOOTER */}
              <div className="mt-6 border-t pt-5 text-center">

                <p className="text-sm font-semibold">
                  Thank you for choosing TENOO.
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Good Food. Made for Every Generation.
                </p>

                <p className="mt-2 text-xs font-medium text-primary">
                  www.tenoo.in
                </p>

              </div>

            </div>

          </div>

        </div>
      </main>
    </>
  )
}