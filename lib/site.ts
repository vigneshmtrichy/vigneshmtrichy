export const WHATSAPP_URL = 'https://wa.me/910000000000'

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Our Products', href: '/products' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
] as const

export type ProductCategory = 'kids' | 'adults'

export type Product = {
  slug: string
  name: string
  tagline: string
  /** Two short lines shown under the name on cards, e.g. ["Nuts, Seeds & Millets", "For Growing You"] */
  descLines: [string, string]
  image: string
  category: ProductCategory
  /** Feature badges shown on cards (brand claims consistent across the range). */
  badges: string[]
}

/** Standard TENOO feature badges shown on every product card. */
export const PRODUCT_BADGES = [
  'Rich in Fiber',
  'Rich in Protein',
  'No Refined Sugar',
] as const

export const KIDS_PRODUCTS: Product[] = [
  {
    slug: 'millet-abc',
    name: 'Millet ABC',
    tagline: 'Nuts, Seeds & Millets For Growing You',
    descLines: ['Nuts, Seeds & Millets', 'For Growing You'],
    image: '/products/millet-abc.png',
    category: 'kids',
    badges: [...PRODUCT_BADGES],
  },
  {
    slug: 'pink-abc',
    name: 'Pink ABC',
    tagline: 'Nuts, Seeds & Beetroot Mix For Stronger You',
    descLines: ['Nuts, Seeds & Beetroot Mix', 'For Stronger You'],
    image: '/products/pink-abc.png',
    category: 'kids',
    badges: [...PRODUCT_BADGES],
  },
  {
    slug: 'black-rice-milk-mix',
    name: 'Black Rice Milk Mix',
    tagline: 'Natural & Creamy For Everyday Energy',
    descLines: ['Natural & Creamy', 'For Everyday Energy'],
    image: '/products/black-rice-milk-mix.png',
    category: 'kids',
    badges: [...PRODUCT_BADGES],
  },
  {
    slug: 'cotton-milk-mix',
    name: 'Cotton Milk Mix',
    tagline: 'Natural & Nutritious For Everyday Wellness',
    descLines: ['Natural & Nutritious', 'For Everyday Wellness'],
    image: '/products/cotton-milk-mix.png',
    category: 'kids',
    badges: [...PRODUCT_BADGES],
  },
]

export const ADULT_PRODUCTS: Product[] = [
  {
    slug: 'pirandai-rice-mix',
    name: 'Pirandai Rice Mix',
    tagline: 'Traditional Greens with Rice & Lentils',
    descLines: ['Traditional Greens', 'with Rice & Lentils'],
    image: '/products/pirandai-rice-mix.png',
    category: 'adults',
    badges: [...PRODUCT_BADGES],
  },
  {
    slug: 'mudavatu-kilangu-rice-mix',
    name: 'Mudavatu Kilangu Rice Mix',
    tagline: 'Wholesome Root with Rice & Lentils',
    descLines: ['Wholesome Root', 'with Rice & Lentils'],
    image: '/products/mudavatu-rice-mix.png',
    category: 'adults',
    badges: [...PRODUCT_BADGES],
  },
  {
    slug: 'mudavatu-kilangu-soup-mix',
    name: 'Mudavatu Kilangu Soup Mix',
    tagline: 'Wholesome & Comforting Traditional Soup',
    descLines: ['Wholesome & Comforting', 'Traditional Soup'],
    image: '/products/mudavatu-soup-mix.png',
    category: 'adults',
    badges: [...PRODUCT_BADGES],
  },
]

export const ALL_PRODUCTS: Product[] = [...KIDS_PRODUCTS, ...ADULT_PRODUCTS]

export function getProductBySlug(slug: string): Product | undefined {
  return ALL_PRODUCTS.find((p) => p.slug === slug)
}

export function whatsAppOrderUrl(productName: string): string {
  const message = `Hi TENOO, I would like to order ${productName}.`
  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`
}
