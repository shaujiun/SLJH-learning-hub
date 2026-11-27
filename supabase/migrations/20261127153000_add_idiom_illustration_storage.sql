-- 成語填字圖教師自編圖片：公開讀取，僅管理者可上傳與維護。

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'idiom-word-grid-media',
  'idiom-word-grid-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists idiom_word_grid_media_public_read on storage.objects;
create policy idiom_word_grid_media_public_read on storage.objects
for select to anon, authenticated
using (bucket_id = 'idiom-word-grid-media');

drop policy if exists idiom_word_grid_media_manager_insert on storage.objects;
create policy idiom_word_grid_media_manager_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'idiom-word-grid-media' and public.can_manage_word_grid_puzzles());

drop policy if exists idiom_word_grid_media_manager_update on storage.objects;
create policy idiom_word_grid_media_manager_update on storage.objects
for update to authenticated
using (bucket_id = 'idiom-word-grid-media' and public.can_manage_word_grid_puzzles())
with check (bucket_id = 'idiom-word-grid-media' and public.can_manage_word_grid_puzzles());

drop policy if exists idiom_word_grid_media_manager_delete on storage.objects;
create policy idiom_word_grid_media_manager_delete on storage.objects
for delete to authenticated
using (bucket_id = 'idiom-word-grid-media' and public.can_manage_word_grid_puzzles());
