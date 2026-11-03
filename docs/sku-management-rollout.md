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

## Phase 2 — intentionally deferred
Before SKU-level order stock deduction is enabled, update together:
- online order RPC `create_order_with_stock` and its cancellation/reopen trigger;
- retailer order RPC `create_retailer_order_with_stock` and cancellation trigger;
- online cart/checkout payload and order JSON item snapshots;
- retailer order create payload, `retailer_order_items` and `retailer_product_prices` lookup;
- invoices/order history to show the SKU pack and preserve snapshots;
- migration/backfill tests proving every historic `product_slug` maps unambiguously to a SKU.
Do not infer a pack size for older orders. Existing orders must continue to use their saved product slug/name/price snapshots.

## Safety
- This migration is additive; it does not update or delete existing product/order/stock/payment rows.
- No production SQL was executed and no deployment was triggered.
- RLS uses the same admin email guard found in existing admin code and migrations.
