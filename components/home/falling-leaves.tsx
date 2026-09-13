'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const leaves = [
  { left: 2, delay: '0s', duration: '11s', size: '22px', rotate: '-25deg' },
  { left: 8, delay: '3s', duration: '14s', size: '17px', rotate: '35deg' },
  { left: 15, delay: '7s', duration: '12s', size: '25px', rotate: '-45deg' },
  { left: 22, delay: '1s', duration: '15s', size: '19px', rotate: '55deg' },
  { left: 29, delay: '5s', duration: '10s', size: '16px', rotate: '-35deg' },
  { left: 36, delay: '9s', duration: '13s', size: '24px', rotate: '40deg' },
  { left: 43, delay: '2s', duration: '15s', size: '18px', rotate: '-50deg' },
  { left: 50, delay: '6s', duration: '11s', size: '21px', rotate: '30deg' },
  { left: 57, delay: '10s', duration: '14s', size: '16px', rotate: '-40deg' },
  { left: 64, delay: '4s', duration: '12s', size: '23px', rotate: '50deg' },
  { left: 71, delay: '8s', duration: '15s', size: '18px', rotate: '-30deg' },
  { left: 78, delay: '0s', duration: '13s', size: '25px', rotate: '45deg' },
  { left: 85, delay: '6s', duration: '11s', size: '17px', rotate: '-55deg' },
  { left: 92, delay: '3s', duration: '14s', size: '21px', rotate: '35deg' },
  { left: 12, delay: '12s', duration: '13s', size: '20px', rotate: '-45deg' },
  { left: 48, delay: '14s', duration: '12s', size: '17px', rotate: '55deg' },
  { left: 68, delay: '11s', duration: '15s', size: '22px', rotate: '-35deg' },
  { left: 96, delay: '15s', duration: '13s', size: '19px', rotate: '40deg' },
]

export function FallingLeaves() {
  const [show, setShow] = useState(false)
  const [heroTop, setHeroTop] = useState(0)

  useEffect(() => {
    const internalHome =
      sessionStorage.getItem('tenoo-internal-home') === '1'

    if (internalHome) return

    const findHero = () => {
      const hero = document.getElementById('tenoo-hero')

      if (!hero) return

      const rect = hero.getBoundingClientRect()

      // Hero's position inside the current viewport
      setHeroTop(rect.top)

      setShow(true)
    }

    // Wait until the page has restored its scroll position
    // and the hero/banner has been laid out.
    const timer = window.setTimeout(findHero, 100)

    window.addEventListener('resize', findHero)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', findHero)
    }
  }, [])

  if (!show) return null

  return (
    <>
      <style jsx>{`
        @keyframes tenooLeafFall {
          0% {
            transform:
              translate3d(0, -20px, 0)
              rotate(var(--start-rotation))
              scale(0.85);
            opacity: 0;
          }

          8% {
            opacity: 0.85;
          }

          25% {
            transform:
              translate3d(35px, 25vh, 0)
              rotate(calc(var(--start-rotation) + 90deg))
              scale(1);
          }

          50% {
            transform:
              translate3d(-45px, 52vh, 0)
              rotate(calc(var(--start-rotation) + 190deg))
              scale(0.95);
          }

          75% {
            transform:
              translate3d(30px, 78vh, 0)
              rotate(calc(var(--start-rotation) + 280deg))
              scale(1.05);
          }

          90% {
            opacity: 0.65;
          }

          100% {
            transform:
              translate3d(-25px, 115vh, 0)
              rotate(calc(var(--start-rotation) + 380deg))
              scale(0.9);
            opacity: 0;
          }
        }

        .tenoo-leaf {
          position: fixed;
          top: var(--hero-top);
          z-index: 9998;
          width: var(--leaf-size);
          height: var(--leaf-size);
          pointer-events: none;
          transform-origin: center;
          animation-name: tenooLeafFall;
          animation-timing-function: ease-in-out;
          animation-iteration-count: 1;
          animation-fill-mode: both;
          will-change: transform, opacity;
        }

        .tenoo-leaf img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        @media (prefers-reduced-motion: reduce) {
          .tenoo-leaf {
            display: none;
          }
        }
      `}</style>

      <div
        className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden"
        aria-hidden="true"
      >
        {leaves.map((leaf, index) => (
          <span
            key={index}
            className="tenoo-leaf"
            style={
              {
                left: `${leaf.left}%`,
                animationDelay: leaf.delay,
                animationDuration: leaf.duration,
                '--hero-top': `${heroTop}px`,
                '--leaf-size': leaf.size,
                '--start-rotation': leaf.rotate,
              } as React.CSSProperties
            }
          >
            <Image
              src="/leaf.png"
              alt=""
              width={100}
              height={100}
              className="h-full w-full object-contain"
            />
          </span>
        ))}
      </div>
    </>
  )
}