-- 國文系統本身已指向成語填字圖，活動不可再附加相同查詢字串。
-- 否則每日任務網址會重複串接查詢參數，實際開啟報紙填字圖。

update public.learning_systems
set launch_url = 'https://shaujiun.github.io/SLJH-learning-hub/?puzzle=word-grid&mode=idiom',
    updated_at = now()
where lower(subject_code::text) = 'chinese';

update public.learning_activities activity
set launch_path = '',
    updated_at = now()
from public.learning_systems system
where activity.learning_system_id = system.id
  and lower(system.subject_code::text) = 'chinese'
  and lower(activity.activity_code::text) = 'idiom_word_grid';

update public.student_focus_tasks
set launch_url_snapshot = 'https://shaujiun.github.io/SLJH-learning-hub/?puzzle=word-grid&mode=idiom',
    updated_at = now()
where lower(subject_code_snapshot::text) = 'chinese'
  and lower(activity_code_snapshot::text) = 'idiom_word_grid'
  and status in ('pending', 'expired');
