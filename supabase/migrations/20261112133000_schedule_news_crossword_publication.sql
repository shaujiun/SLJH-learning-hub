-- 已按下發布但題目日期尚未到達時，僅管理者可預覽；學生與訪客須等臺灣日期到達。
drop policy if exists news_crossword_puzzles_public_read on public.news_crossword_puzzles;

create policy news_crossword_puzzles_public_read on public.news_crossword_puzzles
for select to anon, authenticated
using (
  public.can_manage_word_grid_puzzles()
  or (
    status = 'published'
    and published_on <= (now() at time zone 'Asia/Taipei')::date
  )
);
