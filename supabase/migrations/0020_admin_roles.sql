-- RedNote Stage 1: administrator authorization foundation.
-- Roles are stored on profiles and checked server-side through a SECURITY DEFINER RPC.

alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('user', 'moderator', 'admin', 'super_admin'));

create index if not exists profiles_role_idx on public.profiles (role);

create or replace function public.is_admin_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'super_admin')
  );
$$;

revoke all on function public.is_admin_user() from public;
grant execute on function public.is_admin_user() to authenticated;
