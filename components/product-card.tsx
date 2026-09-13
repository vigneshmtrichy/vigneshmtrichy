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
  'black-rice-milk-mix': 'blacko-cocoa-mix',
}

export function ProductCard({ product }: { product: Product }) {
  const cardImage = GALLERY_FOLDERS[product.slug]
    ? `/products/${GALLERY_FOLDERS[product.slug]}/1.png`
    : product.image || '/placeholder.svg'

  const discountPercentage =
    product.mrp && product.price
      ? Math.round(
          ((Number(product.mrp) - Number(product.price)) /
            Number(product.mrp)) *
            100
        )
      : 0

  return (
    <>
      <Link
        href={`/products/${product.slug}`}
        className="flex flex-col items-center text-center"
      >
        {/* IMAGE ONLY */}
        <div
          className="
            group/image
            relative
            aspect-square
            w-full
            overflow-hidden
            rounded-2xl
            bg-card/60
          "
        >
          <Image
            src={cardImage}
            alt={`${product.name} product pack`}
            fill
            sizes="(max-width: 768px) 45vw, 22vw"
            className="
              object-contain
              p-2
              transition-transform
              duration-300
              group-hover/image:scale-105
            "
          />

          {/* ONE-WAY SHINE */}
          <div
            className="
              pointer-events-none
              absolute
              inset-0
              z-20
              overflow-hidden
            "
          >
            <span
              className="
                tenoo-shine
                absolute
                -top-[20%]
                -left-[70%]
                h-[140%]
                w-[28%]
                rotate-[20deg]
                bg-gradient-to-r
                from-transparent
                via-white/60
                to-transparent
              "
            />
          </div>
        </div>

        {/* PRODUCT NAME */}
        <h4 className="mt-3 font-serif text-lg font-bold text-primary">
          {product.name}
        </h4>

        {/* TAGLINE */}
        <p className="mt-1 max-w-[16ch] text-sm leading-relaxed text-muted-foreground">
          {product.tagline}
        </p>

        {/* PRICE */}
        {product.price && (
          <div className="mt-2 flex items-center justify-center gap-2">
            {product.mrp && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{product.mrp}
              </span>
            )}

            <span className="text-base font-bold text-primary">
              ₹{product.price}
            </span>

            {discountPercentage > 0 && (
              <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-bold text-orange-600">
                {discountPercentage}% OFF
              </span>
            )}
          </div>
        )}
      </Link>

      {/* SHINE CSS */}
      <style>{`
        .group\\/image:hover .tenoo-shine {
          animation: tenooShine 1200ms ease-out 1;
        }

        @keyframes tenooShine {
          0% {
            left: -70%;
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          85% {
            opacity: 1;
          }

          100% {
            left: 140%;
            opacity: 0;
          }
        }
      `}</style>
    </>
  )
}