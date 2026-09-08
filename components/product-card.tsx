import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/lib/site'

const GALLERY_FOLDERS: Record<string, string> = {
  'millet-abc': 'Meltiva-Nutrimix',
  'pink-abc': 'Rubyblend-Nutrimix',
  'cotton-milk-mix': 'Paruthipaal-mix',
  'pirandai-rice-mix': 'Pirandai-rice-mix',
  'mudavattu-kilangu-rice-mix': 'Mudavaatukaal-rice-mix',
  'mudavaattu-kizhangu-soup-mix': 'Mudavaatukaal-soup-mix',
}

export function ProductCard({ product }: { product: Product }) {
  const cardImage = GALLERY_FOLDERS[product.slug]
    ? `/products/${GALLERY_FOLDERS[product.slug]}/1.png`
    : product.image || '/placeholder.svg'

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col items-center text-center"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-card/60">
        <Image
          src={cardImage}
          alt={`${product.name} product pack`}
          fill
          sizes="(max-width: 768px) 45vw, 22vw"
          className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <h4 className="mt-3 font-serif text-lg font-bold text-primary">
        {product.name}
      </h4>

      <p className="mt-1 max-w-[16ch] text-sm leading-relaxed text-muted-foreground">
        {product.tagline}
      </p>
    </Link>
  )
}