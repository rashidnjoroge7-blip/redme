-- Defense-in-depth RLS hardening.
-- Sensitive writes must go through controlled server/database functions.

revoke all on function public.checkout_cart() from public, anon;
grant execute on function public.checkout_cart() to authenticated;

-- Payments are created/updated by the server-side M-Pesa callback/initiation flow.
drop policy if exists "buyers create own payments" on public.payments;
drop policy if exists "buyers update own payments" on public.payments;

-- Buyers can only read their own payment records.

-- Prevent direct order creation that bypasses atomic inventory reservation.
drop policy if exists "buyers can create own pending orders" on public.orders;
drop policy if exists "buyers can create own order items" on public.order_items;

-- Prevent buyers from changing payment/order state arbitrarily.
drop policy if exists "buyers can cancel own unpaid orders" on public.orders;
create policy "buyers can cancel own unpaid orders" on public.orders
for update to authenticated
using (buyer_id = auth.uid() and status = 'pending' and payment_status = 'unpaid')
with check (buyer_id = auth.uid() and status = 'cancelled' and payment_status = 'failed');

-- Internal maintenance/reconciliation functions must never be exposed as client RPCs.
revoke all on function public.release_expired_reservations() from public, anon, authenticated;
revoke all on function public.reconcile_mpesa_payment(text) from public, anon, authenticated;

-- Media references are constrained to the appropriate public Storage bucket.
alter table public.profiles drop constraint if exists profiles_avatar_url_storage_check;
alter table public.posts drop constraint if exists posts_image_url_storage_check;
alter table public.products drop constraint if exists products_image_url_storage_check;

alter table public.profiles add constraint profiles_avatar_url_storage_check
check (avatar_url is null or avatar_url ~ '^https://[^/]+/storage/v1/object/public/avatars/');
alter table public.posts add constraint posts_image_url_storage_check
check (image_url is null or image_url ~ '^https://[^/]+/storage/v1/object/public/post-media/');
alter table public.products add constraint products_image_url_storage_check
check (image_url is null or image_url ~ '^https://[^/]+/storage/v1/object/public/product-media/');
