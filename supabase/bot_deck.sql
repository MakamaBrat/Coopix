-- Очередь «рандомной игры»: игры не повторяются, пока игрок не прошёл полный круг
alter table public.bot_users add column if not exists deck jsonb not null default '[]'::jsonb;
alter table public.bot_users add column if not exists last_game text not null default '';