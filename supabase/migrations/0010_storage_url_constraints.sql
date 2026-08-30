-- Database-level defense in depth for media references.
-- API validation remains the primary application boundary.
create or replace function public.is_rednote_storage_url(value text, bucket text)
returns boolean
language plpgsql
immutable
strict
as $$
begin
  if value = '' then return true; end if;
  return value ~ ('^https://[^/]+/storage/v1/object/public/' || regexp_replace(bucket, '[^a-z0-9-]', '', 'gi') || '/[0-9a-fA-F-]+/.+');
end;
$$;

-- Use explicit bucket checks rather than trusting arbitrary external URLs.
alter table public.profiles drop constraint if exists profiles_avatar_url_storage_check;
alter table public.posts drop constraint if exists posts_image_url_storage_check;
alter table public.products drop constraint if exists products_image_url_storage_check;

alter table public.profiles add constraint profiles_avatar_url_storage_check
  check (avatar_url is null or avatar_url ~ '^https://[^/]+/storage/v1/object/public/avatars/');

alter table public.posts add constraint posts_image_url_storage_check
  check (image_url is null or image_url ~ '^https://[^/]+/storage/v1/object/public/post-media/');

alter table public.products add constraint products_image_url_storage_check
  check (image_url is null or image_url ~ '^https://[^/]+/storage/v1/object/public/product-media/');

-- These trigger helpers are implementation details, not public RPC endpoints.
revoke execute on function public.sync_post_like_count() from public, anon, authenticated;
revoke execute on function public.sync_post_comment_count() from public, anon, authenticated;
revoke execute on function public.notify_like() from public, anon, authenticated;
revoke execute on function public.notify_comment() from public, anon, authenticated;
revoke execute on function public.notify_follow() from public, anon, authenticated;
