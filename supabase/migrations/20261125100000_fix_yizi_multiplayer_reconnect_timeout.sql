-- Keep the documented multiplayer reconnection grace period consistent across
-- all Yizi Qianjin room types. The earlier multiplayer migrations used 180
-- seconds in their snapshot functions, while the established idiom-board room
-- and the product rule use 120 seconds.

do $migration$
declare
  function_signature text;
  definition text;
begin
  foreach function_signature in array array[
    'public.yizi_four_sayings_room_snapshot(text,uuid)',
    'public.yizi_word_competition_snapshot(text,uuid)'
  ]
  loop
    select pg_get_functiondef(to_regprocedure(function_signature)) into definition;

    if definition is null then
      raise exception 'Required multiplayer function is missing: %', function_signature;
    end if;

    if position('180 seconds' in definition) = 0 and position('120 seconds' in definition) > 0 then
      continue;
    end if;

    if position('180 seconds' in definition) = 0 then
      raise exception 'Expected legacy reconnect timeout was not found: %', function_signature;
    end if;

    execute replace(definition, '180 seconds', '120 seconds');
  end loop;
end
$migration$;

comment on function public.yizi_four_sayings_room_snapshot(text,uuid)
  is 'Returns a Four Sayings competition snapshot and forfeits disconnected players after 120 seconds.';

comment on function public.yizi_word_competition_snapshot(text,uuid)
  is 'Returns a word competition snapshot and forfeits disconnected players after 120 seconds.';
