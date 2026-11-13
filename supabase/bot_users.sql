-- ============ Кто открывал бота ============
-- Каждый, кто написал боту (в т.ч. просто нажал /start), даже если ни разу не открывал маркет.
-- Ник и имя обновляются при каждом сообщении; first_seen — первый раз, last_seen — последний.
create table if not exists public.bot_users (
  tg_id      bigint primary key,
  username   text   not null default '' check (char_length(username) <= 64),
  first_name text   not null default '' check (char_length(first_name) <= 128),
  last_name  text   not null default '' check (char_length(last_name) <= 128),
  lang       text   not null default '' check (char_length(lang) <= 16),
  messages   integer not null default 1,
  first_seen timestamptz not null default now(),
  last_seen  timestamptz not null default now()
);
create index if not exists bot_users_seen_idx on public.bot_users (last_seen desc);
create or replace function public.bot_seen(p_id bigint, p_username text, p_first text, p_last text, p_lang text) returns void
language sql security definer set search_path = public as $$
  insert into public.bot_users (tg_id, username, first_name, last_name, lang) values (p_id, p_username, p_first, p_last, p_lang)
  on conflict (tg_id) do update set username = excluded.username, first_name = excluded.first_name, last_name = excluded.last_name,
    lang = excluded.lang, messages = public.bot_users.messages + 1, last_seen = now();
$$;
alter table public.bot_users enable row level security;
revoke all on public.bot_users from anon, authenticated;
revoke all on function public.bot_seen(bigint, text, text, text, text) from public, anon, authenticated;