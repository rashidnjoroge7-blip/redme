-- RedNote notifications and Realtime foundation.
-- Compatibility migration for an existing notifications table.
-- Preserves the legacy user_id/title/is_read columns.

do $$
begin
  -- Add the new notification model columns when they do not exist.
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notifications'
      and column_name = 'recipient_id'
  ) then
    alter table public.notifications
      add column recipient_id uuid references public.profiles(id) on delete cascade;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notifications'
      and column_name = 'actor_id'
  ) then
    alter table public.notifications
      add column actor_id uuid references public.profiles(id) on delete set null;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notifications'
      and column_name = 'post_id'
  ) then
    alter table public.notifications
      add column post_id uuid references public.posts(id) on delete cascade;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notifications'
      and column_name = 'read_at'
  ) then
    alter table public.notifications
      add column read_at timestamptz;
  end if;
end $$;

-- Migrate existing notification ownership/read state.
update public.notifications
set recipient_id = user_id
where recipient_id is null
  and user_id is not null;

update public.notifications
set read_at = case
  when is_read = true then coalesce(read_at, created_at)
  else null
end
where read_at is null;

create index if not exists notifications_recipient_created_at_idx
  on public.notifications (recipient_id, created_at desc);

create index if not exists notifications_unread_idx
  on public.notifications (recipient_id, read_at)
  where read_at is null;

alter table public.notifications enable row level security;

do $$
begin
  create policy "users can read their notifications"
    on public.notifications
    for select
    to authenticated
    using (auth.uid() = coalesce(recipient_id, user_id));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "users can mark their notifications read"
    on public.notifications
    for update
    to authenticated
    using (auth.uid() = coalesce(recipient_id, user_id))
    with check (auth.uid() = coalesce(recipient_id, user_id));
exception
  when duplicate_object then null;
end $$;

-- Notification creation is performed by trusted database functions/triggers.

create or replace function public.notify_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id
  from public.posts
  where id = new.post_id;

  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications (
      recipient_id,
      user_id,
      actor_id,
      type,
      title,
      post_id,
      message
    )
    values (
      owner_id,
      owner_id,
      new.user_id,
      'like',
      'New like',
      new.post_id,
      'Someone liked your post.'
    );
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
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id
  from public.posts
  where id = new.post_id;

  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications (
      recipient_id,
      user_id,
      actor_id,
      type,
      title,
      post_id,
      message
    )
    values (
      owner_id,
      owner_id,
      new.user_id,
      'comment',
      'New comment',
      new.post_id,
      'Someone commented on your post.'
    );
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
security definer
set search_path = public
as $$
begin
  if new.follower_id <> new.following_id then
    insert into public.notifications (
      recipient_id,
      user_id,
      actor_id,
      type,
      title,
      message
    )
    values (
      new.following_id,
      new.following_id,
      new.follower_id,
      'follow',
      'New follower',
      'Someone followed you.'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists follows_notification_trigger on public.follows;

create trigger follows_notification_trigger
after insert on public.follows
for each row execute function public.notify_follow();

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end $$;
