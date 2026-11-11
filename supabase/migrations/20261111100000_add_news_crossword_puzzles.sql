-- 新聞縱橫填字：8 x 8 題目、橫直提示、管理者編題與公開作答。

create or replace function public.is_news_crossword_rows(rows text[])
returns boolean
language sql
immutable
set search_path = public
as $$
  select array_length(rows, 1) = 8
    and not exists (
      select 1
      from unnest(rows) row_text
      where char_length(row_text) <> 8
    );
$$;

revoke all on function public.is_news_crossword_rows(text[]) from public;

create table if not exists public.news_crossword_puzzles (
  id uuid primary key default gen_random_uuid(),
  published_on date not null unique,
  title text not null default '新聞縱橫填字',
  source_name text not null default '教師自建題庫',
  designer_name text not null default '',
  grid_rows text[] not null,
  solution_rows text[],
  across_clues jsonb not null default '[]'::jsonb,
  down_clues jsonb not null default '[]'::jsonb,
  block_style text not null default 'fruit' check (block_style in ('fruit', 'solid')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid references public.contact_book_profiles(id) on delete set null,
  updated_by uuid references public.contact_book_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_crossword_rows_are_8_by_8 check (public.is_news_crossword_rows(grid_rows)),
  constraint news_crossword_solution_is_8_by_8 check (
    solution_rows is null or public.is_news_crossword_rows(solution_rows)
  ),
  constraint news_crossword_across_clues_are_array check (jsonb_typeof(across_clues) = 'array'),
  constraint news_crossword_down_clues_are_array check (jsonb_typeof(down_clues) = 'array'),
  constraint news_crossword_published_has_solution check (status <> 'published' or solution_rows is not null)
);

create index if not exists news_crossword_puzzles_status_date_idx
  on public.news_crossword_puzzles(status, published_on desc);

alter table public.news_crossword_puzzles enable row level security;

drop policy if exists news_crossword_puzzles_public_read on public.news_crossword_puzzles;
create policy news_crossword_puzzles_public_read on public.news_crossword_puzzles
for select to anon, authenticated
using (status = 'published' or public.can_manage_word_grid_puzzles());

drop policy if exists news_crossword_puzzles_admin_write on public.news_crossword_puzzles;
create policy news_crossword_puzzles_admin_write on public.news_crossword_puzzles
for all to authenticated
using (public.can_manage_word_grid_puzzles())
with check (public.can_manage_word_grid_puzzles());

grant select on public.news_crossword_puzzles to anon, authenticated;
grant insert, update, delete on public.news_crossword_puzzles to authenticated;

