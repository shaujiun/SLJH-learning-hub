-- CASE 可保證匿名使用者不會執行僅開放 authenticated 的管理權限函式。
drop policy if exists news_crossword_puzzles_public_read on public.news_crossword_puzzles;

create policy news_crossword_puzzles_public_read on public.news_crossword_puzzles
for select to anon, authenticated
using (
  case
    when status = 'published'
      and published_on <= (now() at time zone 'Asia/Taipei')::date
      then true
    when auth.uid() is null then false
    else public.can_manage_word_grid_puzzles()
  end
);
