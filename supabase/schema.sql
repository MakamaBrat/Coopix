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

-- HTML-файл в заявке необязателен: автор шлёт его боту поддержки (@Coopsupbot), заявку оформляет на сайте
alter table public.submissions alter column file_html drop not null;
alter table public.submissions alter column file_size drop not null;

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
  existed boolean;
begin
  select exists (select 1 from public.users where tg_id = p_id) into existed; -- created = первый заход (регистрация)
  insert into public.users as u (tg_id, first_name, username)
  values (p_id, left(coalesce(p_first_name, ''), 40), left(coalesce(p_username, ''), 40))
  on conflict (tg_id) do update set
    first_name   = excluded.first_name,
    username     = excluded.username,
    last_seen_at = case when u.last_seen_at < now() - interval '1 minute' then now() else u.last_seen_at end
  returning * into r;

  select exists (select 1 from public.moderators where tg_id = p_id) into is_mod;
  return jsonb_build_object('banned', r.banned, 'ban_reason', r.ban_reason, 'moderator', is_mod, 'created', not existed);
end;
$$;

revoke all on function public.touch_user(bigint, text, text) from public, anon, authenticated;
grant execute on function public.touch_user(bigint, text, text) to service_role;


-- =====================================================================================
-- Сообщество: профили с постом, отзывы (из них считается рейтинг), журнал действий, счётчики игр.
-- Выполнить один раз в SQL Editor (повторный запуск безопасен).
-- =====================================================================================

-- Профиль игрока: ник, рамка, фото (JPEG 128×128 в base64), опыт, медали и один пост.
-- Клиент присылает снимок профиля, сервер только копит: опыт и медали не уменьшаются.
create table if not exists public.profiles (
  tg_id      bigint primary key references public.users(tg_id) on delete cascade,
  name       text    not null default '' check (char_length(name) <= 16),
  color      text    not null default '#a56bff' check (color ~ '^#[0-9a-fA-F]{6}$'),
  photo      text    not null default '' check (char_length(photo) <= 40000),
  xp         integer not null default 0 check (xp between 0 and 1000000),
  medals     jsonb   not null default '{}'::jsonb,   -- { "id медали": время получения (мс) }
  stats      jsonb   not null default '{}'::jsonb,   -- { plays, ids, best, reviews, favs, made, custom, days }
  synced     boolean not null default false,         -- true после первой синхронизации с клиента
  post_title text    not null default '' check (char_length(post_title) <= 60),
  post_text  text    not null default '' check (char_length(post_text) <= 600),
  post_at    timestamptz,
  updated_at timestamptz not null default now()
);

-- Отзывы. Один отзыв на игрока и игру: рейтинг игры = среднее по оценкам (1–5), 0 = отзыв без оценки.
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  game_id    text     not null check (game_id ~ '^[a-z0-9_-]{1,32}$'),
  author_id  bigint   not null references public.users(tg_id) on delete cascade,
  rating     smallint not null default 0 check (rating between 0 and 5),
  body       text     not null check (char_length(body) between 2 and 240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, author_id)
);
create index if not exists reviews_game_idx on public.reviews (game_id, updated_at desc);

-- Журнал действий: каждая строка = одно действие игрока. Из него считаются «играли / скачали» и график активности.
create table if not exists public.events (
  id      bigint generated always as identity primary key,
  ts      timestamptz not null default now(),
  user_id bigint not null references public.users(tg_id) on delete cascade,
  type    text   not null check (type ~ '^[a-z_]{2,16}$'),
  game_id text   check (game_id is null or game_id ~ '^[a-z0-9_-]{1,32}$'),
  weight  integer not null default 0,                -- вклад в «ресурс COOP» на момент действия
  meta    jsonb  not null default '{}'::jsonb
);
create index if not exists events_ts_idx   on public.events (ts desc);
create index if not exists events_user_idx on public.events (user_id, type, ts desc);
create index if not exists events_game_idx on public.events (game_id, type, user_id) where game_id is not null;

