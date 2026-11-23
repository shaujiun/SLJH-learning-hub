-- 四說新語多人自由競賽：一般房最多 8 人，全班房最多 36 人。

alter table public.yizi_four_sayings_rooms
  add column if not exists player_limit smallint not null default 8,
  add column if not exists competition_mode text not null default 'points';

alter table public.yizi_four_sayings_rooms
  drop constraint if exists yizi_four_sayings_rooms_player_limit_check,
  drop constraint if exists yizi_four_sayings_rooms_competition_mode_check,
  drop constraint if exists yizi_four_sayings_rooms_winner_seat_check;

alter table public.yizi_four_sayings_rooms
  add constraint yizi_four_sayings_rooms_player_limit_check check (player_limit in (8, 36)),
  add constraint yizi_four_sayings_rooms_competition_mode_check
    check (competition_mode in ('points', 'eliminate_1', 'eliminate_2')),
  add constraint yizi_four_sayings_rooms_winner_seat_check
    check (winner_seat is null or winner_seat between 1 and 36);

alter table public.yizi_four_sayings_players
  add column if not exists failed_count smallint not null default 0,
  add column if not exists eliminated_at timestamptz;

alter table public.yizi_four_sayings_players
  drop constraint if exists yizi_four_sayings_players_seat_no_check,
  drop constraint if exists yizi_four_sayings_players_status_check,
  drop constraint if exists yizi_four_sayings_players_failed_count_check;

alter table public.yizi_four_sayings_players
  add constraint yizi_four_sayings_players_seat_no_check check (seat_no between 1 and 36),
  add constraint yizi_four_sayings_players_status_check
    check (status in ('connected', 'eliminated', 'left', 'forfeited')),
  add constraint yizi_four_sayings_players_failed_count_check check (failed_count between 0 and 10);

