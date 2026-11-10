-- Coopix Market: заявки на публикацию игр.
-- Выполнить один раз в Supabase → SQL Editor. Повторный запуск безопасен.

create table if not exists public.submissions (
  id          uuid primary key default gen_random_uuid(),
  author_id   bigint  not null,                       -- Telegram id из ПРОВЕРЕННОГО initData
  author      text    not null default '',
  tg          text    not null default '',
  title       text    not null check (char_length(title) between 1 and 40),
  genre       text    not null check (genre in ('Arcade','Music','Shooter','Puzzle','Other')),
  description text    not null check (char_length(description) between 1 and 600),
  version     text    not null default '0.1' check (char_length(version) <= 12),
  contact     text    not null default '' check (char_length(contact) <= 60),
  file_name   text    not null,
  file_size   integer not null check (file_size between 1 and 1500000),
  file_html   text    not null,
  status      text    not null default 'new' check (status in ('new','seen','pub')),
  comment     text    not null default '' check (char_length(comment) <= 400),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists submissions_author_idx on public.submissions (author_id, created_at desc);
create index if not exists submissions_status_idx on public.submissions (status, created_at desc);

-- RLS включён и политик нет: через anon/authenticated к таблице доступа нет вообще.
-- Работает только серверный ключ (service_role) из функций Vercel.
alter table public.submissions enable row level security;
revoke all on public.submissions from anon, authenticated;

-- Лимит и вставка в одной транзакции. Advisory-lock по автору сериализует параллельные запросы,
-- поэтому лимит нельзя обойти пачкой одновременных POST. Возвращает строку без file_html или NULL при превышении лимита.
create or replace function public.create_submission(
  p_author_id bigint, p_author text, p_tg text, p_title text, p_genre text,
  p_description text, p_version text, p_contact text, p_file_name text, p_file_html text,
  p_limit int default 5
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  n int;
  r public.submissions;
begin
  perform pg_advisory_xact_lock(p_author_id);

  select count(*) into n from public.submissions
   where author_id = p_author_id and created_at > now() - interval '24 hours';
  if n >= p_limit then
    return null;
  end if;

  insert into public.submissions
    (author_id, author, tg, title, genre, description, version, contact, file_name, file_size, file_html)
  values
    (p_author_id, p_author, p_tg, p_title, p_genre, p_description, p_version, p_contact,
     p_file_name, octet_length(p_file_html), p_file_html)
  returning * into r;

  return to_jsonb(r) - 'file_html';
end;
$$;

-- По умолчанию функции в Postgres доступны всем (в т.ч. anon через /rest/v1/rpc/...).
-- Закрываем: вызывать может только service_role, т.е. наш сервер.
revoke all on function public.create_submission(bigint,text,text,text,text,text,text,text,text,text,int)
  from public, anon, authenticated;
grant execute on function public.create_submission(bigint,text,text,text,text,text,text,text,text,text,int)
  to service_role;


-- =====================================================================================
-- Админ-панель: пользователи, модераторы, настройки сайта (новости, адрес доната).
-- Выполнить один раз в SQL Editor (повторный запуск безопасен).
-- =====================================================================================

-- Игроки: строка создаётся/обновляется на сервере при каждом заходе из Telegram.
create table if not exists public.users (
  tg_id        bigint primary key,
  first_name   text not null default '',
  username     text not null default '',
  registered_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  banned       boolean not null default false,
  ban_reason   text not null default '' check (char_length(ban_reason) <= 200),
  banned_at    timestamptz,
  banned_by    bigint
);
create index if not exists users_seen_idx   on public.users (last_seen_at desc);
create index if not exists users_reg_idx    on public.users (registered_at desc);
create index if not exists users_banned_idx on public.users (banned) where banned;

-- Модераторы (обрабатывают только заявки на игры). Главные админы задаются переменной ADMIN_IDS.
create table if not exists public.moderators (
  tg_id    bigint primary key,
  note     text not null default '' check (char_length(note) <= 60),
  added_by bigint,
  added_at timestamptz not null default now()
);

-- Настройки сайта: 'news' (массив новостей) и 'wallet' ({"addr": "T..."}).
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by bigint
);

alter table public.users      enable row level security;
alter table public.moderators enable row level security;
alter table public.settings   enable row level security;
revoke all on public.users, public.moderators, public.settings from anon, authenticated;

-- Стартовые новости (как были в index.html) и пустой адрес доната. Уже существующие не трогаем.
insert into public.settings (key, value) values
  ('news', '[
    {"id":"n1","tag":"Новое","c":"#ff5ec4","date":"09.11","title":"Coopix Market открыт","text":"Быстрые офлайн игры с мультиплеером: запускайте, зовите друга и играйте без интернета.","link":""},
    {"id":"n2","tag":"Игра","c":"#ffb23f","date":"08.11","title":"Block Drop в маркете","text":"Пятизвёздочный пазл. Бросьте вызов другу и побейте его рекорд.","link":""},
    {"id":"n3","tag":"Совет","c":"#4dd2ff","date":"07.11","title":"Телефон тормозит?","text":"Откройте Settings › Quality › Low: эффекты отключатся, игры пойдут быстрее.","link":""}
  ]'::jsonb),
  ('wallet', '{"addr":""}'::jsonb)
on conflict (key) do nothing;

-- Заход игрока: создаёт строку при первом входе, обновляет имя и «последнюю активность»
-- (не чаще раза в минуту, чтобы не писать в базу на каждый запрос). Возвращает статус бана и роль.
create or replace function public.touch_user(p_id bigint, p_first_name text, p_username text)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  r public.users;
  is_mod boolean;
begin
  insert into public.users as u (tg_id, first_name, username)
  values (p_id, left(coalesce(p_first_name, ''), 40), left(coalesce(p_username, ''), 40))
  on conflict (tg_id) do update set
    first_name   = excluded.first_name,
    username     = excluded.username,
    last_seen_at = case when u.last_seen_at < now() - interval '1 minute' then now() else u.last_seen_at end
  returning * into r;

  select exists (select 1 from public.moderators where tg_id = p_id) into is_mod;
  return jsonb_build_object('banned', r.banned, 'ban_reason', r.ban_reason, 'moderator', is_mod);
end;
$$;

revoke all on function public.touch_user(bigint, text, text) from public, anon, authenticated;
grant execute on function public.touch_user(bigint, text, text) to service_role;
