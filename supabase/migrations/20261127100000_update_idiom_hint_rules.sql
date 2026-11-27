-- 成語填字圖：完整成語提示，以及每位學生每關最多使用兩次提示。

alter table public.idiom_word_grid_hints
  drop constraint if exists idiom_word_grid_hints_hint_kind_check;

alter table public.idiom_word_grid_hints
  drop constraint if exists idiom_word_grid_hints_energy_cost_check;

-- 保留 check，避免既有提示紀錄因新版移除錯字檢查而違反限制。
alter table public.idiom_word_grid_hints
  add constraint idiom_word_grid_hints_hint_kind_check
  check (hint_kind in ('letter', 'cross', 'check', 'all_cross', 'idiom'));

alter table public.idiom_word_grid_hints
  add constraint idiom_word_grid_hints_energy_cost_check
  check (energy_cost in (1, 2, 5, 10));

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
  existing_hint_count integer;
  remaining_energy integer;
begin
  if p_hint_kind not in ('letter', 'cross', 'all_cross', 'idiom') then
    raise exception using errcode = '22023', message = 'invalid_idiom_hint_kind';
  end if;

  hint_cost := case
    when p_hint_kind = 'all_cross' then 10
    when p_hint_kind = 'idiom' then 5
    when p_hint_kind = 'cross' then 2
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

  -- 鎖定錢包列，讓不同裝置同時使用提示時仍能正確限制次數與扣點。
  perform 1
  from public.idiom_word_grid_wallets wallet
  where wallet.student_id = current_student_id
  for update;

  select count(*)::integer into existing_hint_count
  from public.idiom_word_grid_hints hint
  where hint.student_id = current_student_id
    and hint.puzzle_id = p_puzzle_id;

  if existing_hint_count >= 2 then
    raise exception using errcode = 'P0001', message = 'idiom_hint_limit_reached';
  end if;

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

  return jsonb_build_object(
    'energy', remaining_energy,
    'cost', hint_cost,
    'hintsUsed', existing_hint_count + 1
  );
end;
$$;

revoke all on function public.spend_idiom_word_grid_hint(uuid, text, text) from public;
grant execute on function public.spend_idiom_word_grid_hint(uuid, text, text) to authenticated;
