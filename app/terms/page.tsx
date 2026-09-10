import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ScrollReveal } from '@/components/scroll-reveal'

export const metadata: Metadata = {
  title: 'Terms & Conditions | Tenoo',
  description:
    'Read Tenoo Terms & Conditions covering products, orders, payments, cancellation, refunds, shipping, website use and more.',
  alternates: {
    canonical: 'https://www.tenoo.in/terms',
  },
}

const SECTIONS = [
  {
    title: '1. Introduction',
    content: [
      'Welcome to TENOO. By accessing or using the TENOO website, you agree to these Terms & Conditions. Please read them carefully before using our website or placing an order.',
      'These terms apply to all visitors, customers and users of the TENOO website.',
    ],
  },
  {
    title: '2. Products & Information',
    content: [
      'TENOO provides food products made with thoughtfully selected ingredients. Product information, including ingredients, nutrition information, preparation instructions, storage instructions and shelf life, is provided on the product packaging and website wherever applicable.',
      'We make reasonable efforts to keep product information accurate and up to date. However, packaging information should always be considered the final reference for the product purchased.',
    ],
  },
  {
    title: '3. Orders & Payments',
    content: [
      'Orders may be placed through the ordering channels provided by TENOO, including WhatsApp.',
      'An order is considered confirmed only after TENOO confirms the order and applicable payment or order requirements have been completed.',
      'Product availability and pricing may change from time to time. If there is any change affecting a confirmed order, we will communicate the same to the customer.',
    ],
  },
  {
    title: '4. Cancellation & Refunds',
    content: [
      'Cancellation requests should be made as soon as possible through WhatsApp or the contact details provided on this website.',
      'Once an order has been processed or dispatched, cancellation may not be possible.',
      'If a refund is applicable, the request will be reviewed based on the order status and the reason for the request. Any eligible refund will be processed through the applicable payment method or as otherwise communicated by TENOO.',
      'Nothing in this policy is intended to limit any rights available to consumers under applicable law.',
    ],
  },
  {
    title: '5. Shipping & Delivery',
    content: [
      'Delivery availability and estimated delivery timelines may vary depending on the destination, product availability and other circumstances.',
      'Customers are responsible for providing accurate delivery information at the time of ordering.',
      'TENOO will make reasonable efforts to facilitate delivery, but delays caused by circumstances outside our reasonable control may occur.',
    ],
  },
  {
    title: '6. Product Use, Allergens & Storage',
    content: [
      'Customers should read the product label carefully before use, particularly the ingredient and allergen information.',
      'Products should be prepared and stored according to the instructions provided on the product packaging.',
      'If you have a known food allergy, dietary restriction or specific health-related concern, please review the product information carefully and seek appropriate professional advice where necessary.',
    ],
  },
  {
    title: '7. Intellectual Property',
    content: [
      'The TENOO name, logo, website content, product images, graphics, text and other original materials on this website are owned by or used by TENOO with appropriate rights.',
      'You may not reproduce, copy, modify, distribute or commercially use our website content or brand materials without prior written permission.',
    ],
  },
  {
    title: '8. Website Use',
    content: [
      'You agree to use this website only for lawful purposes and in a manner that does not harm the website, its users or TENOO.',
      'You must not attempt to interfere with the operation or security of the website or use the website for fraudulent or unlawful activities.',
    ],
  },
  {
    title: '9. Limitation of Liability',
    content: [
      'TENOO makes reasonable efforts to provide accurate product and website information. However, the website is provided subject to availability and may occasionally contain errors, interruptions or outdated information.',
      'To the extent permitted by applicable law, TENOO will not be responsible for losses arising from circumstances beyond its reasonable control.',
    ],
  },
  {
    title: '10. Changes to These Terms',
    content: [
      'TENOO may update these Terms & Conditions from time to time to reflect changes in our services, policies or applicable requirements.',
      'Updated terms will be published on this page. Your continued use of the website after an update constitutes acceptance of the revised terms, to the extent permitted by law.',
    ],
  },
  {
    title: '11. Governing Law',
    content: [
      'These Terms & Conditions shall be governed by the applicable laws of India.',
      'Any disputes shall be subject to the jurisdiction of the appropriate courts and authorities, subject to applicable consumer protection laws.',
    ],
  },
  {
    title: '12. Contact Us',
    content: [
      'If you have any questions, concerns or complaints regarding these Terms & Conditions, our products or an order, please contact TENOO.',
    ],
  },
]

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* HERO */}
        <ScrollReveal>
          <section className="px-4 py-16 md:px-8 md:py-20">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
                Legal
              </p>

              <h1 className="mt-4 font-display text-4xl leading-tight text-foreground md:text-6xl">
                Terms &amp; Conditions
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Please read these terms carefully before using the TENOO
                website or placing an order.
              </p>

              <p className="mt-4 text-sm text-muted-foreground">
                Last updated: September 2026
              </p>
            </div>
          </section>
        </ScrollReveal>

        {/* CONTENT */}
        <section className="px-4 pb-20 md:px-8 md:pb-24">
          <div className="mx-auto max-w-4xl space-y-10">
            {SECTIONS.map((section, index) => (
              <ScrollReveal key={section.title} delay={index * 60}>
                <section>
                  <h2 className="font-display text-2xl text-foreground md:text-3xl">
                    {section.title}
                  </h2>

                  <div className="mt-4 space-y-4">
                    {section.content.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="text-sm leading-7 text-muted-foreground md:text-base"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              </ScrollReveal>
            ))}

            <ScrollReveal delay={100}>
              <div className="rounded-2xl border border-border bg-secondary p-6 md:p-8">
                <h2 className="font-display text-2xl text-foreground">
                  Questions about these terms?
                </h2>

                <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
                  For any questions, complaints or order-related assistance,
                  please contact us at{' '}
                  <a
                    href="mailto:info@tenoo.in"
                    className="font-semibold text-foreground underline underline-offset-4"
                  >
                    info@tenoo.in
                  </a>
                  .
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}