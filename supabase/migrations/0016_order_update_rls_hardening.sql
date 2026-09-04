-- ============================================================
-- 0016: Order update RLS hardening
-- ============================================================
-- Direct client updates to orders are intentionally disabled.
-- Order cancellation is handled by the SECURITY DEFINER
-- cancel_order() RPC, which validates the authenticated buyer
-- and restores reserved inventory atomically.

begin;

drop policy if exists "Users can update own orders" on public.orders;

commit;
