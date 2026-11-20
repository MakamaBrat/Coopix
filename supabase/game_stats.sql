-- Перехваты и рекорд серии игрока по каждой игре (Noomic Bot и любые другие, которые пришлют эти числа).
-- Выполните один раз в Supabase → SQL Editor (или: python scripts/run_sql.py supabase/game_stats.sql). Повторный запуск безопасен.
-- Одна строка на пару «игрок — игра», пишется только когда число выросло: нагрузка на базу минимальная.
create table if not exists public.game_stats (
  user_id     bigint not null references public.users(tg_id) on delete cascade,
  game_id     text   not null references public.games(id) on delete cascade,
  regrabs     bigint  not null default 0 check (regrabs >= 0),      -- перехватов за всё время
  best_streak integer not null default 0 check (best_streak >= 0),  -- рекорд серии перехватов за один заход
  updated_at  timestamptz not null default now(),
  primary key (user_id, game_id)
);
create index if not exists game_stats_game_idx on public.game_stats (game_id, best_streak desc);
-- как и всё остальное: доступ только у сервера (service_role)
alter table public.game_stats enable row level security;
revoke all on public.game_stats from anon, authenticated;
