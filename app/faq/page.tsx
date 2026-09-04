'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ScrollReveal } from '@/components/scroll-reveal'
import { WHATSAPP_URL } from '@/lib/site'

const FAQ_SECTIONS = [
  {
    title: 'About TENOO',
    items: [
      {
        question: 'What is TENOO?',
        answer:
          'TENOO is a food brand focused on thoughtfully crafted products inspired by Indian ingredients, made for little ones, families and everyday living.',
      },
      {
        question: 'Where are TENOO products made?',
        answer:
          'TENOO products are manufactured in India through food manufacturing partners who follow applicable food safety and regulatory requirements.',
      },
      {
        question: 'What makes TENOO different?',
        answer:
          'TENOO focuses on thoughtfully selected ingredients, simple food choices and products designed for everyday use across generations.',
      },
    ],
  },
  {
    title: 'Products & Ingredients',
    items: [
      {
        question: 'What products does TENOO offer?',
        answer:
          'TENOO offers a range of food products including nutrimix blends, traditional ingredient-based mixes and everyday wellness-oriented food products.',
      },
      {
        question: 'Are TENOO products suitable for children?',
        answer:
          'Some TENOO products are created for little ones and families. Please check the individual product page and product label for the intended use, ingredients and allergen information before serving.',
      },
      {
        question: 'What ingredients are used in TENOO products?',
        answer:
          'Ingredients vary by product. You can find the complete ingredient list for each product on its product page and packaging.',
      },
      {
        question: 'Where can I find the nutrition information?',
        answer:
          'Nutrition information is provided on the individual product page and on the product packaging wherever applicable.',
      },
      {
        question: 'Do TENOO products contain preservatives?',
        answer:
          'TENOO follows a clean-label approach and aims to avoid synthetic preservatives. Please refer to the specific product label for the most accurate ingredient information.',
      },
    ],
  },
  {
    title: 'Preparation & Storage',
    items: [
      {
        question: 'How do I prepare TENOO mixes?',
        answer:
          'Preparation instructions vary by product. Please follow the preparation method given on the respective product page or product packaging.',
      },
      {
        question: 'How should I store TENOO products?',
        answer:
          'Store the product in a cool, dry place away from direct sunlight and moisture. Keep the pack tightly closed after opening and follow the storage instructions on the product label.',
      },
      {
        question: 'Where can I find the shelf life of a product?',
        answer:
          'The best-before or shelf-life information is printed on the respective product packaging. Please check the pack before use.',
      },
    ],
  },
  {
    title: 'Orders & Delivery',
    items: [
      {
        question: 'How can I place an order?',
        answer:
          'You can contact TENOO through WhatsApp to enquire about products and place an order.',
      },
      {
        question: 'Do you offer WhatsApp ordering?',
        answer:
          'Yes. You can reach TENOO directly through WhatsApp for product enquiries and orders.',
      },
      {
        question: 'Do you offer shipping across India?',
        answer:
          'Shipping availability depends on the order and delivery location. Please contact TENOO on WhatsApp to confirm delivery availability for your location.',
      },
      {
        question: 'How can I contact TENOO regarding my order?',
        answer:
          'For order-related questions, please contact us directly through WhatsApp and share your order details with our team.',
      },
      {
  question: 'Can I cancel my order?',
  answer:
    'Cancellation requests can be made by contacting TENOO on WhatsApp as soon as possible. Once an order has been processed or dispatched, cancellation may not be possible.',
},
{
  question: 'What is TENOO’s refund policy?',
  answer:
    'If a refund is applicable, the request will be reviewed based on the order status and the reason for the request. Please contact TENOO on WhatsApp with your order details for assistance.',
},
    ],
  },
  {
    title: 'Product Verification',
    items: [
      {
        question: 'How can I verify the manufacturer details?',
        answer:
          'Products with a manufacturer verification QR code can be scanned using your phone camera. The QR code opens the corresponding TENOO verification page with the manufacturer details.',
      },
      {
        question: 'Where can I find the FSSAI licence information?',
        answer:
          'The applicable FSSAI licence information is provided on the product packaging and, where available, on the manufacturer verification page linked through the product QR code.',
      },
    ],
  },
  {
    title: 'Support',
    items: [
      {
        question: 'How can I contact TENOO?',
        answer:
          'You can contact TENOO through WhatsApp, Instagram, Facebook or YouTube. For direct assistance, WhatsApp is the quickest way to reach us.',
      },
      {
        question: 'Can I contact TENOO for bulk or business enquiries?',
        answer:
          'Yes. For bulk orders, business enquiries or other product-related requirements, please contact us through WhatsApp and share your requirement.',
      },
    ],
  },
]

function FAQItem({
  question,
  answer,
}: {
  question: string
  answer: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-6 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-base font-semibold text-foreground md:text-lg">
          {question}
        </span>

        <ChevronDown
          className={`h-5 w-5 shrink-0 text-primary transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr] pb-5' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <p className="max-w-3xl pr-8 text-sm leading-7 text-muted-foreground md:text-base">
            {answer}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function FAQPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">

        {/* HERO */}
        <ScrollReveal>
          <section className="px-4 py-16 md:px-8 md:py-20">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
                Frequently Asked Questions
              </p>

              <h1 className="mt-4 font-display text-4xl leading-tight text-foreground md:text-6xl">
                Everything You Need to Know
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Find answers about TENOO products, ingredients, preparation,
                orders and more.
              </p>
            </div>
          </section>
        </ScrollReveal>

        {/* FAQ SECTIONS */}
        <section className="px-4 pb-20 md:px-8 md:pb-24">
          <div className="mx-auto max-w-4xl">
            {FAQ_SECTIONS.map((section, sectionIndex) => (
              <ScrollReveal
                key={section.title}
                delay={sectionIndex * 80}
              >
                <div className="mb-12 last:mb-0">
                  <h2 className="mb-4 font-display text-2xl text-foreground md:text-3xl">
                    {section.title}
                  </h2>

                  <div className="rounded-2xl border border-border bg-background px-5 shadow-sm md:px-7">
                    {section.items.map((item) => (
                      <FAQItem
                        key={item.question}
                        question={item.question}
                        answer={item.answer}
                      />
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* CTA */}
        <ScrollReveal delay={100}>
          <section className="bg-secondary px-4 py-16 md:px-8 md:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-display text-3xl text-foreground md:text-4xl">
                Still Have a Question?
              </h2>

              <p className="mt-4 text-base leading-7 text-muted-foreground">
                We&apos;re happy to help. Reach out to us directly and our
                team will be glad to assist you.
              </p>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.03]"
              >
                Chat with TENOO on WhatsApp
              </a>
            </div>
          </section>
        </ScrollReveal>

      </main>

      <SiteFooter />
    </div>
  )
}