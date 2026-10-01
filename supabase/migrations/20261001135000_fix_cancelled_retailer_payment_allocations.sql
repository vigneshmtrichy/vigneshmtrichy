-- Release payment allocations when a retailer order is cancelled.
-- The payment remains on the retailer account and becomes unapplied credit,
-- so it can be allocated to another outstanding order later.
BEGIN;

CREATE OR REPLACE FUNCTION public.sync_retailer_order_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  item record;
BEGIN
  IF OLD.order_status IS NOT DISTINCT FROM NEW.order_status THEN
    RETURN NEW;
  END IF;

  IF OLD.order_status = 'cancelled' AND NEW.order_status <> 'cancelled' THEN
    RAISE EXCEPTION 'Cancelled retailer orders cannot be reopened; create a new order instead' USING ERRCODE = 'P0001';
  END IF;

  IF NEW.order_status = 'cancelled' AND OLD.order_status <> 'cancelled' THEN
    -- Any payment allocated to this invoice must return to the retailer's
    -- unapplied balance instead of remaining attached to a cancelled order.
    DELETE FROM public.retailer_payment_allocations
    WHERE retailer_order_id = OLD.id;

    IF OLD.inventory_reserved THEN
      FOR item IN
        SELECT product_slug, quantity
        FROM public.retailer_order_items
        WHERE retailer_order_id = OLD.id
        ORDER BY product_slug
      LOOP
        UPDATE public.product_status
        SET stock_quantity = stock_quantity + item.quantity,
            status = CASE
              WHEN status = 'out-of-stock' AND stock_quantity = 0 THEN 'active'
              ELSE status
            END
        WHERE product_slug = item.product_slug AND stock_quantity IS NOT NULL;
      END LOOP;

      NEW.inventory_reserved := false;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

COMMIT;
