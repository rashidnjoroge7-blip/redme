-- RedNote schema reconciliation
-- Brings the existing legacy Supabase schema into alignment with
-- the current Next.js application without deleting existing products.

begin;

-- ============================================================
-- 1. Modern cart model
-- ============================================================

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (cart_id, product_id)
);

create index if not exists carts_user_idx
  on public.carts(user_id);

create index if not exists cart_items_product_idx
  on public.cart_items(product_id);

-- ============================================================
-- 2. Reconcile products
-- Existing 8 products are preserved.
-- ============================================================

alter table public.products
  add column if not exists seller_id uuid;

alter table public.products
  add column if not exists price_kes numeric(12,2);

alter table public.products
  add column if not exists stock integer;

alter table public.products
  add column if not exists status text;

alter table public.products
  add column if not exists updated_at timestamptz;

-- Preserve the existing price values.
update public.products
set price_kes = price
where price_kes is null;

-- Existing products have no known inventory quantity.
-- Start them at zero rather than inventing stock.
update public.products
set stock = 0
where stock is null;

update public.products
set status = case
  when is_active = true then 'active'
  else 'inactive'
end
where status is null;

update public.products
set updated_at = coalesce(created_at, now())
where updated_at is null;

alter table public.products
  alter column price_kes set default 0,
  alter column stock set default 0,
  alter column status set default 'active',
  alter column updated_at set default now();

alter table public.products
  drop constraint if exists products_status_check;

alter table public.products
  add constraint products_status_check
  check (status in ('active', 'inactive', 'sold_out'));

alter table public.products
  drop constraint if exists products_stock_check;

alter table public.products
  add constraint products_stock_check
  check (stock >= 0);

alter table public.products
  drop constraint if exists products_seller_id_fkey;

alter table public.products
  add constraint products_seller_id_fkey
  foreign key (seller_id)
  references public.profiles(id)
  on delete cascade;

create index if not exists products_seller_id_idx
  on public.products(seller_id);

-- ============================================================
-- 3. Reconcile orders
-- Existing orders table is empty, so add the modern fields
-- without deleting the legacy fields.
-- ============================================================

alter table public.orders
  add column if not exists buyer_id uuid;

alter table public.orders
  add column if not exists payment_status text;

alter table public.orders
  add column if not exists total_kes numeric(12,2);

alter table public.orders
  add column if not exists reservation_expires_at timestamptz;

update public.orders
set buyer_id = user_id
where buyer_id is null;

update public.orders
set total_kes = total_amount
where total_kes is null;

update public.orders
set payment_status = case
  when lower(coalesce(status, 'pending')) in ('paid', 'processing', 'shipped', 'completed')
    then 'paid'
  when lower(coalesce(status, 'pending')) in ('failed', 'cancelled')
    then 'failed'
  else 'unpaid'
end
where payment_status is null;

alter table public.orders
  alter column buyer_id set default auth.uid(),
  alter column payment_status set default 'unpaid',
  alter column total_kes set default 0;

alter table public.orders
  drop constraint if exists orders_buyer_id_fkey;

alter table public.orders
  add constraint orders_buyer_id_fkey
  foreign key (buyer_id)
  references public.profiles(id)
  on delete restrict;

alter table public.orders
  drop constraint if exists orders_payment_status_check;

alter table public.orders
  add constraint orders_payment_status_check
  check (
    payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded')
  );

alter table public.orders
  drop constraint if exists orders_total_kes_check;

alter table public.orders
  add constraint orders_total_kes_check
  check (total_kes >= 0);

create index if not exists orders_buyer_created_idx
  on public.orders(buyer_id, created_at desc);

create index if not exists orders_reservation_expiry_idx
  on public.orders(reservation_expires_at)
  where status = 'pending';

-- ============================================================
-- 4. Reconcile order_items
-- Existing table is empty.
-- ============================================================

alter table public.order_items
  add column if not exists seller_id uuid;

alter table public.order_items
  add column if not exists product_name text;

alter table public.order_items
  add column if not exists unit_price_kes numeric(12,2);

update public.order_items oi
set product_name = p.name
from public.products p
where oi.product_id = p.id
  and oi.product_name is null;

update public.order_items
set unit_price_kes = unit_price
where unit_price_kes is null;

alter table public.order_items
  alter column unit_price_kes set default 0;

alter table public.order_items
  drop constraint if exists order_items_seller_id_fkey;

alter table public.order_items
  add constraint order_items_seller_id_fkey
  foreign key (seller_id)
  references public.profiles(id)
  on delete set null;

alter table public.order_items
  drop constraint if exists order_items_unit_price_kes_check;

alter table public.order_items
  add constraint order_items_unit_price_kes_check
  check (unit_price_kes >= 0);