-- Журнал админа по умолчанию показывает только ключевые события: meta.k = 1 ставит сервер при записи
-- (регистрация, новый отзыв, первый запуск и первая загрузка игры игроком, звёзды, заявка на игру, мод).
create index if not exists events_key_idx on public.events (id desc) where (meta->>'k') = '1';
-- Пометка старых записей, сделанных до появления k (повторный запуск ничего не меняет)
update public.events set meta = meta || '{"k":1}'::jsonb
 where (meta->>'k') is null and (type in ('thank', 'submit', 'mod', 'register') or (type = 'review' and not (meta ? 'e')));
update public.events e set meta = e.meta || '{"k":1}'::jsonb
  from (select distinct on (user_id, game_id, type) id from public.events
         where type in ('play', 'download') and game_id is not null order by user_id, game_id, type, ts) f
 where e.id = f.id and (e.meta->>'k') is null;
-- регистрации игроков, зашедших до появления события register
insert into public.events (ts, user_id, type, weight, meta)
select u.registered_at, u.tg_id, 'register', 0, '{"k":1}'::jsonb from public.users u
 where not exists (select 1 from public.events e where e.user_id = u.tg_id and e.type = 'register');

alter table public.profiles enable row level security;
alter table public.reviews  enable row level security;
alter table public.events   enable row level security;
revoke all on public.profiles, public.reviews, public.events from anon, authenticated;

-- Счётчики и рейтинг игр. «Игроков» = разных людей, «запусков/загрузок» = всех нажатий.
-- favs = сколько игроков сейчас держат игру в избранном (последнее их действие fav, а не unfav); влияет на рейтинг (см. hub.js).
drop function if exists public.game_stats(text[]);
create or replace function public.game_stats(p_ids text[])
returns table (game_id text, plays bigint, play_players bigint, downloads bigint, dl_players bigint,
               reviews bigint, rated bigint, rating numeric, favs bigint)
language sql stable
set search_path = public
as $$
  with e as (
    select ev.game_id,
           count(*) filter (where ev.type = 'play')                    as plays,
           count(distinct ev.user_id) filter (where ev.type = 'play')  as play_players,
           count(*) filter (where ev.type = 'download')                as downloads,
           count(distinct ev.user_id) filter (where ev.type = 'download') as dl_players
      from public.events ev
     where ev.game_id = any(p_ids) and ev.type in ('play', 'download')
     group by ev.game_id
  ), r as (
    select rv.game_id,
           count(*)                                         as reviews,
           count(*) filter (where rv.rating > 0)            as rated,
           coalesce(round(avg(rv.rating) filter (where rv.rating > 0), 2), 0) as rating
      from public.reviews rv
     where rv.game_id = any(p_ids)
     group by rv.game_id
  ), f as (
    select l.game_id, count(*) filter (where l.type = 'fav') as favs
      from (select distinct on (ev.game_id, ev.user_id) ev.game_id, ev.type
              from public.events ev
             where ev.game_id = any(p_ids) and ev.type in ('fav', 'unfav')
             order by ev.game_id, ev.user_id, ev.id desc) l
     group by l.game_id
  )
  select coalesce(e.game_id, r.game_id, f.game_id),
         coalesce(e.plays, 0), coalesce(e.play_players, 0),
         coalesce(e.downloads, 0), coalesce(e.dl_players, 0),
         coalesce(r.reviews, 0), coalesce(r.rated, 0), coalesce(r.rating, 0), coalesce(f.favs, 0)
    from e full join r on e.game_id = r.game_id full join f on f.game_id = coalesce(e.game_id, r.game_id);
$$;

-- График «Пульс маркета»: только ключевые действия.
--   регистрация (первый заход игрока, вес 10), новый отзыв (не правка), первый запуск и первая загрузка игры игроком;
--   заходы, избранное, повторные запуски и прочее на график не попадают (они остаются в журнале действий).
-- Звёзды «спасибо автору» идут отдельной строкой (s) и в действия/очки не входят.
-- p_n корзин по p_step_sec секунд от p_start; base = очки ключевых действий до начала окна.
create index if not exists events_first_idx on public.events (user_id, game_id, type, ts) where type in ('play', 'download');
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

