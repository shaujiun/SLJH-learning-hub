-- 成語填字圖以 UUID 識別題目；題名與發布日期是顯示資料，同一天可建立多題。

alter table public.idiom_word_grid_puzzles
  drop constraint if exists idiom_word_grid_title_date_unique;

create index if not exists idiom_word_grid_puzzles_title_date_idx
  on public.idiom_word_grid_puzzles(published_on desc, title);

comment on index public.idiom_word_grid_puzzles_title_date_idx is
  '供管理者依日期及題名查找題目，不限制同日同名題目。';
