'use client'

import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { WHATSAPP_URL } from '@/lib/site'

export default function HelpPage() {
  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-background px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">
              Help & Support
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Need help with your Tenoo order? We’re here to help.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border bg-background p-5 shadow-sm">
              <h2 className="font-semibold">
                📦 Order Support
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Questions about your order, delivery or tracking?
              </p>

              <Link
                href="/account/orders"
                className="mt-4 inline-flex rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
              >
                View My Orders
              </Link>
            </div>

            <div className="rounded-2xl border bg-background p-5 shadow-sm">
              <h2 className="font-semibold">
                💬 WhatsApp Support
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Chat with Tenoo support directly on WhatsApp.
              </p>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                WhatsApp Us →
              </a>
            </div>

            <div className="rounded-2xl border bg-background p-5 shadow-sm">
              <h2 className="font-semibold">
                🏠 Delivery Address
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Need to update your delivery address?
              </p>

              <Link
                href="/account/addresses"
                className="mt-4 inline-flex rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
              >
                Manage Address
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}