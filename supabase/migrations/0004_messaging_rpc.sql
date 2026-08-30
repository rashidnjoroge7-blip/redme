-- Securely create a two-person conversation without exposing participant insertion.
create or replace function public.create_direct_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  conversation_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if other_user_id is null or other_user_id = auth.uid() then
    raise exception 'invalid participant' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = other_user_id) then
    raise exception 'participant not found' using errcode = 'P0002';
  end if;

  insert into public.conversations default values returning id into conversation_id;
  insert into public.conversation_participants(conversation_id, user_id)
  values (conversation_id, auth.uid()), (conversation_id, other_user_id);
  return conversation_id;
end;
$$;

do $$ begin
  revoke all on function public.create_direct_conversation(uuid) from public;
  grant execute on function public.create_direct_conversation(uuid) to authenticated;
exception when undefined_function then null; end $$;
