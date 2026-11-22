-- 隻字片語：匿名／登入皆可使用的雙人房間。

create or replace function public.yizi_board_can_place(
  p_board jsonb,
  p_phrase text,
  p_start_row integer,
  p_start_column integer,
  p_direction text
)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  delta_row integer;
  delta_column integer;
  item_index integer;
  target_row integer;
  target_column integer;
  target_key text;
  existing_character text;
  next_character text;
  intersection_found boolean := false;
  new_character_found boolean := false;
begin
  select
    case p_direction when 'D' then 1 when 'U' then -1 when 'DR' then 1 when 'UL' then -1 when 'DL' then 1 when 'UR' then -1 else 0 end,
    case p_direction when 'R' then 1 when 'L' then -1 when 'DR' then 1 when 'UL' then -1 when 'DL' then -1 when 'UR' then 1 else 0 end
  into delta_row, delta_column;
  if p_direction not in ('R', 'L', 'D', 'U', 'DR', 'UL', 'DL', 'UR') or char_length(p_phrase) <> 4 then
    return false;
  end if;

  for item_index in 0..3 loop
    target_row := p_start_row + delta_row * item_index;
    target_column := p_start_column + delta_column * item_index;
    if target_row < 0 or target_row > 7 or target_column < 0 or target_column > 11 then return false; end if;
    target_key := target_row::text || ':' || target_column::text;
    existing_character := p_board ->> target_key;
    next_character := substr(p_phrase, item_index + 1, 1);
    if existing_character is null then
      new_character_found := true;
    elsif existing_character = next_character then
      intersection_found := true;
    else
      return false;
    end if;
  end loop;
  return intersection_found and new_character_found;
end;
$$;

create or replace function public.yizi_current_student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select student.id
  from public.students student
  join public.contact_book_profiles profile on profile.id = student.profile_id
  where student.profile_id = auth.uid()
    and student.is_active = true
    and profile.user_type = 'student'
    and profile.approval_status = 'approved'
    and profile.is_active = true
  limit 1;
$$;

