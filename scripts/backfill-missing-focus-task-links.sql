-- 一次性補登：2026-08-17 至 2026-08-20 間，已完成但遺失每日任務識別碼的靜態舒爾特紀錄。
-- 只有學生、台灣日期、遊戲模式及矩陣大小完全相符時才會配對。
with candidate_attempts as (
  select distinct on (task.id)
    task.id as task_id,
    attempt.id as attempt_id
  from public.student_focus_tasks task
  join public.schulte_attempts attempt
    on attempt.student_id = task.student_id
   and attempt.focus_task_id is null
   and attempt.mode = 'static'
   and (attempt.completed_at at time zone 'Asia/Taipei')::date = task.assigned_date
   and lower(task.activity_code_snapshot::text) = 'schulte_static_' || attempt.grid_size::text
  where task.status = 'pending'
    and lower(task.subject_code_snapshot::text) = 'focus_training'
    and task.assigned_date between date '2026-08-17' and date '2026-08-20'
  order by task.id, attempt.completed_at
)
update public.schulte_attempts attempt
set focus_task_id = candidate.task_id
from candidate_attempts candidate
where attempt.id = candidate.attempt_id
  and attempt.focus_task_id is null;

update public.student_focus_tasks task
set best_score = 100,
    status = 'completed',
    completed_at = coalesce(task.completed_at, attempt.completed_at),
    updated_at = now()
from public.schulte_attempts attempt
where attempt.focus_task_id = task.id
  and task.status = 'pending'
  and lower(task.subject_code_snapshot::text) = 'focus_training'
  and lower(task.activity_code_snapshot::text) = 'schulte_static_' || attempt.grid_size::text
  and task.assigned_date between date '2026-08-17' and date '2026-08-20';
