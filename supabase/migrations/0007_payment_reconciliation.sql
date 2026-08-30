-- Atomic payment settlement/reconciliation.
-- Both payment callbacks and reservation cleanup lock the order before changing state.

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
  select id, order_id, amount_kes, phone, status
    into payment_row
    from public.payments
    where checkout_request_id = p_checkout_request_id
    for update;

  if payment_row.id is null then return 'IGNORED_UNKNOWN_PAYMENT'; end if;

  select id, status, payment_status, reservation_expires_at
    into order_row
    from public.orders
    where id = payment_row.order_id
    for update;

  if payment_row.status = 'paid' then return 'ALREADY_PAID'; end if;

  expected_phone := regexp_replace(coalesce(payment_row.phone, ''), '\D', '', 'g');

  if p_result_code = 0 then
    if p_receipt is null or p_callback_amount is null or p_callback_amount <> payment_row.amount_kes
       or (p_callback_phone is not null and p_callback_phone <> expected_phone) then
      update public.payments set result_code = p_result_code, result_description = 'Callback validation failed', updated_at = now() where id = payment_row.id;
      return 'VALIDATION_FAILED';
    end if;

    update public.payments
      set status = 'paid', result_code = p_result_code, result_description = p_result_description,
          mpesa_receipt = p_receipt, updated_at = now()
      where id = payment_row.id and status = 'pending';

    if order_row.payment_status = 'unpaid' and order_row.status = 'pending' then
      update public.orders
        set status = 'processing', payment_status = 'paid', reservation_expires_at = null, updated_at = now()
        where id = order_row.id;
      return 'PAID';
    end if;
    return 'PAYMENT_RECORDED_ORDER_NOT_PENDING';
  end if;

  if order_row.payment_status = 'unpaid' and order_row.status = 'pending' then
    update public.payments
      set status = 'failed', result_code = p_result_code, result_description = p_result_description, updated_at = now()
      where id = payment_row.id and status <> 'paid';
    update public.orders
      set status = 'failed', payment_status = 'failed', updated_at = now()
      where id = order_row.id and payment_status = 'unpaid';
    return 'FAILED';
  end if;

  return 'PAYMENT_TERMINAL_STATE';
end;
$$;

-- Lock each pending order before returning reserved stock. A concurrent callback
-- therefore either settles payment first or expires the reservation first.
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
    select id from public.orders
    where status = 'pending' and payment_status = 'unpaid'
      and reservation_expires_at is not null and reservation_expires_at < now()
    for update
  loop
    for item in select product_id, quantity from public.order_items where order_id = order_row.id loop
      if item.product_id is not null then
        update public.products
          set stock = stock + item.quantity,
              status = case when stock + item.quantity > 0 then 'active' else status end,
              updated_at = now()
          where id = item.product_id;
      end if;
    end loop;

    update public.orders
      set status = 'cancelled', payment_status = 'failed', updated_at = now()
      where id = order_row.id and status = 'pending' and payment_status = 'unpaid';
    released := released + 1;
  end loop;
  return released;
end;
$$;
