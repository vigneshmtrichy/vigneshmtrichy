# Tenoo SKU Management — rollout notes

## Architecture
- Existing `product_status.product_slug` stays the parent product identity.
- `product_skus` adds pack-size variants, unique SKU codes, optional barcode, SKU prices, tax and shipping weight.
- `sku_inventory` stores SKU-level counts and reorder thresholds.
- `sku_stock_movements` is the audit ledger for future controlled inventory changes.

## Phase 1
1. Review and apply `supabase/migrations/20261103100000_sku_foundation.sql` in staging first.
2. Deploy the code on `feat/tenoo-sku-management`.
3. Open `/admin/skus`, create a child SKU for each existing parent product/pack size.
4. Do not move existing stock quantities into `sku_inventory` yet. Existing inventory/order logic remains authoritative and continues using `product_status.stock_quantity`.

## Phase 2 — implementation in progress
The branch now contains `20261103130000_sku_order_integration.sql` and the related application changes:
- Online manual order API and Cashfree payment-intent creation validate the submitted SKU against the database and snapshot its SKU code, pack size and price.
- Cashfree still creates the actual order and deducts stock only after server-side payment verification.
- Online order reservation, cancellation and reopen triggers use SKU inventory when it is tracked, with legacy parent-stock fallback for older/non-SKU items.
- Retailer trade-order creation accepts SKU IDs, applies retailer-SKU override → legacy retailer-product override → SKU retailer price → parent retailer price, and records SKU stock movements.
- Retailer cancellation restores the same SKU stock once; cancelled retailer orders remain non-reopenable.
- Cart lines are keyed by parent product + SKU, and product pages expose active pack variants.
- Online invoice and customer order history display the selected pack.

## Phase 2 rollout
1. Review the application changes and run the Vercel Preview build.
2. Apply `20261103130000_sku_order_integration.sql` to a staging database only after SQL review.
3. Test one online Cashfree payment, one manual order, one retailer order, stock deduction, cancellation, and pending-order expiry.
4. Verify legacy items without `sku_id` still use parent stock and historical orders are unchanged.
5. Only then approve a controlled production migration and deployment.

Do not infer pack sizes for older orders. Existing order JSON and retailer order items keep nullable SKU identifiers; historical snapshots remain untouched.

## Safety
- This migration is additive; it does not update or delete existing product/order/stock/payment rows.
- No production SQL was executed and no deployment was triggered.
- RLS uses the same admin email guard found in existing admin code and migrations.
