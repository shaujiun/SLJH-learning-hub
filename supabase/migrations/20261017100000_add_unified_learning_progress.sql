-- 統一保存已登入學生完成一關或一回合後的紀錄。
-- 各遊戲既有的專用紀錄仍保留；本表提供跨科目摘要與查詢。

create table if not exists public.student_activity_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject_code text not null check (subject_code ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  activity_code text not null check (activity_code ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  activity_name text not null check (length(trim(activity_name)) between 1 and 120),
  mode_code text not null default 'default' check (mode_code ~ '^[a-z0-9][a-z0-9_-]{0,79}$'),
  source text not null default 'free_practice' check (source in ('free_practice', 'daily_task', 'class_assignment')),
  score numeric(5,2) check (score is null or score between 0 and 100),
  correct_count integer check (correct_count is null or correct_count >= 0),
  question_count integer check (question_count is null or question_count > 0),
  completed boolean not null default true,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  attempt_key text not null check (length(attempt_key) between 8 and 160),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (student_id, attempt_key)
);

create index if not exists student_activity_attempts_student_time_idx
  on public.student_activity_attempts(student_id, completed_at desc);
create index if not exists student_activity_attempts_subject_activity_idx
  on public.student_activity_attempts(subject_code, activity_code, completed_at desc);

create table if not exists public.student_activity_progress (
  student_id uuid not null references public.students(id) on delete cascade,
  subject_code text not null,
  activity_code text not null,
  activity_name text not null,
  mode_code text not null default 'default',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  completion_count integer not null default 0 check (completion_count >= 0),
  latest_score numeric(5,2) check (latest_score is null or latest_score between 0 and 100),
  best_score numeric(5,2) check (best_score is null or best_score between 0 and 100),
  total_correct integer not null default 0 check (total_correct >= 0),
  total_questions integer not null default 0 check (total_questions >= 0),
  first_attempted_at timestamptz not null default now(),
  last_attempted_at timestamptz not null default now(),
  last_completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (student_id, subject_code, activity_code, mode_code)
);

create index if not exists student_activity_progress_subject_idx
  on public.student_activity_progress(subject_code, activity_code, last_attempted_at desc);

alter table public.student_activity_attempts enable row level security;
alter table public.student_activity_progress enable row level security;

drop policy if exists student_activity_attempts_self_read on public.student_activity_attempts;
create policy student_activity_attempts_self_read on public.student_activity_attempts
  for select to authenticated using (
    public.is_active_learning_student() and exists (
      select 1 from public.students student
      where student.id = student_id and student.profile_id = auth.uid() and student.is_active
    )
  );

drop policy if exists student_activity_attempts_admin_read on public.student_activity_attempts;
create policy student_activity_attempts_admin_read on public.student_activity_attempts
  for select to authenticated using (
    exists (
      select 1 from public.contact_book_profiles profile
      where profile.id = auth.uid() and profile.user_type = 'admin'
        and profile.approval_status = 'approved' and profile.is_active
    )
  );

drop policy if exists student_activity_progress_self_read on public.student_activity_progress;
create policy student_activity_progress_self_read on public.student_activity_progress
  for select to authenticated using (
    public.is_active_learning_student() and exists (
      select 1 from public.students student
      where student.id = student_id and student.profile_id = auth.uid() and student.is_active
    )
  );

drop policy if exists student_activity_progress_admin_read on public.student_activity_progress;
create policy student_activity_progress_admin_read on public.student_activity_progress
  for select to authenticated using (
    exists (
      select 1 from public.contact_book_profiles profile
      where profile.id = auth.uid() and profile.user_type = 'admin'
        and profile.approval_status = 'approved' and profile.is_active
    )
  );

revoke all on public.student_activity_attempts, public.student_activity_progress from public, anon;
revoke insert, update, delete on public.student_activity_attempts, public.student_activity_progress from authenticated;
grant select on public.student_activity_attempts, public.student_activity_progress to authenticated;

create or replace function public.record_learning_activity_attempt(
  p_subject_code text,
  p_activity_code text,
  p_activity_name text,
  p_mode_code text default 'default',
  p_source text default 'free_practice',
  p_score numeric default null,
  p_correct_count integer default null,
  p_question_count integer default null,
  p_completed boolean default true,
  p_duration_seconds integer default null,
  p_attempt_key text default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  current_student_id uuid;
  inserted_attempt_id uuid;
  summary public.student_activity_progress%rowtype;
  normalized_subject text := lower(trim(coalesce(p_subject_code, '')));
  normalized_activity text := lower(trim(coalesce(p_activity_code, '')));
  normalized_mode text := lower(trim(coalesce(nullif(p_mode_code, ''), 'default')));
  normalized_name text := trim(coalesce(p_activity_name, ''));
  normalized_source text := lower(trim(coalesce(nullif(p_source, ''), 'free_practice')));
  normalized_key text := trim(coalesce(p_attempt_key, ''));
begin
  select student.id into current_student_id
  from public.students student
  join public.contact_book_profiles profile on profile.id = student.profile_id
  where student.profile_id = auth.uid() and student.is_active
    and profile.user_type = 'student'
    and profile.approval_status = 'approved'
    and profile.is_active
  limit 1;
  if current_student_id is null then raise exception 'student_required'; end if;

  if normalized_subject !~ '^[a-z0-9][a-z0-9_-]{0,63}$'
    or normalized_activity !~ '^[a-z0-9][a-z0-9_-]{0,63}$'
    or normalized_mode !~ '^[a-z0-9][a-z0-9_-]{0,79}$'
    or length(normalized_name) not between 1 and 120
    or normalized_source not in ('free_practice', 'daily_task', 'class_assignment')
    or p_score is not null and (p_score < 0 or p_score > 100)
    or p_correct_count is not null and p_correct_count < 0
    or p_question_count is not null and p_question_count <= 0
    or p_correct_count is not null and p_question_count is not null and p_correct_count > p_question_count
    or p_duration_seconds is not null and p_duration_seconds < 0
    or length(normalized_key) not between 8 and 160
    or jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object'
    or pg_column_size(coalesce(p_metadata, '{}'::jsonb)) > 8192 then
    raise exception 'invalid_learning_attempt';
  end if;

  insert into public.student_activity_attempts (
    student_id, subject_code, activity_code, activity_name, mode_code, source,
    score, correct_count, question_count, completed, duration_seconds,
    attempt_key, metadata
  ) values (
    current_student_id, normalized_subject, normalized_activity, normalized_name,
    normalized_mode, normalized_source, p_score, p_correct_count, p_question_count,
    coalesce(p_completed, true), p_duration_seconds, normalized_key,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (student_id, attempt_key) do nothing
  returning id into inserted_attempt_id;

  if inserted_attempt_id is not null then
    insert into public.student_activity_progress (
      student_id, subject_code, activity_code, activity_name, mode_code,
      attempt_count, completion_count, latest_score, best_score,
      total_correct, total_questions, last_completed_at
    ) values (
      current_student_id, normalized_subject, normalized_activity, normalized_name,
      normalized_mode, 1, case when coalesce(p_completed, true) then 1 else 0 end,
      p_score, p_score, coalesce(p_correct_count, 0), coalesce(p_question_count, 0),
      case when coalesce(p_completed, true) then now() else null end
    )
    on conflict (student_id, subject_code, activity_code, mode_code) do update set
      activity_name = excluded.activity_name,
      attempt_count = student_activity_progress.attempt_count + 1,
      completion_count = student_activity_progress.completion_count + excluded.completion_count,
      latest_score = coalesce(excluded.latest_score, student_activity_progress.latest_score),
      best_score = case
        when excluded.best_score is null then student_activity_progress.best_score
        when student_activity_progress.best_score is null then excluded.best_score
        else greatest(student_activity_progress.best_score, excluded.best_score)
      end,
      total_correct = student_activity_progress.total_correct + excluded.total_correct,
      total_questions = student_activity_progress.total_questions + excluded.total_questions,
      last_attempted_at = now(),
      last_completed_at = coalesce(excluded.last_completed_at, student_activity_progress.last_completed_at),
      updated_at = now();
  end if;

  select * into summary from public.student_activity_progress progress
  where progress.student_id = current_student_id
    and progress.subject_code = normalized_subject
    and progress.activity_code = normalized_activity
    and progress.mode_code = normalized_mode;

  return jsonb_build_object(
    'stored', inserted_attempt_id is not null,
    'duplicate', inserted_attempt_id is null,
    'attemptId', inserted_attempt_id,
    'attemptCount', summary.attempt_count,
    'completionCount', summary.completion_count,
    'latestScore', summary.latest_score,
    'bestScore', summary.best_score,
    'lastAttemptedAt', summary.last_attempted_at
  );
end;
$$;

revoke all on function public.record_learning_activity_attempt(
  text, text, text, text, text, numeric, integer, integer, boolean, integer, text, jsonb
) from public, anon;
grant execute on function public.record_learning_activity_attempt(
  text, text, text, text, text, numeric, integer, integer, boolean, integer, text, jsonb
) to authenticated;
