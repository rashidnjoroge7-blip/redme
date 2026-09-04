-- ============================================================
-- 0015: Checkout security hardening
-- ============================================================
-- checkout_cart performs trusted transactional writes:
-- orders, order_items, products, cart_items and carts.
--
-- RLS intentionally prevents clients from performing those
-- writes directly. The RPC therefore executes as SECURITY DEFINER
-- while retaining explicit authentication checks inside the function.

begin;

alter function public.checkout_cart()
  security definer;

alter function public.checkout_cart()
  set search_path = public;

revoke all on function public.checkout_cart() from public, anon, authenticated;

grant execute on function public.checkout_cart() to authenticated;

commit;