create index if not exists order_items_order_idx
  on public.order_items(order_id);

-- ============================================================
-- 5. Payments
-- ============================================================

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  provider text not null default 'mpesa',
  phone text,
  amount_kes numeric(12,2) not null check (amount_kes >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed')),
  merchant_request_id text,
  checkout_request_id text unique,
  result_code integer,
  result_description text,
  mpesa_receipt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_order_idx
  on public.payments(order_id);

create index if not exists payments_checkout_request_idx
  on public.payments(checkout_request_id);

-- ============================================================
-- 6. Messaging participant compatibility
-- ============================================================

create table if not exists public.conversation_participants (
  conversation_id uuid not null
    references public.conversations(id)
    on delete cascade,
  user_id uuid not null
    references public.profiles(id)
    on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create index if not exists conversation_participants_user_idx
  on public.conversation_participants(user_id);

-- ============================================================
-- 7. RPC: direct conversation
-- ============================================================

create or replace function public.create_direct_conversation(
  other_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  conversation_id_value uuid;
begin
  if uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if other_user_id is null or other_user_id = uid then
    raise exception 'INVALID_PARTICIPANT';
  end if;

  select c.id
    into conversation_id_value
  from public.conversations c
  where
    (c.participant_1 = uid and c.participant_2 = other_user_id)
    or
    (c.participant_1 = other_user_id and c.participant_2 = uid)
  limit 1;

  if conversation_id_value is not null then
    return conversation_id_value;
  end if;

  insert into public.conversations (
    participant_1,
    participant_2
  )
  values (
    uid,
    other_user_id
  )
  returning id into conversation_id_value;

  insert into public.conversation_participants (
    conversation_id,
    user_id
  )
  values
    (conversation_id_value, uid),
    (conversation_id_value, other_user_id)
  on conflict do nothing;

  return conversation_id_value;
end;
$$;

-- ============================================================
-- 8. Checkout RPC
-- ============================================================

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
  if uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select id
    into cart_id_value
  from public.carts
  where user_id = uid
  for update;

  if cart_id_value is null then
    raise exception 'EMPTY_CART';
  end if;

  for item in
    select product_id, quantity
    from public.cart_items
    where cart_id = cart_id_value
    for update
  loop
    select
      id,
      seller_id,
      name,
      price_kes,
      stock,
      status
    into current_product
    from public.products
    where id = item.product_id
    for update;

    if current_product.id is null then
      raise exception 'PRODUCT_NOT_FOUND:%', item.product_id;
    end if;

    if current_product.status <> 'active'
       or current_product.stock < item.quantity then
      raise exception 'OUT_OF_STOCK:%', item.product_id;
    end if;

    total := total + current_product.price_kes * item.quantity;
  end loop;

  if total <= 0 then
    raise exception 'EMPTY_CART';
  end if;

  insert into public.orders (
    buyer_id,
    status,
    payment_status,
    total_kes,
    reservation_expires_at
  )
  values (
    uid,
    'pending',
    'unpaid',
    total,
    now() + interval '15 minutes'
  )
  returning id into new_order;

  for item in
    select product_id, quantity
    from public.cart_items
    where cart_id = cart_id_value
  loop
    select
      id,
      seller_id,
      name,
      price_kes
    into current_product
    from public.products
    where id = item.product_id
    for update;

    insert into public.order_items (
      order_id,
      product_id,
      seller_id,
      product_name,
      unit_price_kes,
      quantity
    )
    values (
      new_order,
      current_product.id,
      current_product.seller_id,
      current_product.name,
      current_product.price_kes,
      item.quantity
    );

    update public.products
    set
      stock = stock - item.quantity,
      status = case
        when stock - item.quantity = 0 then 'sold_out'
        else status
      end,
      updated_at = now()
    where id = item.product_id;
  end loop;

  delete from public.cart_items
  where cart_id = cart_id_value;

  update public.carts
  set updated_at = now()
  where id = cart_id_value;

  return new_order;
end;
$$;

-- ============================================================
-- 9. Release expired reservations
-- ============================================================

create or replace function public.release_expired_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  released integer := 0;
  order_row record;
  item record;
begin
  for order_row in
    select id
    from public.orders
    where status = 'pending'
      and payment_status = 'unpaid'
      and reservation_expires_at is not null
      and reservation_expires_at < now()
    for update
  loop
    for item in
      select product_id, quantity
      from public.order_items
      where order_id = order_row.id
    loop
      if item.product_id is not null then
        update public.products
        set
          stock = stock + item.quantity,
          status = case
            when stock + item.quantity > 0 then 'active'
            else status
          end,
          updated_at = now()
        where id = item.product_id;
      end if;
    end loop;

    update public.orders
    set
      status = 'cancelled',
      payment_status = 'failed',
      updated_at = now()
    where id = order_row.id
      and status = 'pending'
      and payment_status = 'unpaid';

    released := released + 1;
  end loop;

  return released;
end;
$$;

-- ============================================================
-- 10. M-Pesa reconciliation
-- ============================================================

create or replace function public.reconcile_mpesa_payment(
  p_checkout_request_id text,
  p_result_code integer,
  p_result_description text,
  p_receipt text,
  p_callback_amount numeric,
  p_callback_phone text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  payment_row record;
  order_row record;
  expected_phone text;
begin
  select
    id,
    order_id,
    amount_kes,
    phone,
    status
  into payment_row
  from public.payments
  where checkout_request_id = p_checkout_request_id
  for update;

  if payment_row.id is null then
    return 'IGNORED_UNKNOWN_PAYMENT';
  end if;

  select
    id,
    status,
    payment_status,
    reservation_expires_at
  into order_row
  from public.orders
  where id = payment_row.order_id
  for update;

  if payment_row.status = 'paid' then
    return 'ALREADY_PAID';
  end if;

  expected_phone :=
    regexp_replace(coalesce(payment_row.phone, ''), '\D', '', 'g');

  if p_result_code = 0 then
    if p_receipt is null
       or p_callback_amount is null
       or p_callback_amount <> payment_row.amount_kes
       or (
         p_callback_phone is not null
         and p_callback_phone <> expected_phone
       )
    then
      update public.payments
      set
        result_code = p_result_code,
        result_description = 'Callback validation failed',
        updated_at = now()
      where id = payment_row.id;

      return 'VALIDATION_FAILED';
    end if;

    update public.payments
    set
      status = 'paid',
      result_code = p_result_code,
      result_description = p_result_description,
      mpesa_receipt = p_receipt,
      updated_at = now()
    where id = payment_row.id
      and status = 'pending';

    if order_row.payment_status = 'unpaid'
       and order_row.status = 'pending'
    then
      update public.orders
      set
        status = 'processing',
        payment_status = 'paid',
        reservation_expires_at = null,
        updated_at = now()
      where id = order_row.id;

      return 'PAID';
    end if;

    return 'PAYMENT_RECORDED_ORDER_NOT_PENDING';
  end if;

  if order_row.payment_status = 'unpaid'
     and order_row.status = 'pending'
  then
    update public.payments
    set
      status = 'failed',
      result_code = p_result_code,
      result_description = p_result_description,
      updated_at = now()
    where id = payment_row.id
      and status <> 'paid';

    update public.orders
    set
      status = 'failed',
      payment_status = 'failed',
      updated_at = now()
    where id = order_row.id
      and payment_status = 'unpaid';

    return 'FAILED';
  end if;

  return 'PAYMENT_TERMINAL_STATE';
end;
$$;

-- ============================================================
-- 11. Permissions
-- ============================================================

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.payments enable row level security;
alter table public.conversation_participants enable row level security;

drop policy if exists "users read own cart" on public.carts;
create policy "users read own cart"
  on public.carts
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "users create own cart" on public.carts;
create policy "users create own cart"
  on public.carts
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users update own cart" on public.carts;
create policy "users update own cart"
  on public.carts
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "users read own cart items" on public.cart_items;
create policy "users read own cart items"
  on public.cart_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.carts c
      where c.id = cart_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "users add to own cart" on public.cart_items;
create policy "users add to own cart"
  on public.cart_items
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.carts c
      where c.id = cart_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "users update own cart items" on public.cart_items;
create policy "users update own cart items"
  on public.cart_items
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.carts c
      where c.id = cart_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.carts c
      where c.id = cart_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "users delete own cart items" on public.cart_items;
create policy "users delete own cart items"
  on public.cart_items
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.carts c
      where c.id = cart_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "users read own payments" on public.payments;
create policy "users read own payments"
  on public.payments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_id
        and o.buyer_id = auth.uid()
    )
  );

drop policy if exists "users read their participation" on public.conversation_participants;
create policy "users read their participation"
  on public.conversation_participants
  for select
  to authenticated
  using (user_id = auth.uid());

-- RPC permissions
revoke all on function public.checkout_cart() from public, anon;
grant execute on function public.checkout_cart() to authenticated;

revoke all on function public.create_direct_conversation(uuid) from public, anon;
grant execute on function public.create_direct_conversation(uuid) to authenticated;

revoke all on function public.release_expired_reservations() from public, anon, authenticated;
grant execute on function public.release_expired_reservations() to service_role;

revoke all on function public.reconcile_mpesa_payment(
  text,
  integer,
  text,
  text,
  numeric,
  text
) from public, anon, authenticated;

grant execute on function public.reconcile_mpesa_payment(
  text,
  integer,
  text,
  text,
  numeric,
  text
) to service_role;

commit;