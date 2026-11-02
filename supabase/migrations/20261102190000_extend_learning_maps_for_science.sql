-- 學習地圖擴充至自然科，並補上可依冊別、章別與節次篩選的欄位。

alter table public.learning_maps
  drop constraint if exists learning_maps_subject_code_check;

alter table public.learning_maps
  add constraint learning_maps_subject_code_check
  check (subject_code in ('science', 'history', 'geography', 'civics'));

alter table public.learning_maps
  add column if not exists volume_no smallint,
  add column if not exists section_no smallint;

update public.learning_maps
set volume_no = ((grade_level - 7) * 2 + semester)
where volume_no is null;

alter table public.learning_maps
  drop constraint if exists learning_maps_volume_no_check;

alter table public.learning_maps
  add constraint learning_maps_volume_no_check
  check (volume_no is null or volume_no between 1 and 6);

alter table public.learning_maps
  drop constraint if exists learning_maps_section_no_check;

alter table public.learning_maps
  add constraint learning_maps_section_no_check
  check (section_no is null or section_no between 1 and 30);

create index if not exists learning_maps_volume_section_order_idx
  on public.learning_maps(subject_code, volume_no, chapter_no, section_no, display_order);
