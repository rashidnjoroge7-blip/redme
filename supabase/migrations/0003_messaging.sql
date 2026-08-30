-- RedNote direct messaging foundation.
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create index if not exists conversation_participants_user_idx on public.conversation_participants(user_id);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at desc);

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

do $$ begin
  create policy "participants can read conversations" on public.conversations
    for select to authenticated using (
      exists (select 1 from public.conversation_participants cp where cp.conversation_id = id and cp.user_id = auth.uid())
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users can read their participation" on public.conversation_participants
    for select to authenticated using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "participants can read messages" on public.messages
    for select to authenticated using (
      exists (select 1 from public.conversation_participants cp where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid())
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "participants can send their own messages" on public.messages
    for insert to authenticated with check (
      sender_id = auth.uid() and
      exists (select 1 from public.conversation_participants cp where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid())
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "senders can edit their messages" on public.messages
    for update to authenticated using (sender_id = auth.uid()) with check (sender_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "senders can delete their messages" on public.messages
    for delete to authenticated using (sender_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
