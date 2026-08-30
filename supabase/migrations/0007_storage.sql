-- Private-by-default media storage. Files are addressed as {user_id}/filename.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('post-media', 'post-media', true, 10485760, array['image/jpeg','image/png','image/webp']),
  ('product-media', 'product-media', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$ begin
  create policy "users upload own avatars" on storage.objects for insert to authenticated
    with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  create policy "users update own avatars" on storage.objects for update to authenticated
    using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
    with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  create policy "users delete own avatars" on storage.objects for delete to authenticated
    using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  create policy "users upload own post media" on storage.objects for insert to authenticated
    with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);
  create policy "users update own post media" on storage.objects for update to authenticated
    using (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text)
    with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);
  create policy "users delete own post media" on storage.objects for delete to authenticated
    using (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);
  create policy "users upload own product media" on storage.objects for insert to authenticated
    with check (bucket_id = 'product-media' and (storage.foldername(name))[1] = auth.uid()::text);
  create policy "users update own product media" on storage.objects for update to authenticated
    using (bucket_id = 'product-media' and (storage.foldername(name))[1] = auth.uid()::text)
    with check (bucket_id = 'product-media' and (storage.foldername(name))[1] = auth.uid()::text);
  create policy "users delete own product media" on storage.objects for delete to authenticated
    using (bucket_id = 'product-media' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;
