-- The checkout RPC is the only client-facing path that creates orders/items.
-- SECURITY DEFINER lets it atomically update seller-owned inventory while
-- preserving the caller identity through auth.uid().
create or replace function public.checkout_cart()
returns uuid
language plpgsql
security definer
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
  if uid is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  select id into cart_id_value from public.carts where user_id = uid for update;
  if cart_id_value is null then raise exception 'EMPTY_CART'; end if;

  for item in select product_id, quantity from public.cart_items where cart_id = cart_id_value for update loop
    if item.quantity is null or item.quantity <= 0 then raise exception 'INVALID_QUANTITY'; end if;
    select id, seller_id, name, price_kes, stock, status into current_product
      from public.products where id = item.product_id for update;
    if current_product.id is null or current_product.status <> 'active' or current_product.stock < item.quantity then
      raise exception 'OUT_OF_STOCK:%', item.product_id;
    end if;
    total := total + current_product.price_kes * item.quantity;
  end loop;
  if total <= 0 then raise exception 'EMPTY_CART'; end if;

  insert into public.orders(buyer_id, status, payment_status, total_kes, reservation_expires_at)
  values (uid, 'pending', 'unpaid', total, now() + interval '15 minutes') returning id into new_order;

  for item in select product_id, quantity from public.cart_items where cart_id = cart_id_value loop
    select id, seller_id, name, price_kes, stock into current_product from public.products where id = item.product_id for update;
    insert into public.order_items(order_id, product_id, seller_id, product_name, unit_price_kes, quantity)
    values (new_order, current_product.id, current_product.seller_id, current_product.name, current_product.price_kes, item.quantity);
    update public.products
      set stock = stock - item.quantity,
          status = case when stock - item.quantity = 0 then 'sold_out' else status end,
          updated_at = now()
      where id = item.product_id;
  end loop;

  delete from public.cart_items where cart_id = cart_id_value;
  update public.carts set updated_at = now() where id = cart_id_value;
  return new_order;
end;
$$;

revoke all on function public.checkout_cart() from public, anon;
grant execute on function public.checkout_cart() to authenticated;

drop policy if exists "buyers can create own pending orders" on public.orders;
drop policy if exists "buyers can create own order items" on public.order_items;
