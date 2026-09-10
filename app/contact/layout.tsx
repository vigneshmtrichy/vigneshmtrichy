import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | Tenoo',
  description:
    'Contact Tenoo for product questions, orders, business enquiries, bulk orders and partnerships.',
  alternates: {
    canonical: 'https://www.tenoo.in/contact',
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}