'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
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

  if (!images || images.length === 0) {
    return null
  }

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

  // Lock actual page while gallery is open
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
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

  return (
    <>
      {/* =========================================================
          NORMAL PRODUCT PAGE
          ========================================================= */}

      <div className="w-full">
        {/* MAIN IMAGE */}
        <div
          className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-[2rem] bg-card"
          onClick={() => setIsOpen(true)}
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

          {/* Desktop Zoom Icon */}
          <div className="absolute right-4 top-4 hidden h-11 w-11 items-center justify-center rounded-full bg-white text-primary opacity-0 shadow-md transition-opacity group-hover:opacity-100 md:flex">
            <Maximize2 className="h-5 w-5" />
          </div>
        </div>

        {/* =====================================================
            MOBILE ONLY — DOTS
            ===================================================== */}

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

        {/* =====================================================
            DESKTOP ONLY — EXISTING THUMBNAILS
            ===================================================== */}

        <div className="mt-4 hidden grid-cols-4 gap-3 sm:grid-cols-5 md:grid">
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

          {/* More Images */}
          {images.length > 4 && (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-black"
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
                <span className="text-3xl font-medium tracking-widest text-white">
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
          onClick={() => setIsOpen(false)}
        >

          {/* =====================================================
              DESKTOP VIEWER — EXISTING DESIGN
              ===================================================== */}

          <div
            className="
              hidden
              h-full
              w-full
              items-center
              justify-center
              overflow-y-auto
              bg-black/55
              p-8
              backdrop-blur-[1px]
              md:flex
            "
          >
            <div
              className="
                relative
                flex
                h-[calc(100vh-48px)]
                max-h-[900px]
                w-full
                max-w-[1500px]
                overflow-hidden
                rounded-[1.5rem]
                bg-white
                shadow-2xl
              "
              onClick={(event) => event.stopPropagation()}
            >
              {/* LEFT — MAIN IMAGE */}

              <div
                className="
                  relative
                  flex
                  min-w-0
                  flex-1
                  items-center
                  justify-center
                  overflow-hidden
                  bg-white
                  p-10
                "
              >
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

                {/* Previous */}
                <button
                  type="button"
                  onClick={previousImage}
                  className="
                    absolute
                    left-5
                    top-1/2
                    flex
                    h-14
                    w-14
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-full
                    bg-gray-100
                    text-gray-800
                    shadow-sm
                    transition
                    hover:bg-gray-200
                  "
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>

                {/* Next */}
                <button
                  type="button"
                  onClick={nextImage}
                  className="
                    absolute
                    right-5
                    top-1/2
                    flex
                    h-14
                    w-14
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-full
                    bg-gray-100
                    text-gray-800
                    shadow-sm
                    transition
                    hover:bg-gray-200
                  "
                  aria-label="Next image"
                >
                  <ChevronRight className="h-7 w-7" />
                </button>
              </div>

              {/* RIGHT — PRODUCT + IMAGE GRID */}

              <div
                className="
                  w-[360px]
                  shrink-0
                  overflow-y-auto
                  border-l
                  border-gray-200
                  bg-white
                  p-6
                "
              >
                {/* Product Header */}

                <div className="mb-6 border-b border-gray-200 pb-5">
                  <p
                    className="
                      mb-2
                      text-sm
                      font-semibold
                      tracking-[0.25em]
                      text-lime-600
                    "
                  >
                    TENOO
                  </p>

                  <h3 className="text-xl font-semibold text-gray-900">
                    {productName}
                  </h3>

                  {/* Product Tagline */}
                  {tagline && (
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                      {tagline}
                    </p>
                  )}

                  {/* Product Size */}
                  {packSize && (
                    <p className="mt-3 text-sm font-medium text-gray-700">
                      Net Weight: {packSize}
                    </p>
                  )}
                </div>

                {/* 3 x 3 Images */}

                <div className="grid grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      className={`
                        relative
                        aspect-square
                        overflow-hidden
                        rounded-xl
                        bg-gray-50
                        transition-all
                        ${
                          selectedIndex === index
                            ? 'ring-2 ring-lime-500 ring-offset-2 ring-offset-white'
                            : 'border border-gray-200 hover:border-lime-400'
                        }
                      `}
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

              {/* Close */}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="
                  absolute
                  right-5
                  top-5
                  z-20
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-full
                  bg-gray-100
                  text-gray-800
                  shadow-sm
                  transition
                  hover:bg-gray-200
                "
                aria-label="Close image viewer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* =====================================================
              MOBILE VIEWER — MOBILE ONLY
              ===================================================== */}

          <div
            className="
              flex
              h-full
              w-full
              flex-col
              bg-white
              md:hidden
            "
            onClick={(event) => event.stopPropagation()}
          >
            {/* Close */}

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="
                absolute
                right-4
                top-4
                z-30
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-slate-100
                text-slate-800
                shadow-sm
              "
              aria-label="Close image viewer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Product Name */}

            <div className="shrink-0 px-5 pb-3 pt-5">
              <p className="text-xs font-semibold tracking-[0.25em] text-lime-600">
                TENOO
              </p>

              <h3 className="mt-1 pr-12 text-lg font-semibold text-gray-900">
                {productName}
              </h3>
            </div>

            {/* Large Image */}

            <div className="relative flex min-h-0 flex-1 items-center justify-center bg-white px-4">
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

              {/* Previous */}

              <button
                type="button"
                onClick={previousImage}
                className="
                  absolute
                  left-3
                  top-1/2
                  z-20
                  flex
                  h-10
                  w-10
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-full
                  bg-slate-100
                  text-slate-800
                  shadow-sm
                "
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Next */}

              <button
                type="button"
                onClick={nextImage}
                className="
                  absolute
                  right-3
                  top-1/2
                  z-20
                  flex
                  h-10
                  w-10
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-full
                  bg-slate-100
                  text-slate-800
                  shadow-sm
                "
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* =================================================
                MOBILE — HORIZONTAL THUMBNAILS
                ================================================= */}

            <div className="shrink-0 border-t border-gray-100 bg-white px-3 py-3">
              <div className="flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={`mobile-${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className={`
                      relative
                      h-16
                      w-16
                      flex-none
                      overflow-hidden
                      rounded-lg
                      bg-gray-50
                      ${
                        selectedIndex === index
                          ? 'border-2 border-lime-500'
                          : 'border border-gray-200'
                      }
                    `}
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