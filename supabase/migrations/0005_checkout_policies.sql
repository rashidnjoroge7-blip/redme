-- Checkout API uses the authenticated Supabase session, so RLS must permit
-- creation of an order for that same buyer and its immutable item snapshots.
do $$ begin
  create policy "buyers can create own pending orders" on public.orders
    for insert to authenticated
    with check (buyer_id = auth.uid() and status = 'pending' and payment_status = 'unpaid');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "buyers can create own order items" on public.order_items
    for insert to authenticated
    with check (
      exists (
        select 1 from public.orders o
        where o.id = order_id and o.buyer_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "buyers can cancel own unpaid orders" on public.orders
    for update to authenticated
    using (buyer_id = auth.uid() and status = 'pending' and payment_status = 'unpaid')
    with check (buyer_id = auth.uid() and status = 'cancelled' and payment_status = 'failed');
exception when duplicate_object then null; end $$;
