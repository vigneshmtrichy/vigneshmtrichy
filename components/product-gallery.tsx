'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type TouchEvent } from 'react'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react'

type ProductGalleryProps = {
  images: string[]
  productName: string
  tagline?: string
  packSize?: string
  fallbackImage: string
}

export function ProductGallery({
  images,
  productName,
  tagline,
  packSize,
  fallbackImage,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const touchStartX = useRef<number | null>(null)
  const swipeDetected = useRef(false)

  const selectedImage = images[selectedIndex]

  const previousImage = () => {
    setSelectedIndex((current) =>
      current === 0 ? images.length - 1 : current - 1
    )
  }

  const nextImage = () => {
    setSelectedIndex((current) =>
      current === images.length - 1 ? 0 : current + 1
    )
  }

  // Mobile swipe controls
  const handleTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.touches[0].clientX
    swipeDetected.current = false
  }

  const handleTouchEnd = (event: TouchEvent) => {
    if (touchStartX.current === null) return

    const touchEndX = event.changedTouches[0].clientX
    const difference = touchStartX.current - touchEndX

    if (Math.abs(difference) > 50) {
      swipeDetected.current = true

      if (difference > 0) {
        nextImage()
      } else {
        previousImage()
      }
    }

    touchStartX.current = null
  }

  // Lock page scroll when viewer is open
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  // Browser back button closes mobile image viewer
  useEffect(() => {
    if (!isOpen) return

    window.history.pushState(
      { tenooGallery: true },
      '',
      window.location.href
    )

    const handlePopState = () => {
      setIsOpen(false)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isOpen])

  // Close viewer properly
  const closeViewer = () => {
    if (window.history.state?.tenooGallery) {
      window.history.back()
    } else {
      setIsOpen(false)
    }
  }

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeViewer()
      }

      if (event.key === 'ArrowLeft') {
        previousImage()
      }

      if (event.key === 'ArrowRight') {
        nextImage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  if (!images || images.length === 0) {
    return null
  }

  return (
    <>
      {/* =========================================================
          NORMAL PRODUCT PAGE
          DESKTOP + MOBILE
          ========================================================= */}

      <div className="w-full">

        {/* MAIN IMAGE */}
        <div
          className="group relative aspect-square cursor-zoom-in touch-pan-y overflow-hidden rounded-[2rem] bg-card"
          onClick={() => {
            if (swipeDetected.current) {
              swipeDetected.current = false
              return
            }

            setIsOpen(true)
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            src={selectedImage}
            alt={`${productName} product image`}
            fill
            priority
            sizes="(max-width: 767px) 100vw, 50vw"
            className="object-contain p-6 transition-transform duration-300 group-hover:scale-[1.02]"
            onError={(event) => {
              event.currentTarget.src = fallbackImage
            }}
          />

          
        </div>

        {/* MOBILE DOTS */}
        <div className="flex items-center justify-center gap-1.5 py-4 md:hidden">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`View image ${index + 1}`}
              className={`h-2 rounded-full transition-all ${
                selectedIndex === index
                  ? 'w-5 bg-lime-500'
                  : 'w-2 bg-slate-300'
              }`}
            />
          ))}
        </div>

        {/* DESKTOP THUMBNAILS */}
        <div className="mt-4 hidden grid-cols-5 gap-3 md:grid">
          {images.slice(0, 4).map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-square overflow-hidden rounded-xl border bg-card transition-all ${
                selectedIndex === index
                  ? 'border-lime-500 ring-2 ring-lime-500/30'
                  : 'border-border hover:border-lime-500/60'
              }`}
            >
              <Image
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                sizes="120px"
                className="object-contain p-2"
                onError={(event) => {
                  event.currentTarget.src = fallbackImage
                }}
              />
            </button>
          ))}

          {/* MORE IMAGES */}
          {images.length > 4 && (
            <button
              type="button"
              onClick={() => {
              setSelectedIndex(4)
              setIsOpen(true)
              }}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-white"
            >
              <Image
                src={images[4]}
                alt={`${productName} more images`}
                fill
                sizes="120px"
                className="object-cover opacity-40 transition-opacity group-hover:opacity-30"
                onError={(event) => {
                  event.currentTarget.src = fallbackImage
                }}
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-medium tracking-widest text-slate-400">
                  •••
                </span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================
          IMAGE VIEWER
          ========================================================= */}

      {isOpen && (
        <div
          className="fixed inset-0 z-[9999]"
          onClick={closeViewer}
        >

          {/* =====================================================
              DESKTOP VIEWER
              DON'T CHANGE DESKTOP DESIGN
              ===================================================== */}

          <div className="hidden h-full w-full items-center justify-center overflow-y-auto bg-black/55 p-8 backdrop-blur-[1px] md:flex">
            <div
              className="relative flex h-[calc(100vh-48px)] max-h-[900px] w-full max-w-[1500px] overflow-hidden rounded-[1.5rem] bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >

              {/* LEFT — MAIN IMAGE */}

              <div className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden bg-white p-10">
                <div className="relative h-full min-h-[500px] w-full">
                  <Image
                    src={selectedImage}
                    alt={`${productName} enlarged image`}
                    fill
                    sizes="70vw"
                    className="object-contain"
                    onError={(event) => {
                      event.currentTarget.src = fallbackImage
                    }}
                  />
                </div>

                {/* PREVIOUS */}
                <button
                  type="button"
                  onClick={previousImage}
                  className="absolute left-5 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 text-gray-800 shadow-sm transition hover:bg-gray-200"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>

                {/* NEXT */}
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-5 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 text-gray-800 shadow-sm transition hover:bg-gray-200"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-7 w-7" />
                </button>
              </div>

              {/* RIGHT — PRODUCT INFO + IMAGES */}

              <div className="w-[360px] shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-6">

                {/* PRODUCT HEADER */}

                <div className="mb-6 border-b border-gray-200 pb-5">

                  <p className="mb-2 text-sm font-semibold tracking-[0.25em] text-lime-600">
                    TENOO
                  </p>

                  <h3 className="text-xl font-semibold text-gray-900">
                    {productName}
                  </h3>

                  {/* TAGLINE */}
                  {tagline && (
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                      {tagline}
                    </p>
                  )}

                  {/* WEIGHT */}
                  {packSize && (
                    <p className="mt-3 text-sm font-medium text-gray-700">
                      Net Weight: {packSize}
                    </p>
                  )}

                </div>

                {/* 3 × 3 IMAGE GRID */}

                <div className="grid grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      className={`relative aspect-square overflow-hidden rounded-xl bg-gray-50 transition-all ${
                        selectedIndex === index
                          ? 'ring-2 ring-lime-500 ring-offset-2 ring-offset-white'
                          : 'border border-gray-200 hover:border-lime-400'
                      }`}
                      aria-label={`View image ${index + 1}`}
                    >
                      <Image
                        src={image}
                        alt={`${productName} image ${index + 1}`}
                        fill
                        sizes="110px"
                        className="object-contain p-2"
                        onError={(event) => {
                          event.currentTarget.src = fallbackImage
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* DESKTOP CLOSE */}
              <button
                type="button"
                onClick={closeViewer}
                className="absolute right-5 top-5 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-800 shadow-sm transition hover:bg-gray-200"
                aria-label="Close image viewer"
              >
                <X className="h-6 w-6" />
              </button>

            </div>
          </div>

          {/* =====================================================
              MOBILE VIEWER
              NO CLOSE BUTTON
              BROWSER BACK CLOSES VIEWER
              ===================================================== */}

          <div
            className="flex h-full w-full flex-col bg-white md:hidden"
            onClick={(event) => event.stopPropagation()}
          >

            {/* =================================================
                MOBILE PRODUCT INFO
                NAME → TAGLINE → WEIGHT
                ================================================= */}

            <div className="shrink-0 border-b border-gray-100 px-5 pb-4 pt-5">

              <p className="text-xs font-semibold tracking-[0.25em] text-lime-600">
                TENOO
              </p>

              <h3 className="mt-1 text-lg font-semibold leading-tight text-gray-900">
                {productName}
              </h3>

              {/* TAGLINE */}
              {tagline && (
                <p className="mt-2 text-sm leading-5 text-gray-500">
                  {tagline}
                </p>
              )}

              {/* WEIGHT */}
              {packSize && (
                <p className="mt-2 text-sm font-medium text-gray-700">
                  Net Weight: {packSize}
                </p>
              )}

            </div>

            {/* =================================================
                MOBILE LARGE IMAGE
                SWIPE LEFT / RIGHT
                ================================================= */}

            <div
              className="relative min-h-0 flex-1 touch-pan-y bg-white"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >

              <Image
                src={selectedImage}
                alt={`${productName} enlarged image`}
                fill
                sizes="100vw"
                className="object-contain p-3"
                onError={(event) => {
                  event.currentTarget.src = fallbackImage
                }}
              />

            </div>

            {/* =================================================
                MOBILE HORIZONTAL THUMBNAILS
                ================================================= */}

            <div className="shrink-0 border-t border-gray-100 bg-white px-3 py-3">

              <div
                className="flex gap-2 overflow-x-auto"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {images.map((image, index) => (
                  <button
                    key={`mobile-${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className={`relative h-16 w-16 flex-none overflow-hidden rounded-lg bg-gray-50 ${
                      selectedIndex === index
                        ? 'border-2 border-lime-500'
                        : 'border border-gray-200'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  >
                    <Image
                      src={image}
                      alt={`${productName} image ${index + 1}`}
                      fill
                      sizes="64px"
                      className="object-contain p-1"
                      onError={(event) => {
                        event.currentTarget.src = fallbackImage
                      }}
                    />
                  </button>
                ))}
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  )
}