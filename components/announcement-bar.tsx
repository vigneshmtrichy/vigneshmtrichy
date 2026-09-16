'use client'

export function AnnouncementBar() {
  return (
    <div className="w-full overflow-hidden bg-primary text-primary-foreground">
      <div className="tenoo-marquee-track flex w-max whitespace-nowrap">
        <div className="flex items-center gap-16 pr-16 text-[11px] font-bold uppercase tracking-[0.12em]">
          <span>🚚 FREE DELIVERY ON ORDERS ABOVE ₹699</span>
          <span>🚚 FREE DELIVERY ON ORDERS ABOVE ₹699</span>
          <span>🚚 FREE DELIVERY ON ORDERS ABOVE ₹699</span>
          <span>🚚 FREE DELIVERY ON ORDERS ABOVE ₹699</span>
        </div>

        <div
          aria-hidden="true"
          className="flex items-center gap-16 pr-16 text-[11px] font-bold uppercase tracking-[0.12em]"
        >
          <span>🚚 FREE DELIVERY ON ORDERS ABOVE ₹699</span>
          <span>🚚 FREE DELIVERY ON ORDERS ABOVE ₹699</span>
          <span>🚚 FREE DELIVERY ON ORDERS ABOVE ₹699</span>
          <span>🚚 FREE DELIVERY ON ORDERS ABOVE ₹699</span>
        </div>
      </div>

      <style jsx>{`
        .tenoo-marquee-track {
          animation: tenooMarquee 25s linear infinite;
        }

        @keyframes tenooMarquee {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tenoo-marquee-track {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}