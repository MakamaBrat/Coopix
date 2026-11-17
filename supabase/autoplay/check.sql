-- Проверка: что сейчас в базе. Смотрите колонку state.
-- ok = в игре новая версия. old = в игре старая версия: выполните все части этой игры. BROKEN = файл обрезан: выполните все части.
-- buffer = сколько частей новой версии уже загружено, но ещё не применено (например «1 из 2»).
create table if not exists public.game_upload (
  game_id text not null, part int not null, total int not null, body text not null,
  primary key (game_id, part)
);
alter table public.game_upload add column if not exists ver text not null default '';
alter table public.game_upload enable row level security;
revoke all on public.game_upload from anon, authenticated;
select g.id, char_length(g.file_html) as len, e.new_len,
  case when char_length(g.file_html) = e.new_len then 'ok'
       when rtrim(g.file_html, E' \r\n\t') like '%</html>' then 'old'
       else 'BROKEN' end as state,
  (select count(*) || ' из ' || coalesce(max(u.total), 0) from public.game_upload u where u.game_id = g.id and u.ver = e.new_len::text) as buffer
from public.games g join (values ('gravity', 512710), ('metro', 447297), ('stickfight', 542159), ('unik', 1636949)) as e(id, new_len) on e.id = g.id
order by g.id;
