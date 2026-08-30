-- RedNote marketplace foundation.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  description text,
  price_kes numeric(12,2) not null check (price_kes >= 0),
  image_url text,
  stock integer not null default 0 check (stock >= 0),
  status text not null default 'active' check (status in ('active','inactive','sold_out')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','paid','processing','shipped','completed','cancelled','failed')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','failed','refunded')),
  total_kes numeric(12,2) not null check (total_kes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  seller_id uuid references public.profiles(id) on delete set null,
  product_name text not null,
  unit_price_kes numeric(12,2) not null check (unit_price_kes >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index if not exists products_created_idx on public.products(created_at desc);
create index if not exists products_seller_idx on public.products(seller_id);
create index if not exists cart_items_cart_idx on public.cart_items(cart_id);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists orders_buyer_created_idx on public.orders(buyer_id, created_at desc);

alter table public.products enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

do $$ begin
 create policy "active products are public" on public.products for select using (status = 'active' or seller_id = auth.uid());
 create policy "sellers create products" on public.products for insert to authenticated with check (seller_id = auth.uid());
 create policy "sellers update products" on public.products for update to authenticated using (seller_id = auth.uid()) with check (seller_id = auth.uid());
 create policy "sellers delete products" on public.products for delete to authenticated using (seller_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
 create policy "users read own cart" on public.carts for select to authenticated using (user_id = auth.uid());
 create policy "users create own cart" on public.carts for insert to authenticated with check (user_id = auth.uid());
 create policy "users update own cart" on public.carts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
 create policy "users read own cart items" on public.cart_items for select to authenticated using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
 create policy "users add to own cart" on public.cart_items for insert to authenticated with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
 create policy "users update own cart items" on public.cart_items for update to authenticated using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())) with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
 create policy "users delete own cart items" on public.cart_items for delete to authenticated using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
 create policy "buyers read own orders" on public.orders for select to authenticated using (buyer_id = auth.uid());
 create policy "buyers read own order items" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()));
exception when duplicate_object then null; end $$;
