-- RedNote notifications and Realtime foundation.
-- Review existing production tables before applying.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('like', 'comment', 'follow', 'system')),
  post_id uuid references public.posts(id) on delete cascade,
  message text not null check (char_length(trim(message)) between 1 and 500),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_at_idx
  on public.notifications (recipient_id, created_at desc);

create index if not exists notifications_unread_idx
  on public.notifications (recipient_id, read_at)
  where read_at is null;

alter table public.notifications enable row level security;

do $$ begin
  create policy "users can read their notifications" on public.notifications
    for select to authenticated using (auth.uid() = recipient_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users can mark their notifications read" on public.notifications
    for update to authenticated
    using (auth.uid() = recipient_id)
    with check (auth.uid() = recipient_id);
exception when duplicate_object then null; end $$;

-- Notification creation is performed by trusted database functions/triggers,
-- not by allowing clients to impersonate actors or recipients.

create or replace function public.notify_like()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id from public.posts where id = new.post_id;
  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications(recipient_id, actor_id, type, post_id, message)
    values (owner_id, new.user_id, 'like', new.post_id, 'Someone liked your post.');
  end if;
  return new;
end;
$$;

drop trigger if exists likes_notification_trigger on public.likes;
create trigger likes_notification_trigger
after insert on public.likes
for each row execute function public.notify_like();

create or replace function public.notify_comment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id from public.posts where id = new.post_id;
  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications(recipient_id, actor_id, type, post_id, message)
    values (owner_id, new.user_id, 'comment', new.post_id, 'Someone commented on your post.');
  end if;
  return new;
end;
$$;

drop trigger if exists comments_notification_trigger on public.comments;
create trigger comments_notification_trigger
after insert on public.comments
for each row execute function public.notify_comment();

create or replace function public.notify_follow()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.follower_id <> new.following_id then
    insert into public.notifications(recipient_id, actor_id, type, message)
    values (new.following_id, new.follower_id, 'follow', 'Someone followed you.');
  end if;
  return new;
end;
$$;

drop trigger if exists follows_notification_trigger on public.follows;
create trigger follows_notification_trigger
after insert on public.follows
for each row execute function public.notify_follow();

-- Supabase Realtime can publish changes from this table once it is enabled in
-- the project's publication. Keep this statement safe for repeated migration.
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;