create or replace function public.yizi_create_room(p_nickname text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_nickname text := trim(coalesce(p_nickname, ''));
  generated_code text;
  created_room public.yizi_rooms;
  created_player public.yizi_room_players;
  attempt_count integer := 0;
begin
  if char_length(normalized_nickname) < 1 or char_length(normalized_nickname) > 12 then
    raise exception using errcode = 'P0001', message = 'yizi_nickname_invalid';
  end if;
  loop
    attempt_count := attempt_count + 1;
    generated_code := lpad(floor(random() * 1000000)::integer::text, 6, '0');
    exit when not exists (
      select 1 from public.yizi_rooms room
      where room.room_code = generated_code and room.expires_at > now() and room.status <> 'closed'
    );
    if attempt_count >= 60 then raise exception using errcode = 'P0001', message = 'yizi_room_code_unavailable'; end if;
  end loop;

  insert into public.yizi_rooms(room_code) values (generated_code) returning * into created_room;
  insert into public.yizi_room_players(room_id, seat_no, nickname, student_id)
  values (created_room.id, 1, normalized_nickname, public.yizi_current_student_id())
  returning * into created_player;

  return jsonb_build_object('roomCode', created_room.room_code, 'seatToken', created_player.seat_token, 'seatNo', 1);
end;
$$;

create or replace function public.yizi_join_room(p_room_code text, p_nickname text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text := regexp_replace(coalesce(p_room_code, ''), '\D', '', 'g');
  normalized_nickname text := trim(coalesce(p_nickname, ''));
  selected_room public.yizi_rooms;
  created_player public.yizi_room_players;
begin
  if char_length(normalized_nickname) < 1 or char_length(normalized_nickname) > 12 then
    raise exception using errcode = 'P0001', message = 'yizi_nickname_invalid';
  end if;
  select * into selected_room from public.yizi_rooms room
  where room.room_code = normalized_code and room.expires_at > now() and room.status <> 'closed'
  for update;
  if selected_room.id is null then raise exception using errcode = 'P0001', message = 'yizi_room_not_found'; end if;
  if selected_room.status <> 'waiting' then raise exception using errcode = 'P0001', message = 'yizi_room_started'; end if;
  if exists (select 1 from public.yizi_room_players player where player.room_id = selected_room.id and player.status = 'connected' and player.seat_no = 2) then
    raise exception using errcode = 'P0001', message = 'yizi_room_full';
  end if;
  if exists (select 1 from public.yizi_room_players player where player.room_id = selected_room.id and player.nickname = normalized_nickname) then
    raise exception using errcode = 'P0001', message = 'yizi_duplicate_nickname';
  end if;

  insert into public.yizi_room_players(room_id, seat_no, nickname, student_id)
  values (selected_room.id, 2, normalized_nickname, public.yizi_current_student_id())
  returning * into created_player;
  return jsonb_build_object('roomCode', selected_room.room_code, 'seatToken', created_player.seat_token, 'seatNo', 2);
end;
$$;

create or replace function public.yizi_start_room(
  p_room_code text,
  p_seat_token uuid,
  p_time_limit_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_room public.yizi_rooms;
  selected_player public.yizi_room_players;
  chosen_phrase text;
  chosen_character text;
begin
  select room.* into selected_room from public.yizi_rooms room where room.room_code = p_room_code for update;
  if selected_room.id is null then raise exception using errcode = 'P0001', message = 'yizi_room_not_found'; end if;
  select player.* into selected_player from public.yizi_room_players player
  where player.room_id = selected_room.id and player.seat_token = p_seat_token and player.status = 'connected';
  if selected_player.id is null then raise exception using errcode = 'P0001', message = 'yizi_seat_invalid'; end if;
  if selected_player.seat_no <> 1 then raise exception using errcode = 'P0001', message = 'yizi_host_required'; end if;
  if selected_room.status <> 'waiting' then raise exception using errcode = 'P0001', message = 'yizi_room_started'; end if;
  if (select count(*) from public.yizi_room_players player where player.room_id = selected_room.id and player.status = 'connected') <> 2 then
    raise exception using errcode = 'P0001', message = 'yizi_players_incomplete';
  end if;
  if p_time_limit_seconds not in (60, 90, 120) then raise exception using errcode = 'P0001', message = 'yizi_time_limit_invalid'; end if;

  select phrase into chosen_phrase from public.yizi_idiom_lexicon
  where is_common = true and common_rank between 1 and 800 order by random() limit 1;
  chosen_character := substr(coalesce(chosen_phrase, '一心一意'), 1 + floor(random() * 4)::integer, 1);
  update public.yizi_rooms set
    status = 'playing', time_limit_seconds = p_time_limit_seconds,
    seed_char = chosen_character, board = jsonb_build_object('4:6', chosen_character),
    used_idioms = '{}'::text[], current_seat = 1, winner_seat = null,
    turn_started_at = now(), updated_at = now()
  where id = selected_room.id;
  return public.yizi_room_snapshot(p_room_code, p_seat_token);
end;
$$;

create or replace function public.yizi_room_snapshot(p_room_code text, p_seat_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_room public.yizi_rooms;
  selected_player public.yizi_room_players;
  opponent_player public.yizi_room_players;
begin
  select room.* into selected_room from public.yizi_rooms room
  where room.room_code = p_room_code and room.expires_at > now() and room.status <> 'closed'
  for update;
  if selected_room.id is null then raise exception using errcode = 'P0001', message = 'yizi_room_not_found'; end if;
  select player.* into selected_player from public.yizi_room_players player
  where player.room_id = selected_room.id and player.seat_token = p_seat_token;
  if selected_player.id is null then raise exception using errcode = 'P0001', message = 'yizi_seat_invalid'; end if;
  update public.yizi_room_players set last_seen_at = now() where id = selected_player.id and status = 'connected';

  if selected_room.status = 'playing' and selected_room.turn_started_at + make_interval(secs => selected_room.time_limit_seconds) < now() then
    update public.yizi_room_players set status = 'forfeited'
    where room_id = selected_room.id and seat_no = selected_room.current_seat and status = 'connected';
    update public.yizi_rooms set status = 'finished', winner_seat = case when current_seat = 1 then 2 else 1 end,
      updated_at = now() where id = selected_room.id;
  elsif selected_room.status = 'playing' then
    select player.* into opponent_player from public.yizi_room_players player
    where player.room_id = selected_room.id and player.seat_no <> selected_player.seat_no;
    if opponent_player.id is not null and opponent_player.status = 'connected'
      and opponent_player.last_seen_at < now() - interval '120 seconds' then
      update public.yizi_room_players set status = 'forfeited' where id = opponent_player.id;
      update public.yizi_rooms set status = 'finished', winner_seat = selected_player.seat_no, updated_at = now()
      where id = selected_room.id;
    end if;
  end if;
  select * into selected_room from public.yizi_rooms where id = selected_room.id;

  return jsonb_build_object(
    'room', jsonb_build_object(
      'roomCode', selected_room.room_code, 'status', selected_room.status,
      'timeLimitSeconds', selected_room.time_limit_seconds, 'board', selected_room.board,
      'usedIdioms', selected_room.used_idioms, 'currentSeat', selected_room.current_seat,
      'winnerSeat', selected_room.winner_seat, 'seedChar', selected_room.seed_char,
      'turnStartedAt', selected_room.turn_started_at
    ),
    'meSeat', selected_player.seat_no,
    'players', coalesce((select jsonb_agg(jsonb_build_object(
      'seatNo', player.seat_no, 'nickname', player.nickname, 'status', player.status,
      'score', player.score, 'lastSeenAt', player.last_seen_at
    ) order by player.seat_no) from public.yizi_room_players player where player.room_id = selected_room.id), '[]'::jsonb),
    'moves', coalesce((select jsonb_agg(jsonb_build_object(
      'moveNo', move.move_no, 'seatNo', player.seat_no, 'phrase', move.phrase,
      'startRow', move.start_row, 'startColumn', move.start_column,
      'direction', move.direction, 'placedAt', move.placed_at
    ) order by move.move_no) from public.yizi_room_moves move
      join public.yizi_room_players player on player.id = move.player_id
      where move.room_id = selected_room.id), '[]'::jsonb)
  );
end;
$$;

create or replace function public.yizi_submit_room_move(
  p_room_code text,
  p_seat_token uuid,
  p_phrase text,
  p_start_row integer,
  p_start_column integer,
  p_direction text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_room public.yizi_rooms;
  selected_player public.yizi_room_players;
  normalized_phrase text := regexp_replace(coalesce(p_phrase, ''), '\s', '', 'g');
  delta_row integer;
  delta_column integer;
  item_index integer;
  target_row integer;
  target_column integer;
  target_key text;
  next_character text;
  next_board jsonb;
  next_move_no integer;
begin
  select room.* into selected_room from public.yizi_rooms room where room.room_code = p_room_code for update;
  if selected_room.id is null then raise exception using errcode = 'P0001', message = 'yizi_room_not_found'; end if;
  select player.* into selected_player from public.yizi_room_players player
  where player.room_id = selected_room.id and player.seat_token = p_seat_token and player.status = 'connected';
  if selected_player.id is null then raise exception using errcode = 'P0001', message = 'yizi_seat_invalid'; end if;
  if selected_room.status <> 'playing' then raise exception using errcode = 'P0001', message = 'yizi_room_not_playing'; end if;
  if selected_room.current_seat <> selected_player.seat_no then raise exception using errcode = 'P0001', message = 'yizi_not_your_turn'; end if;
  if selected_room.turn_started_at + make_interval(secs => selected_room.time_limit_seconds) < now() then
    raise exception using errcode = 'P0001', message = 'yizi_turn_timed_out';
  end if;
  if not exists (select 1 from public.yizi_idiom_lexicon where phrase = normalized_phrase) then
    raise exception using errcode = 'P0001', message = 'yizi_idiom_invalid';
  end if;
  if normalized_phrase = any(selected_room.used_idioms) then raise exception using errcode = 'P0001', message = 'yizi_idiom_used'; end if;
  if not public.yizi_board_can_place(selected_room.board, normalized_phrase, p_start_row, p_start_column, p_direction) then
    raise exception using errcode = 'P0001', message = 'yizi_move_invalid';
  end if;

  select
    case p_direction when 'D' then 1 when 'U' then -1 when 'DR' then 1 when 'UL' then -1 when 'DL' then 1 when 'UR' then -1 else 0 end,
    case p_direction when 'R' then 1 when 'L' then -1 when 'DR' then 1 when 'UL' then -1 when 'DL' then -1 when 'UR' then 1 else 0 end
  into delta_row, delta_column;
  next_board := selected_room.board;
  for item_index in 0..3 loop
    target_row := p_start_row + delta_row * item_index;
    target_column := p_start_column + delta_column * item_index;
    target_key := target_row::text || ':' || target_column::text;
    next_character := substr(normalized_phrase, item_index + 1, 1);
    next_board := jsonb_set(next_board, array[target_key], to_jsonb(next_character), true);
  end loop;
  select coalesce(max(move_no), 0) + 1 into next_move_no from public.yizi_room_moves where room_id = selected_room.id;
  insert into public.yizi_room_moves(room_id, player_id, move_no, phrase, start_row, start_column, direction)
  values (selected_room.id, selected_player.id, next_move_no, normalized_phrase, p_start_row, p_start_column, p_direction);
  update public.yizi_room_players set score = score + 1, last_seen_at = now() where id = selected_player.id;
  update public.yizi_rooms set board = next_board, used_idioms = array_append(used_idioms, normalized_phrase),
    current_seat = case when selected_player.seat_no = 1 then 2 else 1 end,
    turn_started_at = now(), updated_at = now() where id = selected_room.id;
  return public.yizi_room_snapshot(p_room_code, p_seat_token);
end;
$$;

create or replace function public.yizi_claim_no_room_move(p_room_code text, p_seat_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_room public.yizi_rooms;
  selected_player public.yizi_room_players;
  idiom_record record;
  row_index integer;
  column_index integer;
  direction_code text;
begin
  select room.* into selected_room from public.yizi_rooms room where room.room_code = p_room_code for update;
  select player.* into selected_player from public.yizi_room_players player
  where player.room_id = selected_room.id and player.seat_token = p_seat_token and player.status = 'connected';
  if selected_player.id is null then raise exception using errcode = 'P0001', message = 'yizi_seat_invalid'; end if;
  if selected_room.status <> 'playing' or selected_room.current_seat <> selected_player.seat_no then
    raise exception using errcode = 'P0001', message = 'yizi_not_your_turn';
  end if;

  for idiom_record in select phrase from public.yizi_idiom_lexicon
    where is_common = true and not (phrase = any(selected_room.used_idioms)) order by common_rank loop
    for row_index in 0..7 loop
      for column_index in 0..11 loop
        foreach direction_code in array array['R','L','D','U','DR','UL','DL','UR'] loop
          if public.yizi_board_can_place(selected_room.board, idiom_record.phrase, row_index, column_index, direction_code) then
            raise exception using errcode = 'P0001', message = 'yizi_legal_move_exists';
          end if;
        end loop;
      end loop;
    end loop;
  end loop;

  update public.yizi_rooms set status = 'finished',
    winner_seat = case when selected_player.seat_no = 1 then 2 else 1 end,
    updated_at = now() where id = selected_room.id;
  return public.yizi_room_snapshot(p_room_code, p_seat_token);
end;
$$;

create or replace function public.yizi_leave_room(p_room_code text, p_seat_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_room public.yizi_rooms;
  selected_player public.yizi_room_players;
begin
  select room.* into selected_room from public.yizi_rooms room where room.room_code = p_room_code for update;
  if selected_room.id is null then return jsonb_build_object('closed', true); end if;
  select player.* into selected_player from public.yizi_room_players player
  where player.room_id = selected_room.id and player.seat_token = p_seat_token;
  if selected_player.id is null then raise exception using errcode = 'P0001', message = 'yizi_seat_invalid'; end if;
  update public.yizi_room_players set status = case when selected_room.status = 'playing' then 'forfeited' else 'left' end,
    last_seen_at = now() where id = selected_player.id;
  if selected_room.status = 'playing' then
    update public.yizi_rooms set status = 'finished', winner_seat = case when selected_player.seat_no = 1 then 2 else 1 end,
      updated_at = now() where id = selected_room.id;
  elsif selected_room.status = 'waiting' then
    update public.yizi_rooms set status = 'closed', updated_at = now() where id = selected_room.id;
  end if;
  return jsonb_build_object('closed', true);
end;
$$;

revoke all on function public.yizi_board_can_place(jsonb,text,integer,integer,text) from public;
revoke all on function public.yizi_current_student_id() from public;
revoke all on function public.yizi_create_room(text) from public;
revoke all on function public.yizi_join_room(text,text) from public;
revoke all on function public.yizi_start_room(text,uuid,integer) from public;
revoke all on function public.yizi_room_snapshot(text,uuid) from public;
revoke all on function public.yizi_submit_room_move(text,uuid,text,integer,integer,text) from public;
revoke all on function public.yizi_claim_no_room_move(text,uuid) from public;
revoke all on function public.yizi_leave_room(text,uuid) from public;

grant execute on function public.yizi_create_room(text) to anon, authenticated;
grant execute on function public.yizi_join_room(text,text) to anon, authenticated;
grant execute on function public.yizi_start_room(text,uuid,integer) to anon, authenticated;
grant execute on function public.yizi_room_snapshot(text,uuid) to anon, authenticated;
grant execute on function public.yizi_submit_room_move(text,uuid,text,integer,integer,text) to anon, authenticated;
grant execute on function public.yizi_claim_no_room_move(text,uuid) to anon, authenticated;
grant execute on function public.yizi_leave_room(text,uuid) to anon, authenticated;

comment on function public.yizi_room_snapshot(text,uuid) is '讀取隻字片語房間並更新連線時間；斷線座位保留 120 秒。';
