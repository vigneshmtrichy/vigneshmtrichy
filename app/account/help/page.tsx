'use client'

import Link from 'next/link'
import {
  Package,
  UserRound,
  MessageCircle,
  ChevronRight,
} from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { WHATSAPP_URL } from '@/lib/site'

export default function HelpPage() {
  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-background px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">
              Help & Support
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Need help with your Tenoo order or account? We’re here to help.
            </p>
          </div>

          {/* Support Options */}
          <div className="space-y-4">

            {/* Order Support */}
            <div className="rounded-2xl border bg-background p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <Package className="h-5 w-5 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">
                    Order Support
                  </h2>

                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    Check your order status, delivery details and tracking
                    information.
                  </p>

                  <Link
                    href="/account/orders"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
                  >
                    View My Orders
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Account Support */}
            <div className="rounded-2xl border bg-background p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <UserRound className="h-5 w-5 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">
                    Account & Address
                  </h2>

                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    Update your personal information and delivery address.
                  </p>

                  <Link
                    href="/account/profile"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
                  >
                    Manage My Account
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* WhatsApp Support */}
            <div className="rounded-2xl border bg-background p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">
                    WhatsApp Support
                  </h2>

                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    Have a question? Chat with Tenoo support directly on
                    WhatsApp.
                  </p>

                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    WhatsApp Us
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Quick Help */}
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold">
              Quick Help
            </h2>

            <div className="divide-y rounded-2xl border bg-background">

              <div className="p-5">
                <h3 className="text-sm font-semibold">
                  How can I track my order?
                </h3>

                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  Open My Orders to view your order status and tracking
                  details when available.
                </p>
              </div>

              <div className="p-5">
                <h3 className="text-sm font-semibold">
                  Can I change my delivery address?
                </h3>

                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  Yes. Go to My Account and update your delivery address
                  before placing your next order.
                </p>
              </div>

              <div className="p-5">
                <h3 className="text-sm font-semibold">
                  Need help with an existing order?
                </h3>

                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  Open My Orders first. If you still need assistance,
                  contact us through WhatsApp.
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      <SiteFooter />
    </>
  )
}