import { getProductBySlug } from '@/lib/site'

const DEFAULT_PACKED_WEIGHT_KG_BY_PACK_SIZE: Record<string, number> = {
  '150g': 0.25,
  '200g': 0.3,
}

const DEFAULT_PACKED_WEIGHT_KG = 0.3

export function getProductShippingWeightKg(productSlug: string): number {
  const product = getProductBySlug(productSlug)

  if (product?.shippingWeightKg && product.shippingWeightKg > 0) {
    return product.shippingWeightKg
  }

  // Conservative packed-weight fallback until final packed SKU weights are recorded.
  return (
    (product?.packSize &&
      DEFAULT_PACKED_WEIGHT_KG_BY_PACK_SIZE[product.packSize]) ||
    DEFAULT_PACKED_WEIGHT_KG
  )
}
