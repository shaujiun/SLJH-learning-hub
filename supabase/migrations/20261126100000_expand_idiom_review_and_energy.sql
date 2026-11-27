-- 成語填字圖：不限能量上限、進階全交錯提示與學生複習清單。

alter table public.idiom_word_grid_wallets
  drop constraint if exists idiom_word_grid_wallets_energy_check;

alter table public.idiom_word_grid_wallets
  alter column energy type integer using energy::integer;

alter table public.idiom_word_grid_wallets
  add constraint idiom_word_grid_wallets_energy_nonnegative check (energy >= 0);

alter table public.idiom_word_grid_hints
  drop constraint if exists idiom_word_grid_hints_hint_kind_check;

alter table public.idiom_word_grid_hints
  drop constraint if exists idiom_word_grid_hints_energy_cost_check;

alter table public.idiom_word_grid_hints
  add constraint idiom_word_grid_hints_hint_kind_check
  check (hint_kind in ('letter', 'cross', 'check', 'all_cross'));

alter table public.idiom_word_grid_hints
  add constraint idiom_word_grid_hints_energy_cost_check
  check (energy_cost in (1, 2, 10));

create table if not exists public.idiom_word_grid_reviews (
  student_id uuid not null references public.students(id) on delete cascade,
  idiom_entry_id uuid not null references public.idiom_entries(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (student_id, idiom_entry_id)
);

create index if not exists idiom_word_grid_reviews_student_created_idx
  on public.idiom_word_grid_reviews(student_id, created_at desc);

alter table public.idiom_word_grid_reviews enable row level security;

drop policy if exists idiom_review_self_read on public.idiom_word_grid_reviews;
create policy idiom_review_self_read on public.idiom_word_grid_reviews
for select to authenticated
using (exists (
  select 1 from public.students student
  where student.id = idiom_word_grid_reviews.student_id
    and student.profile_id = auth.uid()
    and student.is_active
));

drop policy if exists idiom_review_self_insert on public.idiom_word_grid_reviews;
create policy idiom_review_self_insert on public.idiom_word_grid_reviews
for insert to authenticated
with check (exists (
  select 1 from public.students student
  where student.id = idiom_word_grid_reviews.student_id
    and student.profile_id = auth.uid()
    and student.is_active
));

drop policy if exists idiom_review_self_update on public.idiom_word_grid_reviews;
create policy idiom_review_self_update on public.idiom_word_grid_reviews
for update to authenticated
using (exists (
  select 1 from public.students student
  where student.id = idiom_word_grid_reviews.student_id
    and student.profile_id = auth.uid()
    and student.is_active
))
with check (exists (
  select 1 from public.students student
  where student.id = idiom_word_grid_reviews.student_id
    and student.profile_id = auth.uid()
    and student.is_active
));

drop policy if exists idiom_review_self_delete on public.idiom_word_grid_reviews;
create policy idiom_review_self_delete on public.idiom_word_grid_reviews
for delete to authenticated
using (exists (
  select 1 from public.students student
  where student.id = idiom_word_grid_reviews.student_id
    and student.profile_id = auth.uid()
    and student.is_active
));

grant select, insert, update, delete on public.idiom_word_grid_reviews to authenticated;

create or replace function public.spend_idiom_word_grid_hint(
  p_puzzle_id uuid,
  p_hint_kind text,
  p_cell_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_student_id uuid;
  hint_cost integer;
  remaining_energy integer;
begin
  if p_hint_kind not in ('letter', 'cross', 'check', 'all_cross') then
    raise exception using errcode = '22023', message = 'invalid_idiom_hint_kind';
  end if;
  hint_cost := case
    when p_hint_kind = 'all_cross' then 10
    when p_hint_kind in ('cross', 'check') then 2
    else 1
  end;

  select student.id into current_student_id
  from public.students student
  where student.profile_id = auth.uid() and student.is_active
  limit 1;
  if current_student_id is null then
    raise exception using errcode = 'P0001', message = 'student_required';
  end if;
  if not exists (
    select 1 from public.idiom_word_grid_puzzles puzzle
    where puzzle.id = p_puzzle_id and puzzle.status = 'published'
  ) then
    raise exception using errcode = 'P0001', message = 'idiom_puzzle_not_found';
  end if;

  insert into public.idiom_word_grid_wallets(student_id, energy)
  values (current_student_id, 0)
  on conflict (student_id) do nothing;

  update public.idiom_word_grid_wallets wallet
  set energy = wallet.energy - hint_cost,
      updated_at = now()
  where wallet.student_id = current_student_id
    and wallet.energy >= hint_cost
  returning wallet.energy into remaining_energy;

  if remaining_energy is null then
    raise exception using errcode = 'P0001', message = 'idiom_energy_insufficient';
  end if;

  insert into public.idiom_word_grid_hints(student_id, puzzle_id, hint_kind, cell_key, energy_cost)
  values (current_student_id, p_puzzle_id, p_hint_kind, p_cell_key, hint_cost);

  return jsonb_build_object('energy', remaining_energy, 'cost', hint_cost);
end;
$$;

create or replace function public.complete_idiom_word_grid(
  p_puzzle_id uuid,
  p_hints_used integer default 0,
  p_focus_task_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_student_id uuid;
  inserted_completion uuid;
  actual_hints_used integer := 0;
  earned smallint := 0;
  current_energy integer;
begin
  if p_hints_used < 0 then
    raise exception using errcode = '22023', message = 'invalid_hints_used';
  end if;
  select student.id into current_student_id
  from public.students student
  where student.profile_id = auth.uid() and student.is_active
  limit 1;
  if current_student_id is null then
    raise exception using errcode = 'P0001', message = 'student_required';
  end if;
  if not exists (
    select 1 from public.idiom_word_grid_puzzles puzzle
    where puzzle.id = p_puzzle_id and puzzle.status = 'published'
  ) then
    raise exception using errcode = 'P0001', message = 'idiom_puzzle_not_found';
  end if;

  select count(*)::integer into actual_hints_used
  from public.idiom_word_grid_hints hint
  where hint.student_id = current_student_id and hint.puzzle_id = p_puzzle_id;

  insert into public.idiom_word_grid_completions(student_id, puzzle_id, hints_used, energy_earned)
  values (current_student_id, p_puzzle_id, least(actual_hints_used, 32767), case when actual_hints_used = 0 then 4 else 3 end)
  on conflict (student_id, puzzle_id) do nothing
  returning id into inserted_completion;

  if inserted_completion is not null then
    earned := case when actual_hints_used = 0 then 4 else 3 end;
  end if;

  insert into public.idiom_word_grid_wallets(student_id, energy, updated_at)
  values (current_student_id, earned, now())
  on conflict (student_id) do update
  set energy = public.idiom_word_grid_wallets.energy + earned,
      updated_at = now()
  returning energy into current_energy;

  if p_focus_task_id is not null then
    if not exists (
      select 1
      from public.student_focus_tasks task
      where task.id = p_focus_task_id
        and task.student_id = current_student_id
        and lower(task.subject_code_snapshot::text) = 'chinese'
        and lower(task.activity_code_snapshot::text) = 'idiom_word_grid'
    ) then
      raise exception using errcode = 'P0001', message = 'idiom_focus_task_invalid';
    end if;
    perform public.record_focus_task_attempt(p_focus_task_id, 100, 1, 1);
  end if;

  return jsonb_build_object(
    'energy', current_energy,
    'energyEarned', earned,
    'firstCompletion', inserted_completion is not null
  );
end;
$$;

revoke all on function public.spend_idiom_word_grid_hint(uuid, text, text) from public;
revoke all on function public.complete_idiom_word_grid(uuid, integer, uuid) from public;
grant execute on function public.spend_idiom_word_grid_hint(uuid, text, text) to authenticated;
grant execute on function public.complete_idiom_word_grid(uuid, integer, uuid) to authenticated;
