import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQs | Tenoo',
  description:
    'Find answers about Tenoo products, ingredients, preparation, orders, delivery, product verification and more.',
  alternates: {
    canonical: 'https://www.tenoo.in/faq',
  },
}

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}