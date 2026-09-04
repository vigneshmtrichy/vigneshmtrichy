import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function BrandLogo({
  className,
  withTagline = true,
  tone = 'default',
}: {
  className?: string
  withTagline?: boolean
  tone?: 'default' | 'light'
}) {
  return (
    <Link
      href="/"
      className={cn(
        'inline-flex items-center',
        className,
      )}
      aria-label="TENOO Nutrition"
    >
      <Image
        src="/tenoo-logo.png"
        alt="TENOO Nutrition - Good Food. Made for Every Generation."
        width={520}
        height={240}
        priority
        className={cn(
          'h-auto w-auto object-contain',
          withTagline ? 'max-w-[135px]' : 'max-w-[125px]',
          tone === 'light' && 'brightness-110',
        )}
      />
    </Link>
  )
}