create or replace function public.yizi_four_sayings_elimination_limit(p_mode text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case p_mode when 'eliminate_1' then 1 when 'eliminate_2' then 2 else 0 end;
$$;

create or replace function public.yizi_four_sayings_mark_failure(p_room_id uuid, p_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_mode text;
  failure_limit integer;
begin
  select competition_mode into selected_mode from public.yizi_four_sayings_rooms where id = p_room_id;
  failure_limit := public.yizi_four_sayings_elimination_limit(selected_mode);
  update public.yizi_four_sayings_players set
    failed_count = failed_count + 1,
    status = case when failure_limit > 0 and failed_count + 1 >= failure_limit then 'eliminated' else status end,
    eliminated_at = case when failure_limit > 0 and failed_count + 1 >= failure_limit then now() else eliminated_at end
  where id = p_player_id and room_id = p_room_id and status = 'connected';
end;
$$;

create or replace function public.yizi_four_sayings_finish_room(
  p_room_id uuid,
  p_preferred_winner smallint default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  best_score integer;
  best_duration integer;
  best_count integer;
  winning_seat smallint;
begin
  if p_preferred_winner is not null then
    winning_seat := p_preferred_winner;
  else
    select max(score) into best_score
    from public.yizi_four_sayings_players
    where room_id = p_room_id and status not in ('left', 'forfeited');
    select min(total_duration_ms) into best_duration
    from public.yizi_four_sayings_players
    where room_id = p_room_id and status not in ('left', 'forfeited') and score = best_score;
    select count(*), min(seat_no) into best_count, winning_seat
    from public.yizi_four_sayings_players
    where room_id = p_room_id and status not in ('left', 'forfeited')
      and score = best_score and total_duration_ms = best_duration;
    if coalesce(best_count, 0) <> 1 then winning_seat := null; end if;
  end if;
  update public.yizi_four_sayings_rooms
  set status = 'finished', winner_seat = winning_seat, updated_at = now()
  where id = p_room_id and status = 'playing';
end;
$$;

create or replace function public.yizi_four_sayings_create_round_answers(p_room_id uuid, p_round_no integer)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.yizi_four_sayings_answers(room_id, player_id, round_no)
  select p_room_id, player.id, p_round_no
  from public.yizi_four_sayings_players player
  where player.room_id = p_room_id and player.status = 'connected'
  on conflict (room_id, player_id, round_no) do nothing;
$$;

create or replace function public.yizi_four_sayings_advance(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_room public.yizi_four_sayings_rooms;
  active_count integer;
  surviving_seat smallint;
begin
  select * into selected_room from public.yizi_four_sayings_rooms where id = p_room_id for update;
  if selected_room.id is null or selected_room.status <> 'playing' then return; end if;

  select count(*), min(seat_no) into active_count, surviving_seat
  from public.yizi_four_sayings_players
  where room_id = p_room_id and status = 'connected';
  if active_count <= 1 then
    perform public.yizi_four_sayings_finish_room(
      p_room_id,
      case when active_count = 1 then surviving_seat else null end
    );
    return;
  end if;

  if exists (
    select 1 from public.yizi_four_sayings_answers answer
    join public.yizi_four_sayings_players player on player.id = answer.player_id
    where answer.room_id = p_room_id and answer.round_no = selected_room.current_round
      and answer.status = 'active' and player.status = 'connected'
  ) then return; end if;

  if selected_room.current_round >= selected_room.question_count then
    perform public.yizi_four_sayings_finish_room(p_room_id);
    return;
  end if;

  update public.yizi_four_sayings_rooms set
    current_round = current_round + 1, round_started_at = now(), updated_at = now()
  where id = p_room_id returning * into selected_room;
  perform public.yizi_four_sayings_create_round_answers(p_room_id, selected_room.current_round);
end;
$$;

create or replace function public.yizi_four_sayings_expire_round(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_room public.yizi_four_sayings_rooms;
  answer_record record;
  elapsed_ms integer;
begin
  select * into selected_room from public.yizi_four_sayings_rooms where id = p_room_id for update;
  if selected_room.id is null or selected_room.status <> 'playing' then return; end if;

  if now() >= selected_room.round_started_at + make_interval(secs => selected_room.time_limit_seconds / 2.0) then
    update public.yizi_four_sayings_answers answer set hint_used = true, updated_at = now()
    from public.yizi_four_sayings_players player
    where answer.room_id = p_room_id and answer.round_no = selected_room.current_round
      and answer.status = 'active' and answer.player_id = player.id and player.status = 'connected';
  end if;
  if now() < selected_room.round_started_at + make_interval(secs => selected_room.time_limit_seconds) then return; end if;

  elapsed_ms := selected_room.time_limit_seconds * 1000;
  for answer_record in
    select answer.* from public.yizi_four_sayings_answers answer
    join public.yizi_four_sayings_players player on player.id = answer.player_id
    where answer.room_id = p_room_id and answer.round_no = selected_room.current_round
      and answer.status = 'active' and player.status = 'connected'
    for update of answer
  loop
    update public.yizi_four_sayings_answers
    set status = 'timed_out', duration_ms = elapsed_ms, updated_at = now()
    where id = answer_record.id;
    update public.yizi_four_sayings_players
    set total_duration_ms = total_duration_ms + elapsed_ms
    where id = answer_record.player_id;
    perform public.yizi_four_sayings_mark_failure(p_room_id, answer_record.player_id);
  end loop;
  perform public.yizi_four_sayings_advance(p_room_id);
end;
$$;

drop function if exists public.yizi_four_sayings_create_room(text,text,integer,integer);

create function public.yizi_four_sayings_create_room(
  p_nickname text,
  p_input_mode text,
  p_time_limit_seconds integer,
  p_question_count integer,
  p_player_limit integer,
  p_competition_mode text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_nickname text := trim(coalesce(p_nickname, ''));
  generated_code text;
  created_room public.yizi_four_sayings_rooms;
  created_player public.yizi_four_sayings_players;
  attempt_count integer := 0;
begin
  if char_length(normalized_nickname) < 1 or char_length(normalized_nickname) > 12 then
    raise exception using errcode = 'P0001', message = 'yizi_nickname_invalid';
  end if;
  if p_input_mode not in ('click', 'keyboard', 'handwriting') then
    raise exception using errcode = 'P0001', message = 'yizi_answer_mode_invalid';
  end if;
  if p_time_limit_seconds not in (40, 60) then
    raise exception using errcode = 'P0001', message = 'yizi_four_time_limit_invalid';
  end if;
  if p_question_count not in (5, 10) then
    raise exception using errcode = 'P0001', message = 'yizi_question_count_invalid';
  end if;
  if p_player_limit not in (8, 36) then
    raise exception using errcode = 'P0001', message = 'yizi_player_limit_invalid';
  end if;
  if p_competition_mode not in ('points', 'eliminate_1', 'eliminate_2') then
    raise exception using errcode = 'P0001', message = 'yizi_competition_mode_invalid';
  end if;
  loop
    attempt_count := attempt_count + 1;
    generated_code := lpad(floor(random() * 1000000)::integer::text, 6, '0');
    exit when not exists (
      select 1 from public.yizi_four_sayings_rooms room
      where room.room_code = generated_code and room.expires_at > now() and room.status <> 'closed'
    );
    if attempt_count >= 60 then raise exception using errcode = 'P0001', message = 'yizi_room_code_unavailable'; end if;
  end loop;

  insert into public.yizi_four_sayings_rooms(
    room_code, input_mode, time_limit_seconds, question_count, player_limit, competition_mode
  ) values (
    generated_code, p_input_mode, p_time_limit_seconds, p_question_count, p_player_limit, p_competition_mode
  ) returning * into created_room;
  insert into public.yizi_four_sayings_players(room_id, seat_no, nickname, student_id)
  values (created_room.id, 1, normalized_nickname, public.yizi_current_student_id())
  returning * into created_player;
  return jsonb_build_object('roomCode', created_room.room_code, 'seatToken', created_player.seat_token, 'seatNo', 1);
end;
$$;

create or replace function public.yizi_four_sayings_join_room(p_room_code text, p_nickname text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text := regexp_replace(coalesce(p_room_code, ''), '\D', '', 'g');
  normalized_nickname text := trim(coalesce(p_nickname, ''));
  selected_room public.yizi_four_sayings_rooms;
  created_player public.yizi_four_sayings_players;
  selected_seat smallint;
begin
  if char_length(normalized_nickname) < 1 or char_length(normalized_nickname) > 12 then
    raise exception using errcode = 'P0001', message = 'yizi_nickname_invalid';
  end if;
  select * into selected_room from public.yizi_four_sayings_rooms room
  where room.room_code = normalized_code and room.expires_at > now() and room.status = 'waiting' for update;
  if selected_room.id is null then raise exception using errcode = 'P0001', message = 'yizi_room_not_found'; end if;
  if (select count(*) from public.yizi_four_sayings_players
      where room_id = selected_room.id and status = 'connected') >= selected_room.player_limit then
    raise exception using errcode = 'P0001', message = 'yizi_room_full';
  end if;
  if exists (select 1 from public.yizi_four_sayings_players
      where room_id = selected_room.id and status = 'connected' and nickname = normalized_nickname) then
    raise exception using errcode = 'P0001', message = 'yizi_duplicate_nickname';
  end if;
  select seat into selected_seat from generate_series(2, selected_room.player_limit) seat
  where not exists (
    select 1 from public.yizi_four_sayings_players player
    where player.room_id = selected_room.id and player.seat_no = seat
  ) order by seat limit 1;
  if selected_seat is null then raise exception using errcode = 'P0001', message = 'yizi_room_full'; end if;
  insert into public.yizi_four_sayings_players(room_id, seat_no, nickname, student_id)
  values (selected_room.id, selected_seat, normalized_nickname, public.yizi_current_student_id())
  returning * into created_player;
  return jsonb_build_object('roomCode', selected_room.room_code, 'seatToken', created_player.seat_token, 'seatNo', selected_seat);
end;
$$;

create or replace function public.yizi_four_sayings_start_room(p_room_code text, p_seat_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_room public.yizi_four_sayings_rooms;
  selected_player public.yizi_four_sayings_players;
  chosen_ids uuid[];
  player_count integer;
begin
  select * into selected_room from public.yizi_four_sayings_rooms where room_code = p_room_code for update;
  if selected_room.id is null then raise exception using errcode = 'P0001', message = 'yizi_room_not_found'; end if;
  select * into selected_player from public.yizi_four_sayings_players
  where room_id = selected_room.id and seat_token = p_seat_token and status = 'connected';
  if selected_player.id is null then raise exception using errcode = 'P0001', message = 'yizi_seat_invalid'; end if;
  if selected_player.seat_no <> 1 then raise exception using errcode = 'P0001', message = 'yizi_host_required'; end if;
  if selected_room.status <> 'waiting' then raise exception using errcode = 'P0001', message = 'yizi_room_started'; end if;
  select count(*) into player_count from public.yizi_four_sayings_players
  where room_id = selected_room.id and status = 'connected';
  if player_count < 2 then raise exception using errcode = 'P0001', message = 'yizi_players_incomplete'; end if;
  select array_agg(candidate.id) into chosen_ids from (
    select id from public.yizi_questions
    where game_type = 'four_sayings' and status = 'published'
    order by random() limit selected_room.question_count
  ) candidate;
  if coalesce(cardinality(chosen_ids), 0) < selected_room.question_count then
    raise exception using errcode = 'P0001', message = 'yizi_questions_insufficient';
  end if;
  update public.yizi_four_sayings_rooms set
    status = 'playing', question_ids = chosen_ids, current_round = 1,
    round_started_at = now(), updated_at = now()
  where id = selected_room.id;
  perform public.yizi_four_sayings_create_round_answers(selected_room.id, 1);
  return public.yizi_four_sayings_room_snapshot(p_room_code, p_seat_token);
end;
$$;

create or replace function public.yizi_four_sayings_room_snapshot(p_room_code text, p_seat_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_room public.yizi_four_sayings_rooms;
  selected_player public.yizi_four_sayings_players;
  selected_question public.yizi_questions;
  selected_answer public.yizi_four_sayings_answers;
  hint_character text := '';
  last_round_no integer;
  last_question public.yizi_questions;
begin
  select * into selected_room from public.yizi_four_sayings_rooms
  where room_code = p_room_code and expires_at > now() and status <> 'closed';
  if selected_room.id is null then raise exception using errcode = 'P0001', message = 'yizi_room_not_found'; end if;
  select * into selected_player from public.yizi_four_sayings_players
  where room_id = selected_room.id and seat_token = p_seat_token;
  if selected_player.id is null then raise exception using errcode = 'P0001', message = 'yizi_seat_invalid'; end if;
  update public.yizi_four_sayings_players set last_seen_at = now()
  where id = selected_player.id and status = 'connected';

  if selected_room.status = 'playing' then
    update public.yizi_four_sayings_answers answer set status = 'gave_up', updated_at = now()
    from public.yizi_four_sayings_players player
    where player.room_id = selected_room.id and player.status = 'connected'
      and player.id <> selected_player.id and player.last_seen_at < now() - interval '180 seconds'
      and answer.room_id = selected_room.id and answer.player_id = player.id
      and answer.round_no = selected_room.current_round and answer.status = 'active';
    update public.yizi_four_sayings_players set status = 'forfeited'
    where room_id = selected_room.id and status = 'connected' and id <> selected_player.id
      and last_seen_at < now() - interval '180 seconds';
    perform public.yizi_four_sayings_advance(selected_room.id);
    perform public.yizi_four_sayings_expire_round(selected_room.id);
  end if;
  select * into selected_room from public.yizi_four_sayings_rooms where id = selected_room.id;

  if selected_room.status = 'playing' then
    select * into selected_question from public.yizi_questions
    where id = selected_room.question_ids[selected_room.current_round];
    select * into selected_answer from public.yizi_four_sayings_answers
    where room_id = selected_room.id and player_id = selected_player.id and round_no = selected_room.current_round;
    if selected_answer.hint_used then
      hint_character := substr(selected_question.answer_data -> 'accepted' ->> 0, 1, 1);
    end if;
  end if;
  last_round_no := case
    when selected_room.status = 'finished' and selected_room.current_round > 0 then selected_room.current_round
    when selected_room.current_round > 1 then selected_room.current_round - 1
    else null end;
  if last_round_no is not null then
    select * into last_question from public.yizi_questions where id = selected_room.question_ids[last_round_no];
  end if;

  return jsonb_build_object(
    'room', jsonb_build_object(
      'roomCode', selected_room.room_code, 'status', selected_room.status,
      'inputMode', selected_room.input_mode, 'timeLimitSeconds', selected_room.time_limit_seconds,
      'questionCount', selected_room.question_count, 'currentRound', selected_room.current_round,
      'roundStartedAt', selected_room.round_started_at, 'winnerSeat', selected_room.winner_seat,
      'playerLimit', selected_room.player_limit, 'competitionMode', selected_room.competition_mode
    ),
    'meSeat', selected_player.seat_no,
    'players', coalesce((select jsonb_agg(jsonb_build_object(
      'seatNo', player.seat_no, 'nickname', player.nickname, 'status', player.status,
      'score', player.score, 'failedCount', player.failed_count,
      'totalDurationMs', player.total_duration_ms,
      'correctCount', (select count(*) from public.yizi_four_sayings_answers answer
        where answer.player_id = player.id and answer.status = 'correct')
    ) order by player.score desc, player.total_duration_ms, player.seat_no)
      from public.yizi_four_sayings_players player where player.room_id = selected_room.id), '[]'::jsonb),
    'currentQuestion', case when selected_question.id is null then null else jsonb_build_object(
      'id', selected_question.id, 'stableKey', selected_question.stable_key,
      'difficulty', selected_question.difficulty, 'prompt', selected_question.prompt_data,
      'hintCharacter', hint_character
    ) end,
    'myRound', case when selected_answer.id is null then null else jsonb_build_object(
      'status', selected_answer.status, 'attemptCount', selected_answer.attempt_count,
      'hintUsed', selected_answer.hint_used, 'scoreAwarded', selected_answer.score_awarded
    ) end,
    'lastRound', case when last_question.id is null then null else jsonb_build_object(
      'roundNo', last_round_no, 'answer', last_question.answer_data -> 'accepted' ->> 0,
      'results', coalesce((select jsonb_agg(jsonb_build_object(
        'seatNo', player.seat_no, 'status', answer.status, 'scoreAwarded', answer.score_awarded
      ) order by player.seat_no) from public.yizi_four_sayings_answers answer
        join public.yizi_four_sayings_players player on player.id = answer.player_id
        where answer.room_id = selected_room.id and answer.round_no = last_round_no), '[]'::jsonb)
    ) end
  );
end;
$$;

create or replace function public.yizi_four_sayings_submit_answer(
  p_room_code text,
  p_seat_token uuid,
  p_answer text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_room public.yizi_four_sayings_rooms;
  selected_player public.yizi_four_sayings_players;
  selected_answer public.yizi_four_sayings_answers;
  question_id uuid;
  normalized_answer text := public.yizi_four_sayings_normalize(p_answer);
  is_correct boolean;
  elapsed_ms integer;
  awarded smallint;
begin
  select * into selected_room from public.yizi_four_sayings_rooms where room_code = p_room_code for update;
  select * into selected_player from public.yizi_four_sayings_players
  where room_id = selected_room.id and seat_token = p_seat_token;
  if selected_player.id is null then raise exception using errcode = 'P0001', message = 'yizi_seat_invalid'; end if;
  if selected_player.status = 'eliminated' then raise exception using errcode = 'P0001', message = 'yizi_player_eliminated'; end if;
  if selected_player.status <> 'connected' then raise exception using errcode = 'P0001', message = 'yizi_seat_invalid'; end if;
  if selected_room.status <> 'playing' then raise exception using errcode = 'P0001', message = 'yizi_room_not_playing'; end if;
  perform public.yizi_four_sayings_expire_round(selected_room.id);
  select * into selected_room from public.yizi_four_sayings_rooms where id = selected_room.id;
  if selected_room.status <> 'playing' then return public.yizi_four_sayings_room_snapshot(p_room_code, p_seat_token); end if;
  select * into selected_answer from public.yizi_four_sayings_answers
  where room_id = selected_room.id and player_id = selected_player.id and round_no = selected_room.current_round for update;
  if selected_answer.status <> 'active' then raise exception using errcode = 'P0001', message = 'yizi_round_answered'; end if;
  if char_length(normalized_answer) <> 4 then raise exception using errcode = 'P0001', message = 'yizi_four_answer_invalid'; end if;

  question_id := selected_room.question_ids[selected_room.current_round];
  is_correct := public.yizi_four_sayings_answer_is_correct(question_id, normalized_answer);
  if not is_correct and selected_answer.attempt_count < 1 then
    update public.yizi_four_sayings_answers set answer_text = normalized_answer,
      attempt_count = attempt_count + 1, updated_at = now() where id = selected_answer.id;
    return public.yizi_four_sayings_room_snapshot(p_room_code, p_seat_token);
  end if;

  elapsed_ms := least(selected_room.time_limit_seconds * 1000,
    greatest(0, floor(extract(epoch from (now() - selected_room.round_started_at)) * 1000)::integer));
  awarded := case when is_correct then case when selected_answer.hint_used then 1 else 2 end else 0 end;
  update public.yizi_four_sayings_answers set
    answer_text = normalized_answer, attempt_count = attempt_count + 1,
    status = case when is_correct then 'correct' else 'failed' end,
    score_awarded = awarded, duration_ms = elapsed_ms, updated_at = now()
  where id = selected_answer.id;
  update public.yizi_four_sayings_players set score = score + awarded,
    total_duration_ms = total_duration_ms + elapsed_ms, last_seen_at = now()
  where id = selected_player.id;
  if not is_correct then perform public.yizi_four_sayings_mark_failure(selected_room.id, selected_player.id); end if;
  perform public.yizi_four_sayings_advance(selected_room.id);
  return public.yizi_four_sayings_room_snapshot(p_room_code, p_seat_token);
end;
$$;

create or replace function public.yizi_four_sayings_give_up(p_room_code text, p_seat_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_room public.yizi_four_sayings_rooms;
  selected_player public.yizi_four_sayings_players;
  selected_answer public.yizi_four_sayings_answers;
  elapsed_ms integer;
begin
  select * into selected_room from public.yizi_four_sayings_rooms where room_code = p_room_code for update;
  select * into selected_player from public.yizi_four_sayings_players
  where room_id = selected_room.id and seat_token = p_seat_token and status = 'connected';
  if selected_player.id is null then raise exception using errcode = 'P0001', message = 'yizi_seat_invalid'; end if;
  select * into selected_answer from public.yizi_four_sayings_answers
  where room_id = selected_room.id and player_id = selected_player.id and round_no = selected_room.current_round for update;
  if selected_room.status <> 'playing' or selected_answer.status <> 'active' then
    raise exception using errcode = 'P0001', message = 'yizi_round_answered';
  end if;
  elapsed_ms := least(selected_room.time_limit_seconds * 1000,
    greatest(0, floor(extract(epoch from (now() - selected_room.round_started_at)) * 1000)::integer));
  update public.yizi_four_sayings_answers set status = 'gave_up', duration_ms = elapsed_ms, updated_at = now()
  where id = selected_answer.id;
  update public.yizi_four_sayings_players
  set total_duration_ms = total_duration_ms + elapsed_ms, last_seen_at = now()
  where id = selected_player.id;
  perform public.yizi_four_sayings_mark_failure(selected_room.id, selected_player.id);
  perform public.yizi_four_sayings_advance(selected_room.id);
  return public.yizi_four_sayings_room_snapshot(p_room_code, p_seat_token);
end;
$$;

create or replace function public.yizi_four_sayings_leave_room(p_room_code text, p_seat_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_room public.yizi_four_sayings_rooms;
  selected_player public.yizi_four_sayings_players;
begin
  select * into selected_room from public.yizi_four_sayings_rooms where room_code = p_room_code for update;
  if selected_room.id is null then return jsonb_build_object('closed', true); end if;
  select * into selected_player from public.yizi_four_sayings_players
  where room_id = selected_room.id and seat_token = p_seat_token;
  if selected_player.id is null then raise exception using errcode = 'P0001', message = 'yizi_seat_invalid'; end if;

  if selected_room.status = 'waiting' then
    if selected_player.seat_no = 1 then
      update public.yizi_four_sayings_rooms set status = 'closed', updated_at = now() where id = selected_room.id;
    else
      delete from public.yizi_four_sayings_players where id = selected_player.id;
    end if;
  elsif selected_room.status = 'playing' and selected_player.status = 'connected' then
    update public.yizi_four_sayings_answers set status = 'gave_up', updated_at = now()
    where room_id = selected_room.id and player_id = selected_player.id
      and round_no = selected_room.current_round and status = 'active';
    update public.yizi_four_sayings_players set status = 'forfeited', last_seen_at = now()
    where id = selected_player.id;
    perform public.yizi_four_sayings_advance(selected_room.id);
  end if;
  return jsonb_build_object('closed', true);
end;
$$;

revoke all on function public.yizi_four_sayings_elimination_limit(text) from public;
revoke all on function public.yizi_four_sayings_mark_failure(uuid,uuid) from public;
revoke all on function public.yizi_four_sayings_finish_room(uuid,smallint) from public;
revoke all on function public.yizi_four_sayings_create_room(text,text,integer,integer,integer,text) from public;

grant execute on function public.yizi_four_sayings_create_room(text,text,integer,integer,integer,text) to anon, authenticated;

comment on table public.yizi_four_sayings_rooms is
  '四說新語多人自由競賽房間；一般房最多 8 人，全班房最多 36 人，可採積分或淘汰制。';
