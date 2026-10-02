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
  useEffect(() => {
    const internalHome =
      sessionStorage.getItem('tenoo-internal-home') === '1'

    if (internalHome) return

    const timer = window.setTimeout(() => setShow(true), 100)

    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  if (!show) return null

  return (
    <>
      <style jsx>{`
        @keyframes tenooLeafFall {
          0% { transform: translate3d(0, -12vh, 0) rotate(var(--start-rotation)) scale(0.82); opacity: 0; }
          7% { opacity: 0.9; }
          22% { transform: translate3d(34px, 22vh, 0) rotate(calc(var(--start-rotation) + 85deg)) scale(1); }
          45% { transform: translate3d(-42px, 46vh, 0) rotate(calc(var(--start-rotation) + 175deg)) scale(0.96); }
          68% { transform: translate3d(38px, 72vh, 0) rotate(calc(var(--start-rotation) + 265deg)) scale(1.04); }
          86% { transform: translate3d(-28px, 96vh, 0) rotate(calc(var(--start-rotation) + 330deg)) scale(0.98); opacity: 0.62; }
          100% { transform: translate3d(24px, 122vh, 0) rotate(calc(var(--start-rotation) + 405deg)) scale(0.9); opacity: 0; }
        }
        .tenoo-leaf { position: fixed; top: 0; z-index: 9998; width: var(--leaf-size); height: var(--leaf-size); pointer-events: none; transform-origin: center; animation-name: tenooLeafFall; animation-timing-function: ease-in-out; animation-iteration-count: 1; animation-fill-mode: both; will-change: transform, opacity; }
        .tenoo-leaf img { width: 100%; height: 100%; object-fit: contain; }
        @media (prefers-reduced-motion: reduce) { .tenoo-leaf { display: none; } }
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