-- 成語填字圖：保存教育部《成語典》條目編號與音讀資料，供搜尋帶入及發音核對。
alter table public.idiom_entries
  add column if not exists source_entry_id bigint,
  add column if not exists zhuyin text not null default '',
  add column if not exists pinyin text not null default '';

create unique index if not exists idiom_entries_source_entry_id_uidx
  on public.idiom_entries (source_entry_id)
  where source_entry_id is not null;

comment on column public.idiom_entries.source_entry_id is '教育部《成語典》正文條目編號；官方欄位不得改寫。';
comment on column public.idiom_entries.zhuyin is '教育部《成語典》注音原文。';
comment on column public.idiom_entries.pinyin is '教育部《成語典》漢語拼音原文。';
