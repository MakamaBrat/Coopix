-- =====================================================================================
-- Игровые боты: у каждой игры может быть свой Telegram-бот (ссылка сразу в игру).
-- Токены добавляет главный админ в админ-панели («Боты»), сервер проверяет ими подпись входа.
-- users.via_market: заходил через маркет-бота (все прежние игроки — да); users.via_game: заходил хотя бы через одного игрового бота.
-- user_bots: через каких именно игровых ботов заходил игрок — по нему идёт рассылка от конкретного бота.
-- Повторный запуск безопасен.
-- =====================================================================================
alter table public.users add column if not exists via_market boolean not null default true;
alter table public.users add column if not exists via_game   boolean not null default false;

create table if not exists public.game_bots (
  id         text primary key check (id ~ '^[A-Za-z0-9_]{3,64}$'),  -- username бота без @
  token      text not null unique,                                  -- секрет: читает только сервер (service_role)
  game_id    text references public.games(id) on delete set null,   -- к какой игре относится бот
  title      text not null default '' check (char_length(title) <= 64),
  created_at timestamptz not null default now()
);
alter table public.game_bots enable row level security;
revoke all on public.game_bots from anon, authenticated;

create table if not exists public.user_bots (
  user_id  bigint not null references public.users(tg_id) on delete cascade,
  bot_id   text   not null references public.game_bots(id) on delete cascade,
  first_at timestamptz not null default now(),
  last_at  timestamptz not null default now(),
  primary key (user_id, bot_id)
);
create index if not exists user_bots_bot_idx on public.user_bots (bot_id, user_id);
alter table public.user_bots enable row level security;
revoke all on public.user_bots from anon, authenticated;

drop function if exists public.touch_user(bigint, text, text);
drop function if exists public.touch_user(bigint, text, text, text);
-- p_bot: 'market' или username игрового бота, через которого открыли мини-приложение
create or replace function public.touch_user(p_id bigint, p_first_name text, p_username text, p_bot text default 'market')
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  r public.users;
  is_mod boolean;
  existed boolean;
  g boolean := coalesce(p_bot, 'market') <> 'market';
begin
  select exists (select 1 from public.users where tg_id = p_id) into existed; -- created = первый заход (регистрация)
  insert into public.users as u (tg_id, first_name, username, via_market, via_game)
  values (p_id, left(coalesce(p_first_name, ''), 40), left(coalesce(p_username, ''), 40), not g, g)
  on conflict (tg_id) do update set
    first_name   = excluded.first_name,
    username     = excluded.username,
    via_market   = u.via_market or excluded.via_market,
    via_game     = u.via_game or excluded.via_game,
    last_seen_at = case when u.last_seen_at < now() - interval '1 minute' then now() else u.last_seen_at end
  returning * into r;

  if g and exists (select 1 from public.game_bots where id = p_bot) then
    insert into public.user_bots (user_id, bot_id) values (p_id, p_bot)
    on conflict (user_id, bot_id) do update set last_at = now();
  end if;

  select exists (select 1 from public.moderators where tg_id = p_id) into is_mod;
  return jsonb_build_object('banned', r.banned, 'ban_reason', r.ban_reason, 'moderator', is_mod, 'created', not existed);
end;
$$;

revoke all on function public.touch_user(bigint, text, text, text) from public, anon, authenticated;
grant execute on function public.touch_user(bigint, text, text, text) to service_role;
