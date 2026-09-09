import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Mulish } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/cart/cart-context'
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const mulish = Mulish({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.tenoo.in'),

  title: {
    default: 'Tenoo | Good Food. Made for Every Generation.',
    template: '%s | Tenoo',
  },

  description:
    'TENOO brings thoughtfully crafted food products inspired by Indian ingredients, made for little ones, families and everyday living.',

  keywords: [
    'TENOO',
    'TENOO Foods',
    'TENOO Nutrition',
    'Indian food products',
    'millet food products',
    'Millet ABC',
    'Pink ABC',
    'Karuppukavuni Milk Mix',
    'Paruthipaal Mix',
    'Pirandai Rice Mix',
    'Mudavattu Kilangu',
  ],

  authors: [{ name: 'TENOO' }],
  creator: 'TENOO',
  publisher: 'TENOO',

  alternates: {
    canonical: 'https://www.tenoo.in',
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    type: 'website',
    url: 'https://www.tenoo.in',
    siteName: 'TENOO',
    title: 'TENOO | Good Food. Made for Every Generation.',
    description:
      'Thoughtfully crafted food products inspired by Indian ingredients, made for little ones, families and everyday living.',
    images: [
      {
        url: '/tenoo-logo.png',
        width: 1200,
        height: 630,
        alt: 'TENOO — Good Food. Made for Every Generation.',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'TENOO | Good Food. Made for Every Generation.',
    description:
      'Thoughtfully crafted food products inspired by Indian ingredients, made for little ones, families and everyday living.',
    images: ['/tenoo-logo.png'],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#24363d',
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'TENOO',
  url: 'https://www.tenoo.in',
  logo: 'https://www.tenoo.in/tenoo-logo.png',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`bg-background ${playfair.variable} ${mulish.variable}`}
    >
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />

        <CartProvider>
         {children}
        </CartProvider>

        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}