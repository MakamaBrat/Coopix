-- Карты игроков из конструктора (Noomic Bot): до 3 карт на игрока и игру, открываются по ссылке «поделиться».
-- Выполните один раз в Supabase → SQL Editor (или: python scripts/run_sql.py supabase/game_maps.sql). Повторный запуск безопасен.
-- Размер: код карты до ~24 КБ (обычно 1,5–13 КБ), у игрока не больше 3 карт на игру.
create table if not exists public.game_maps (
  id         text primary key check (id ~ '^[a-f0-9]{12}$'),
  game_id    text   not null references public.games(id) on delete cascade,
  author_id  bigint not null references public.users(tg_id) on delete cascade,
  name       text   not null check (char_length(name) between 1 and 40),
  code       text   not null check (char_length(code) <= 24000),   -- "NC1-" + base64(JSON): формат кода карты из игры
  pieces     integer not null check (pieces between 1 and 400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists game_maps_author_idx on public.game_maps (author_id, game_id, created_at);
-- как и всё остальное: доступ только у сервера (service_role)
alter table public.game_maps enable row level security;
revoke all on public.game_maps from anon, authenticated;
