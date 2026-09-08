-- 0019_harden_mpesa_reconciliation.sql

CREATE OR REPLACE FUNCTION public.reconcile_mpesa_payment(
  p_checkout_request_id text,
  p_result_code integer,
  p_result_description text,
  p_receipt text,
  p_callback_amount numeric,
  p_callback_phone text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  payment_row record;
  expected_phone text;
  callback_phone_normalized text;
begin
  if p_checkout_request_id is null
     or btrim(p_checkout_request_id) = '' then
    return 'INVALID_CHECKOUT_REQUEST';
  end if;

  select id, order_id, amount_kes, phone, status
  into payment_row
  from public.payments
  where checkout_request_id = p_checkout_request_id
  for update;

  if payment_row.id is null then
    return 'PAYMENT_NOT_FOUND';
  end if;

  -- Never allow a later callback to downgrade a payment that is
  -- already confirmed as paid.
  if payment_row.status = 'paid' then
    return 'ALREADY_PAID';
  end if;

  expected_phone := regexp_replace(
    coalesce(payment_row.phone, ''),
    '\D',
    '',
    'g'
  );

  if expected_phone ~ '^0[17][0-9]{8}$' then
    expected_phone := '254' || substr(expected_phone, 2);
  elsif expected_phone ~ '^[17][0-9]{8}$' then
    expected_phone := '254' || expected_phone;
  end if;

  callback_phone_normalized := regexp_replace(
    coalesce(p_callback_phone, ''),
    '\D',
    '',
    'g'
  );

  if callback_phone_normalized ~ '^0[17][0-9]{8}$' then
    callback_phone_normalized := '254' || substr(callback_phone_normalized, 2);
  elsif callback_phone_normalized ~ '^[17][0-9]{8}$' then
    callback_phone_normalized := '254' || callback_phone_normalized;
  end if;

  if p_result_code = 0 then
    if p_receipt is null
       or btrim(p_receipt) = ''
       or p_callback_amount is null
       or p_callback_amount <> payment_row.amount_kes
       or expected_phone = ''
       or callback_phone_normalized = ''
       or callback_phone_normalized <> expected_phone
    then
      update public.payments
      set result_code = p_result_code,
          result_description = 'Callback validation failed',
          updated_at = now()
      where id = payment_row.id;

      return 'CALLBACK_VALIDATION_FAILED';
    end if;

    update public.payments
    set status = 'paid',
        result_code = p_result_code,
        result_description = p_result_description,
        mpesa_receipt = p_receipt,
        updated_at = now()
    where id = payment_row.id;

    update public.orders
    set payment_status = 'paid',
        status = case
          when status = 'pending' then 'processing'
          else status
        end,
        updated_at = now()
    where id = payment_row.order_id;

    return 'PAID';
  end if;

  update public.payments
  set status = 'failed',
      result_code = p_result_code,
      result_description = p_result_description,
      updated_at = now()
  where id = payment_row.id
    and status <> 'paid';

  update public.orders
  set payment_status = 'failed',
      updated_at = now()
  where id = payment_row.order_id
    and payment_status <> 'paid';

  return 'FAILED';
end;
$function$;

REVOKE ALL ON FUNCTION public.reconcile_mpesa_payment(
  text,
  integer,
  text,
  text,
  numeric,
  text
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.reconcile_mpesa_payment(
  text,
  integer,
  text,
  text,
  numeric,
  text
) FROM anon;

REVOKE ALL ON FUNCTION public.reconcile_mpesa_payment(
  text,
  integer,
  text,
  text,
  numeric,
  text
) FROM authenticated;
