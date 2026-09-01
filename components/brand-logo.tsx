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
  const isLight = tone === 'light'
  return (
    <Link href="/" className={cn('inline-flex flex-col leading-none', className)}>
      <span className="relative inline-flex items-start">
        <span
          className={cn(
            'font-serif text-3xl font-black tracking-tight',
            isLight ? 'text-primary-foreground' : 'text-primary',
          )}
        >
          TENOO
        </span>
        <svg
          viewBox="0 0 24 24"
          className="ml-0.5 -mt-1 h-4 w-4 text-terracotta"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 21c0-5 2-8 7-9-1 5-3 8-7 9Z"
            fill="currentColor"
            opacity="0.9"
          />
          <path
            d="M12 21c0-4-1.5-6.5-6-7.5 1 4 2.5 6.5 6 7.5Z"
            className="text-leaf"
            fill="currentColor"
          />
        </svg>
      </span>
      {withTagline ? (
        <span
          className={cn(
            'mt-1 text-[0.68rem] font-medium tracking-wide',
            isLight ? 'text-primary-foreground/75' : 'text-muted-foreground',
          )}
        >
          Good Food. Made for Every Generation.
        </span>
      ) : null}
    </Link>
  )
}
