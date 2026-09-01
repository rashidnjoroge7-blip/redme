-- RedNote RBAC foundation
-- Roles are intentionally separate from public profiles.
-- Role changes must never be client-controlled.

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user'
    check (role in ('user', 'moderator', 'admin')),
  created_at timestamptz not null default now()
);

create index if not exists user_roles_role_idx
  on public.user_roles (role);

alter table public.user_roles enable row level security;

-- Users may read their own role. No client-side INSERT/UPDATE/DELETE.
drop policy if exists "users can read own role" on public.user_roles;

create policy "users can read own role"
  on public.user_roles
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Server-side authorization helper.
create or replace function public.has_rednote_role(
  requested_role text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and (
        role = requested_role
        or (requested_role = 'moderator' and role = 'admin')
        or (requested_role = 'user' and role in ('user', 'moderator', 'admin'))
      )
  );
$$;

revoke all on function public.has_rednote_role(text)
  from public, anon;

grant execute on function public.has_rednote_role(text)
  to authenticated;

-- Every newly created role record defaults to an ordinary user.
-- Initial admin assignment must be performed explicitly by a trusted
-- database administrator after identifying the intended auth.users UUID.
