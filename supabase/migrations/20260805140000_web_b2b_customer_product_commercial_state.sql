-- ==============================================================================
-- Fase 6D.9B: RPC privada para estado comercial de producto B2B
-- ==============================================================================
-- Objetivo:
--   Exponer precio y disponibilidad resumida solo a clientes autenticados y
--   aprobados, sin revelar stock exacto y sin modificar las RPCs publicas.
--
-- Seguridad:
--   - No inserta precios.
--   - No inserta stock.
--   - No modifica productos.
--   - No modifica Storage.
--   - No entrega product_stock.quantity.
--   - Revoca public/anon y concede solo a authenticated.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.web_b2b_customer_get_product_commercial_state(
  p_company_id uuid,
  p_product_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_can_view_prices boolean;
  v_product_exists boolean;
  v_price numeric(12,2);
  v_currency text;
  v_price_updated_at timestamptz;
  v_stock_status text;
  v_stock_quantity integer;
  v_stock_updated_at timestamptz;
  v_availability_status text;
  v_can_purchase boolean;
  v_reason text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'access_status', 'login_required',
      'can_view_price', false,
      'price', NULL,
      'currency', NULL,
      'availability_status', NULL,
      'can_purchase', false,
      'reason', 'login_required'
    );
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM web_b2b.products p
    WHERE p.company_id = p_company_id
      AND p.id = p_product_id
      AND p.is_active = true
      AND p.is_visible = true
      AND p.review_status = 'published'
  )
  INTO v_product_exists;

  IF NOT v_product_exists THEN
    RETURN jsonb_build_object(
      'access_status', 'not_available',
      'can_view_price', false,
      'price', NULL,
      'currency', NULL,
      'availability_status', NULL,
      'can_purchase', false,
      'reason', 'product_not_available'
    );
  END IF;

  SELECT web_b2b.customer_can_view_prices_for_company(p_company_id)
  INTO v_can_view_prices;

  IF NOT COALESCE(v_can_view_prices, false) THEN
    RETURN jsonb_build_object(
      'access_status', 'not_approved',
      'can_view_price', false,
      'price', NULL,
      'currency', NULL,
      'availability_status', NULL,
      'can_purchase', false,
      'reason', 'customer_not_approved'
    );
  END IF;

  SELECT pp.price, pp.currency, pp.updated_at
  INTO v_price, v_currency, v_price_updated_at
  FROM web_b2b.product_prices pp
  WHERE pp.company_id = p_company_id
    AND pp.product_id = p_product_id
  ORDER BY
    CASE pp.source
      WHEN 'bsale' THEN 1
      WHEN 'manual' THEN 2
      WHEN 'import' THEN 3
      ELSE 4
    END,
    pp.updated_at DESC NULLS LAST
  LIMIT 1;

  SELECT ps.status, ps.quantity, ps.updated_at
  INTO v_stock_status, v_stock_quantity, v_stock_updated_at
  FROM web_b2b.product_stock ps
  WHERE ps.company_id = p_company_id
    AND ps.product_id = p_product_id
  ORDER BY
    CASE ps.source
      WHEN 'bsale' THEN 1
      WHEN 'manual' THEN 2
      WHEN 'import' THEN 3
      ELSE 4
    END,
    ps.updated_at DESC NULLS LAST
  LIMIT 1;

  v_availability_status := CASE
    WHEN v_stock_status IS NULL THEN 'consult'
    WHEN v_stock_status = 'out_of_stock' THEN 'out_of_stock'
    WHEN v_stock_status = 'low_stock' THEN 'low_stock'
    WHEN v_stock_quantity <= 0 THEN 'out_of_stock'
    WHEN v_stock_status = 'in_stock' THEN 'available'
    ELSE 'consult'
  END;

  IF v_price IS NULL THEN
    v_can_purchase := false;
    v_reason := 'missing_price';
  ELSIF v_availability_status IN ('out_of_stock', 'consult') THEN
    v_can_purchase := false;
    v_reason := CASE
      WHEN v_availability_status = 'out_of_stock' THEN 'out_of_stock'
      ELSE 'missing_stock'
    END;
  ELSE
    v_can_purchase := true;
    v_reason := NULL;
  END IF;

  RETURN jsonb_build_object(
    'access_status', 'approved',
    'can_view_price', true,
    'price', v_price,
    'currency', v_currency,
    'availability_status', v_availability_status,
    'can_purchase', v_can_purchase,
    'reason', v_reason,
    'price_updated_at', v_price_updated_at,
    'stock_updated_at', v_stock_updated_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.web_b2b_customer_get_product_commercial_state(uuid, uuid) FROM public;
REVOKE ALL ON FUNCTION public.web_b2b_customer_get_product_commercial_state(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.web_b2b_customer_get_product_commercial_state(uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.web_b2b_customer_get_product_commercial_state(uuid, uuid) TO authenticated;
