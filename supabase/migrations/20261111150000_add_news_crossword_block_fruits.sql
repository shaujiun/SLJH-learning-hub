-- 由管理者為每個新聞縱橫填字阻隔格指定水果；學生端僅讀取發布結果。
alter table public.news_crossword_puzzles
  add column if not exists block_fruits jsonb not null default '{}'::jsonb;

alter table public.news_crossword_puzzles
  drop constraint if exists news_crossword_block_fruits_is_object;

alter table public.news_crossword_puzzles
  add constraint news_crossword_block_fruits_is_object
  check (jsonb_typeof(block_fruits) = 'object');
