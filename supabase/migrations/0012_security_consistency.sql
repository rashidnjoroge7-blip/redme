-- Security consistency pass.
-- Social/marketplace media is intentionally public-read; writes remain owner-scoped.
update storage.buckets
set public = true
where id in ('avatars', 'post-media', 'product-media');

-- The helper is not needed by application code and must not be an RPC surface.
revoke all on function public.is_rednote_storage_url(text, text) from public, anon, authenticated;

-- Release/reconciliation are server-only maintenance functions. Revoke every
-- overload by name so a signature mismatch cannot accidentally expose an RPC.
do $$
declare r record;
begin
  for r in
    select n.nspname as schema_name, p.proname as function_name,
           pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('release_expired_reservations', 'reconcile_mpesa_payment')
  loop
    execute format('revoke all on function %I.%I(%s) from public, anon, authenticated', r.schema_name, r.function_name, r.args);
  end loop;
end $$;

-- checkout_cart is the sole authenticated checkout RPC.
revoke all on function public.checkout_cart() from public, anon;
grant execute on function public.checkout_cart() to authenticated;
