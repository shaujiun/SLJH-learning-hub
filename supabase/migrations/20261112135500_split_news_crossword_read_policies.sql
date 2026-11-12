-- 公開題目與管理者預覽拆成兩條政策，避免 anon 執行管理者專用函式。
drop policy if exists news_crossword_puzzles_public_read on public.news_crossword_puzzles;
drop policy if exists news_crossword_puzzles_scheduled_read on public.news_crossword_puzzles;
drop policy if exists news_crossword_puzzles_admin_read on public.news_crossword_puzzles;

create policy news_crossword_puzzles_scheduled_read on public.news_crossword_puzzles
for select to anon, authenticated
using (
  status = 'published'
  and published_on <= (now() at time zone 'Asia/Taipei')::date
);

create policy news_crossword_puzzles_admin_read on public.news_crossword_puzzles
for select to authenticated
using (public.can_manage_word_grid_puzzles());