revoke all on function public.game_stats(text[])                     from public, anon, authenticated;
revoke all on function public.activity_series(timestamptz, int, int) from public, anon, authenticated;
grant execute on function public.game_stats(text[])                     to service_role;
grant execute on function public.activity_series(timestamptz, int, int) to service_role;


-- =====================================================================================
-- Каталог игр (список в магазине, доступ) и правки страниц игр авторами (с одобрением админа).
-- Выполнить один раз в SQL Editor (повторный запуск безопасен).
-- =====================================================================================

-- access: public = видят все, staff = только админы и модераторы (проверка перед выходом), off = скрыта от всех.
create table if not exists public.games (
  id          text primary key check (id ~ '^[a-z0-9_-]{1,32}$'),
  title       text   not null check (char_length(title) between 1 and 40),
  tags        jsonb  not null default '["Arcade"]'::jsonb,   -- до 3 тегов, первый = жанр
  description text   not null default '' check (char_length(description) <= 600),
  changes     text   not null default '' check (char_length(changes) <= 200),
  version     text   not null default '0.1' check (char_length(version) <= 12),
  author_name text   not null default '' check (char_length(author_name) <= 24),
  author_id   bigint,                                         -- автор-игрок (может подавать правки страницы)
  item        text   not null default 'cassette' check (item in ('cassette','cd','floppy','handheld')),
  cover       text   not null default 'b:retro'  check (cover in ('b:retro','b:space','b:toxic','b:blocks')),
  tint        jsonb,                                          -- { h: 0..360, s: 0..1 } или null = авто
  bg          text   not null default 'auto' check (bg in ('auto','0','1','2','3')),
  link        text   not null default '' check (char_length(link) <= 300),
  access      text   not null default 'staff' check (access in ('public','staff','off')),
  sort        integer not null default 100,
  file_html   text,                                           -- HTML опубликованной игры игрока (null у встроенных)
  submission  uuid,
  has_file    boolean generated always as (file_html is not null) stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists games_sort_idx on public.games (sort, created_at);

-- Своя обложка (картинка JPEG 256×256 в data URL). cover = 'img:<хэш>' указывает, что она есть. Повторный запуск безопасен.
alter table public.games add column if not exists cover_img text;
alter table public.games drop constraint if exists games_cover_img_check;
alter table public.games add constraint games_cover_img_check check (cover_img is null or char_length(cover_img) <= 280000);
-- Фон карточки и страницы (картинка 16:9, поверх неё слабый эффект). bg_ref = 'img:<хэш>' или null.
alter table public.games add column if not exists bg_ref text check (bg_ref is null or bg_ref ~ '^img:[0-9a-f]{12}$');
alter table public.games add column if not exists bg_img text check (bg_img is null or char_length(bg_img) <= 420000);
alter table public.games drop constraint if exists games_cover_check;
alter table public.games add constraint games_cover_check check (cover in ('b:retro','b:space','b:toxic','b:blocks') or cover ~ '^img:[0-9a-f]{12}$');

-- Скачивание выключено у этой игры (кнопку «Скачать» видно, но она не работает). Общий выключатель — settings.site.dlOff.
alter table public.games add column if not exists dl_off boolean not null default false;
-- Плейабл на «телевизоре» страницы игры: свой маленький HTML (до 300 КБ) или стандартная мини-игра (auto = по жанру).
alter table public.games add column if not exists play_kind text not null default 'auto'
  check (play_kind in ('auto','arcade','music','shooter','puzzle','catch'));
alter table public.games add column if not exists play_html text check (play_html is null or char_length(play_html) <= 300000);
alter table public.games add column if not exists has_play boolean generated always as (play_html is not null) stored;
-- Новый вид предмета «Карты» (колода + две карты): расширяем проверку item. Повторный запуск безопасен.
alter table public.games drop constraint if exists games_item_check;
alter table public.games add constraint games_item_check check (item in ('cassette','cd','floppy','handheld','cards'));
-- Скриншот игры (JPEG data URL до ~150 КБ): «телевизор» на странице игры показывает его, пока игра не запущена.
alter table public.games add column if not exists shot_img text check (shot_img is null or char_length(shot_img) <= 150000);
alter table public.games add column if not exists has_shot boolean generated always as (shot_img is not null) stored;
-- Своя картинка для предмета «Карты» (JPEG: две карты игры рядом, левая — задняя, правая — передняя). Без неё карты берут середину обложки.
alter table public.games add column if not exists item_img text check (item_img is null or char_length(item_img) <= 150000);
alter table public.games add column if not exists has_iart boolean generated always as (item_img is not null) stored;

create table if not exists public.game_edits (
  id         uuid primary key default gen_random_uuid(),
  game_id    text   not null references public.games(id) on delete cascade,
  author_id  bigint not null,
  patch      jsonb  not null,                                  -- только разрешённые поля страницы
  status     text   not null default 'new' check (status in ('new','approved','rejected')),
  comment    text   not null default '' check (char_length(comment) <= 400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists game_edits_status_idx on public.game_edits (status, created_at desc);
create index if not exists game_edits_game_idx   on public.game_edits (game_id, author_id, created_at desc);

alter table public.games      enable row level security;
alter table public.game_edits enable row level security;
revoke all on public.games, public.game_edits from anon, authenticated;

-- Четыре встроенные игры (как были в коде). Уже существующие не трогаем.
insert into public.games (id, title, tags, description, changes, version, author_name, item, cover, tint, access, sort) values
 ('retro','Retro Mix','["Arcade"]','Аркадный микстейп из 90-х. Отбивайте мяч, разбивайте неоновые кирпичи и не давайте кассете остановиться.
Бета-версия: один бесконечный уровень, после каждой очищенной стены скорость растёт.','Скорость растёт после каждой стены
Новые неоновые кирпичи
Исправлено залипание платформы','0.3','Coopix','cassette','b:retro','{"h":318,"s":0.92}','public',10),
 ('space','Space Vibes','["Music"]','Космический синтовый джем. Попадайте по светящимся падам в такт падающим нотам и собирайте мелодию из ничего.
Бета-версия: один бесконечный трек, после пяти промахов песня заканчивается.','Ноты падают плавнее
Добавлен счётчик промахов
Исправлены задержки звука','0.3','Coopix','cd','b:space','{"h":222,"s":0.88}','public',20),
 ('toxic','Toxic Run','["Shooter"]','Шутер на пустоши. Ведите пальцем, пушка стреляет сама. Держитесь против токсичных черепов как можно дольше.
Бета-версия: пока без боссов и бонусов.','Пушка стреляет чаще
Черепа стали живее
Исправлен вылет на старых телефонах','0.3','Coopix','floppy','b:toxic','{"h":112,"s":0.62}','public',30),
 ('blocks','Block Drop','["Puzzle"]','Классические падающие блоки с закатным настроением. Складывайте, убирайте линии и бейте свой рекорд.
Бета-версия: пока без слота хранения и без призрачной фигуры.','Свайпы стали отзывчивее
Новые закатные цвета
Исправлен сброс фигуры','0.3','Coopix','handheld','b:blocks','{"h":38,"s":0.95}','public',40)
on conflict (id) do nothing;


-- =====================================================================================
-- «Спасибо автору»: поддержка игры звёздами Telegram (XTR). Пишет только вебхук бота (/api/bot) после успешной оплаты.
-- Повторный запуск безопасен.
-- =====================================================================================
create table if not exists public.thanks (
  id         uuid primary key default gen_random_uuid(),
  charge_id  text   not null unique,               -- telegram_payment_charge_id: один платёж = одна запись
  game_id    text   not null,
  from_id    bigint not null,
  author_id  bigint,                               -- автор на момент оплаты (null = игра проекта)
  stars      integer not null check (stars between 1 and 100000),
  created_at timestamptz not null default now()
);
create index if not exists thanks_game_idx on public.thanks (game_id);
alter table public.thanks enable row level security;
revoke all on public.thanks from anon, authenticated;

create or replace function public.thanks_stats(p_ids text[])
returns table (game_id text, stars bigint, backers bigint)
language sql stable
set search_path = public
as $$
  select t.game_id, sum(t.stars)::bigint, count(distinct t.from_id)::bigint
    from public.thanks t
   where t.game_id = any(p_ids)
   group by t.game_id
$$;
revoke all on function public.thanks_stats(text[]) from public, anon, authenticated;
grant execute on function public.thanks_stats(text[]) to service_role;


-- =====================================================================================
-- Моды игр: игрок предлагает мод (HTML-файл), админ или модератор одобряет. Повторный запуск безопасен.
-- =====================================================================================
create table if not exists public.game_mods (
  id          uuid primary key default gen_random_uuid(),
  game_id     text   not null references public.games(id) on delete cascade,
  author_id   bigint not null,
  author_name text   not null default '' check (char_length(author_name) <= 40),
  title       text   not null check (char_length(title) between 1 and 40),
  description text   not null default '' check (char_length(description) <= 400),
  version     text   not null default '1.0' check (char_length(version) <= 12),
  file_name   text   not null check (char_length(file_name) <= 100),
  file_html   text   not null,
  file_size   integer not null check (file_size between 1 and 1500000),
  status      text   not null default 'new' check (status in ('new','approved','rejected')),
  comment     text   not null default '' check (char_length(comment) <= 400),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists game_mods_game_idx   on public.game_mods (game_id, status, created_at desc);
create index if not exists game_mods_author_idx on public.game_mods (author_id, created_at desc);
alter table public.game_mods enable row level security;
revoke all on public.game_mods from anon, authenticated;


-- =====================================================================================
-- Покупки игроков (платные игры за звёзды Telegram — используется) и подписка Pro (заготовка).
-- Таблицы создаются заранее, чтобы потом подключить оплату без миграций. Повторный запуск безопасен.
-- =====================================================================================

-- Покупки: одна строка = один платёж (звёзды Telegram XTR или другая валюта).
create table if not exists public.purchases (
  id          uuid primary key default gen_random_uuid(),
  user_id     bigint not null references public.users(tg_id) on delete cascade,
  kind        text   not null check (kind in ('game','item','pro','other')),  -- что купили
  item_id     text   check (item_id is null or char_length(item_id) <= 64),  -- id игры/предмета (для pro не нужен)
  currency    text   not null default 'XTR' check (char_length(currency) between 2 and 8),
  amount      integer not null check (amount >= 0),                           -- сумма в единицах валюты (для XTR = звёзды)
  charge_id   text   unique,                                                  -- telegram_payment_charge_id: защита от двойной записи
  status      text   not null default 'paid' check (status in ('pending','paid','refunded','failed')),
  meta        jsonb  not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists purchases_user_idx on public.purchases (user_id, created_at desc);
create index if not exists purchases_item_idx on public.purchases (kind, item_id) where item_id is not null;

-- Подписка Pro: одна строка на игрока, продлевается сдвигом expires_at.
create table if not exists public.subscriptions (
  user_id     bigint primary key references public.users(tg_id) on delete cascade,
  plan        text   not null default 'pro' check (plan in ('pro')),
  status      text   not null default 'active' check (status in ('active','canceled','expired')),
  started_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  last_charge text,                                                           -- charge_id последнего платежа (см. purchases)
  auto_renew  boolean not null default false,
  updated_at  timestamptz not null default now()
);
create index if not exists subscriptions_exp_idx on public.subscriptions (expires_at) where status = 'active';

-- Как и всё остальное: доступ только у сервера (service_role), из браузера таблиц не видно.
alter table public.purchases     enable row level security;
-- Цена игры в звёздах Telegram: 0 = бесплатная. Платную нельзя запустить и скачать, пока игрок её не купил.
alter table public.games add column if not exists price integer not null default 0 check (price between 0 and 10000);
alter table public.subscriptions enable row level security;
revoke all on public.purchases, public.subscriptions from anon, authenticated;

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
-- Очередь «рандомной игры»: игры не повторяются, пока игрок не прошёл полный круг
alter table public.bot_users add column if not exists deck jsonb not null default '[]'::jsonb;
alter table public.bot_users add column if not exists last_game text not null default '';