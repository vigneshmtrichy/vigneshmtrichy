import Image from 'next/image'
import type { Product } from '@/lib/site'

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group flex flex-col items-center text-center">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-card/60">
        <Image
          src={product.image || '/placeholder.svg'}
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
    </div>
  )
}
