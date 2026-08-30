-- Transaction-safe checkout primitives.
-- The client must never calculate or provide the authoritative order total.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  provider text not null default 'mpesa' check (provider in ('mpesa')),
  merchant_request_id text,
  checkout_request_id text,
  mpesa_receipt text,
  phone text,
  amount_kes numeric(12,2) not null check (amount_kes >= 0),
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled')),
  result_code integer,
  result_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payments_checkout_request_uidx on public.payments(checkout_request_id) where checkout_request_id is not null;
create unique index if not exists payments_mpesa_receipt_uidx on public.payments(mpesa_receipt) where mpesa_receipt is not null;
create index if not exists payments_order_idx on public.payments(order_id);

alter table public.payments enable row level security;

do $$ begin
 create policy "buyers read own payments" on public.payments for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()));
exception when duplicate_object then null; end $$;

-- Trusted server transaction: lock products, verify stock, snapshot prices, create order,
-- decrement inventory, and clear the cart atomically.
create or replace function public.checkout_cart()
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cart_id_value uuid;
  new_order uuid;
  item record;
  current_product record;
  total numeric(12,2) := 0;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select id into cart_id_value from public.carts where user_id = uid for update;
  if cart_id_value is null then raise exception 'EMPTY_CART'; end if;

  for item in select product_id, quantity from public.cart_items where cart_id = cart_id_value for update loop
    select id, seller_id, name, price_kes, stock, status into current_product
      from public.products where id = item.product_id for update;
    if current_product.id is null or current_product.status <> 'active' or current_product.stock < item.quantity then
      raise exception 'OUT_OF_STOCK:%', item.product_id;
    end if;
    total := total + current_product.price_kes * item.quantity;
  end loop;

  if total = 0 then raise exception 'EMPTY_CART'; end if;

  insert into public.orders(buyer_id, status, payment_status, total_kes)
  values (uid, 'pending', 'unpaid', total)
  returning id into new_order;

  for item in select product_id, quantity from public.cart_items where cart_id = cart_id_value loop
    select id, seller_id, name, price_kes, stock into current_product from public.products where id = item.product_id for update;
    insert into public.order_items(order_id, product_id, seller_id, product_name, unit_price_kes, quantity)
    values (new_order, current_product.id, current_product.seller_id, current_product.name, current_product.price_kes, item.quantity);
    update public.products set stock = stock - item.quantity, status = case when stock - item.quantity = 0 then 'sold_out' else status end, updated_at = now() where id = item.product_id;
  end loop;

  delete from public.cart_items where cart_id = cart_id_value;
  update public.carts set updated_at = now() where id = cart_id_value;
  return new_order;
end;
$$;
