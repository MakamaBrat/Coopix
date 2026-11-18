-- Звёзды за покупки игр теперь тоже попадают на график «Пульс маркета» (строка со звёздами).
-- Выполните один раз в Supabase → SQL Editor (нужна таблица purchases из schema.sql). Повторный запуск безопасен.
create or replace function public.activity_series(p_start timestamptz, p_step_sec int, p_n int)
returns jsonb
language sql stable
set search_path = public
as $$
  with k as (
    select u.registered_at as ts, 10 as w, 0 as s, true as act, 'reg' as kd from public.users u
    union all
    select e.ts, e.weight, 0, true, 'rev' from public.events e where e.type = 'review' and not (e.meta ? 'e')
    union all
    select f.ts, f.weight, 0, true, case when f.type = 'play' then 'play' else 'dl' end from (
      select distinct on (e.user_id, e.game_id, e.type) e.ts, e.weight, e.type
        from public.events e
       where e.type in ('play', 'download') and e.game_id is not null
       order by e.user_id, e.game_id, e.type, e.ts
    ) f
    union all
    select e.ts, 0, coalesce((e.meta->>'s')::int, 0), false, 'star' from public.events e where e.type = 'thank'
    union all
    -- звёзды за покупки платных игр и предметов внутри игр (таблица purchases; бесплатные «админские» покупки с суммой 0 дают 0 звёзд)
    select pr.created_at, 0, pr.amount, false, 'star' from public.purchases pr where pr.kind in ('game', 'item') and pr.status = 'paid' and pr.currency = 'XTR' and pr.amount > 0
  )
  select jsonb_build_object(
    'base', (select coalesce(sum(w), 0) from k where ts < p_start),
    -- сколько каждого вида было до начала окна (для линии «всего» по выбранному фильтру): регистрации, отзывы, первые запуски, первые скачивания
    'bases', (select jsonb_build_array(count(*) filter (where kd = 'reg'), count(*) filter (where kd = 'rev'), count(*) filter (where kd = 'play'), count(*) filter (where kd = 'dl')) from k where ts < p_start),
    'rows', (
      select coalesce(jsonb_agg(jsonb_build_array(b.a, b.w, b.s, b.reg, b.rev, b.pl, b.dl) order by b.i), '[]'::jsonb)
        from (
          -- a = ключевые действия, w = очки, s = звёзды «спасибо автору», дальше по видам: регистрации, отзывы, первые запуски, первые скачивания
          select g.i, count(k.ts) filter (where k.act) as a, coalesce(sum(k.w), 0) as w, coalesce(sum(k.s), 0) as s,
                 count(k.ts) filter (where k.kd = 'reg') as reg, count(k.ts) filter (where k.kd = 'rev') as rev,
                 count(k.ts) filter (where k.kd = 'play') as pl, count(k.ts) filter (where k.kd = 'dl') as dl
            from generate_series(0, least(greatest(p_n, 1), 100) - 1) as g(i)
            left join k
              on k.ts >= p_start + (g.i * p_step_sec) * interval '1 second'
             and k.ts <  p_start + ((g.i + 1) * p_step_sec) * interval '1 second'
           group by g.i
        ) b
    )
  );
$$;

revoke all on function public.activity_series(timestamptz, int, int) from public, anon, authenticated;
grant execute on function public.activity_series(timestamptz, int, int) to service_role;
