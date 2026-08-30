-- RedNote core social schema
-- This migration is intentionally additive/idempotent for a fresh or partially
-- initialized Supabase project. Review existing production tables before applying.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  username text unique,
  avatar_url text,
  bio text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'Other',
  image_url text,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_category_created_at_idx on public.posts (category, created_at desc);
create index if not exists posts_user_id_idx on public.posts (user_id);
create index if not exists comments_post_id_created_at_idx on public.comments (post_id, created_at desc);
create index if not exists likes_post_id_idx on public.likes (post_id);
create index if not exists saves_user_id_idx on public.saves (user_id);
create index if not exists follows_following_id_idx on public.follows (following_id);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.saves enable row level security;
alter table public.follows enable row level security;

-- Public discovery reads. Mutations remain authenticated and ownership-scoped.
do $$ begin
  create policy "profiles are publicly readable" on public.profiles
    for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users can update their profile" on public.profiles
    for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "posts are publicly readable" on public.posts
    for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "authenticated users can create posts" on public.posts
    for insert to authenticated with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "authors can update posts" on public.posts
    for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "authors can delete posts" on public.posts
    for delete to authenticated using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "comments are publicly readable" on public.comments
    for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "authenticated users can comment as themselves" on public.comments
    for insert to authenticated with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "comment authors can update comments" on public.comments
    for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "comment authors can delete comments" on public.comments
    for delete to authenticated using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "likes are publicly readable" on public.likes
    for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users can create their own likes" on public.likes
    for insert to authenticated with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users can delete their own likes" on public.likes
    for delete to authenticated using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "saves are private to their owner" on public.saves
    for select to authenticated using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users can create their own saves" on public.saves
    for insert to authenticated with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users can delete their own saves" on public.saves
    for delete to authenticated using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "follows are publicly readable" on public.follows
    for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users can follow as themselves" on public.follows
    for insert to authenticated with check (auth.uid() = follower_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users can unfollow as themselves" on public.follows
    for delete to authenticated using (auth.uid() = follower_id);
exception when duplicate_object then null; end $$;

-- Keep denormalized post counters consistent with the interaction tables.
create or replace function public.sync_post_like_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set likes_count = likes_count + 1, updated_at = now() where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set likes_count = greatest(likes_count - 1, 0), updated_at = now() where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists likes_counter_trigger on public.likes;
create trigger likes_counter_trigger
after insert or delete on public.likes
for each row execute function public.sync_post_like_count();

create or replace function public.sync_post_comment_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comments_count = comments_count + 1, updated_at = now() where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set comments_count = greatest(comments_count - 1, 0), updated_at = now() where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists comments_counter_trigger on public.comments;
create trigger comments_counter_trigger
after insert or delete on public.comments
for each row execute function public.sync_post_comment_count();
