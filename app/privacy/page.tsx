import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ScrollReveal } from '@/components/scroll-reveal'

export const metadata: Metadata = {
  title: 'Privacy Policy | Tenoo',
  description:
    'Read Tenoo Privacy Policy to understand how we collect, use, protect and handle information when you interact with our website.',
  alternates: {
    canonical: 'https://www.tenoo.in/privacy',
  },
}

const SECTIONS = [
  {
    title: '1. Introduction',
    content: [
      'TENOO respects your privacy and is committed to protecting the personal information you share with us through our website and ordering channels.',
      'This Privacy Policy explains what information we may collect, how we use it and how we handle it when you interact with TENOO.',
    ],
  },
  {
    title: '2. Information We May Collect',
    content: [
      'When you contact TENOO, place an order or submit an enquiry, we may receive information such as your name, phone number, email address, delivery address and order-related details.',
      'We may also receive information that you voluntarily provide when communicating with us through WhatsApp, email or other contact channels.',
    ],
  },
  {
    title: '3. How We Use Your Information',
    content: [
      'We may use the information you provide to respond to enquiries, process and manage orders, arrange delivery, provide customer support and communicate with you about your order or request.',
      'We may also use information to improve our website, products and customer experience.',
    ],
  },
  {
    title: '4. WhatsApp & Third-Party Services',
    content: [
      'TENOO may use third-party services such as WhatsApp, website hosting, analytics and other service providers to support communication, website operation and customer service.',
      'When you interact with these services, your information may also be subject to the privacy policies and terms of those respective service providers.',
    ],
  },
  {
    title: '5. Website Analytics & Cookies',
    content: [
      'Our website may use analytics technologies to understand website usage and improve performance and user experience.',
      'These technologies may collect information such as pages visited, device or browser information and general website usage patterns. They are not intended to collect sensitive personal information.',
    ],
  },
  {
    title: '6. How We Protect Your Information',
    content: [
      'TENOO takes reasonable measures to protect the information provided to us against unauthorised access, misuse or disclosure.',
      'However, no method of transmitting or storing information electronically can be guaranteed to be completely secure.',
    ],
  },
  {
    title: '7. Sharing of Information',
    content: [
      'TENOO does not sell your personal information.',
      'We may share relevant information with service providers or business partners where necessary to fulfil an order, arrange delivery, provide website services or respond to your request.',
      'Information may also be disclosed where required by applicable law or lawful authorities.',
    ],
  },
  {
    title: '8. Data Retention',
    content: [
      'We retain personal information only for as long as reasonably necessary for the purposes for which it was collected, including order processing, customer support, business records and applicable legal or regulatory requirements.',
    ],
  },
  {
    title: '9. Your Choices',
    content: [
      'You may contact TENOO if you have questions about the personal information you have provided to us or if you wish to request appropriate updates or corrections, subject to applicable requirements.',
      'You may also choose not to provide certain information, although this may affect our ability to process an order or respond to a specific request.',
    ],
  },
  {
    title: '10. Children’s Privacy',
    content: [
      'TENOO’s website is intended for general use and is not specifically directed at children for the purpose of collecting personal information.',
      'Parents or guardians should supervise children when they use online services and should avoid providing personal information on their behalf unless necessary.',
    ],
  },
  {
    title: '11. Changes to This Privacy Policy',
    content: [
      'TENOO may update this Privacy Policy from time to time to reflect changes in our services, practices or applicable requirements.',
      'Any updated version will be published on this page.',
    ],
  },
  {
    title: '12. Contact Us',
    content: [
      'If you have any questions or concerns about this Privacy Policy or the way your information is handled, please contact TENOO.',
    ],
  },
]

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <ScrollReveal>
          <section className="px-4 py-16 md:px-8 md:py-20">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
                Legal
              </p>

              <h1 className="mt-4 font-display text-4xl leading-tight text-foreground md:text-6xl">
                Privacy Policy
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Your privacy matters to us. Learn how TENOO collects, uses and
                protects information when you interact with our website.
              </p>

              <p className="mt-4 text-sm text-muted-foreground">
                Last updated: September 2026
              </p>
            </div>
          </section>
        </ScrollReveal>

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
                  Questions about your privacy?
                </h2>

                <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
                  For privacy-related questions or concerns, please contact us
                  at{' '}
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