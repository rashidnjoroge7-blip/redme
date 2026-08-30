-- Reconciliation is a trusted server operation only.
revoke execute on function public.reconcile_mpesa_payment(text, integer, text, text, numeric, text) from public, anon, authenticated;
revoke execute on function public.release_expired_reservations() from public, anon, authenticated;
