# Coopix — заметки для разработки

Составлено 2026-11-24 по чтению кода и замерам. Дополняет, а не заменяет: [HANDOFF.md](HANDOFF.md) (хронология фич), [DEPLOY.md](DEPLOY.md) (деплой, безопасность), [public/README.txt](public/README.txt) (клиент). Здесь: карта проекта, команды, контракт «маркет ↔ игра», подводные камни и список оптимизаций.
По Пикселии подробно: [games/pixelia/NOTES.md](games/pixelia/NOTES.md).

Что проверено, а что нет, помечено в тексте. «Не проверял» значит, что утверждение взято из документов или из чтения кода.

## 1. Суть проекта

Coopix Market — Telegram Mini App: магазин мини-игр (каждая игра — один самодостаточный HTML-файл) с отзывами, профилями, модами, звёздами Telegram (XTR) и игровыми ботами.

- Один проект Vercel: статика `public/` + serverless `api/*.js` (Node ≥20, `maxDuration` 15 с).
- База: Supabase Postgres. Доступ только `service_role` с сервера, RLS включён без политик.
- Игра хранится в таблице `games` (`file_html`, плюс `play_html` для мини-версии на «телевизоре»). Клиент кэширует файл по хэшу в IndexedDB (`cpx-games`) и запускает его в `<iframe srcdoc sandbox="allow-scripts allow-pointer-lock">`.

## 2. Карта репозитория

| Путь | Что |
|---|---|
| `public/index.html` | Весь клиент в одном файле: 441 КБ, 3941 строка, ~196 функций, 14 тегов `<script>`, один большой `<style>`. Сборки нет |
| `public/admin.html` | Админка, 85 КБ, 803 строки |
| `public/assets/` | `config.js` (`SUB_API="/api"`), шрифты, музыка, `spr/*.png` (спрайты, кэш на год), `coopix-*.png` |
| `api/*.js` | Тонкие обёртки по ~13 строк: `getCore().handle({route, method, query, headers, body})` |
| `api/_lib/core.js` | Подпись и роли, `touch` (кэш 30 с), админ-маршруты (`edits, edit, mods, mod, webhook, resetbuys, games, game, publish, stats, users, user, bots, bot, broadcast, solo, site, news, wallet, team`) |
| `api/_lib/hub.js` | Маршруты игрока (`games, gamefile, sendgame, launch, savefile, playable, cover, mods, sendmod, modfile, mod, mymods, mymaps, mapget, mapput, mapdel, mystats, statput, myitems, itembuy, buy, thank, myedit, myedits, stats, reviews, avatars, tgphoto, profile, post, track, activity, feed`) |
| `api/_lib/store.js` | Слой доступа к Supabase (PostgREST), 354 строки |
| `api/_lib/{games,maps,mods,stats,items,thanks,pid,telegramAuth}.js` | Валидация и правила по областям. `items.js` **генерируется** (см. §4) |
| `api/_lib/widgets.js` + `widgets/*.html` | Мини-игры бота (11 штук). `widgets.js` генерируется `scripts/build-widgets.mjs` |
| `supabase/schema.sql` | Вся схема, идемпотентная (612 строк, 18 таблиц, функции `create_submission, touch_user, game_stats, activity_series, thanks_stats, bot_seen`). Отдельные `game_bot/game_maps/game_stats/stars_purchases.sql` уже включены в конец `schema.sql` |
| `supabase/autoplay/*.sql` | Устаревшая загрузка игр кусками через SQL Editor (3,2 МБ). Заменена `scripts/upload_games.py` |
| `scripts/` | Python: `build_pixelia`, `build_noomic_plus`, `publish_noomicbot/party4/snowrider`, `upload_games`, `run_sql`; Node: `build-widgets.mjs` |
| `tests/` | `node:test`, in-memory хранилище `mem.js` (225 строк). По `test(`/`it(` ≈ 107 тестов |
| `games/` | `gravity, metro, stickfight, unik, snowrider, party4, noomicbot, pixelia`. У каждой: HTML, `cover.jpg`, `shot.jpg`, `tv.html` (мини-версия) |
| `promo/` | Рекламный ролик, озвучка (`tts.mjs`, `vo.ps1`), `promo.zip` 1,2 МБ |

## 3. Команды и порядок выкладки

| Задача | Команда |
|---|---|
| Собрать Пикселию | `python scripts/build_pixelia.py` → `games/pixelia/Pixelia.html` |
| Собрать Noomic Bot | `python scripts/build_noomic_plus.py` (`--debug путь` — тестовая сборка) |
| Опубликовать Noomic Bot | `python scripts/publish_noomicbot.py` (нужен `.env.txt`) |
| Залить старые игры | `python scripts/upload_games.py [id]` (в словаре только gravity, metro, stickfight, unik) |
| Выполнить SQL | `python scripts/run_sql.py supabase/<файл>.sql` (нужен `SUPABASE_ACCESS_TOKEN` `sbp_…` в `.env.txt`) |
| Пересобрать мини-игры бота | `node scripts/build-widgets.mjs` |
| Тесты | `npm i && npm test` |
| Локальный просмотр (python) | `python -m http.server <порт> --bind 127.0.0.1 --directory <папка>`; конфиги в `.claude/launch.json`: 5180 noomicbot, 5181 pixelia/src, 5182 public |

Порядок выкладки: **SQL → деплой API и маркета → публикация игры.** Если цены или предметы поменялись, сначала деплой API.
`.env.txt` (в `.gitignore` по маске `.env.*`) содержит `SUPABASE_URL` и `SUPABASE_SERVICE_KEY`; значения не читал и не копировал.

## 4. Контракт «маркет ↔ игра» (важно для любой новой игры)

- **Нет `localStorage`.** Песочница без `allow-same-origin`: обращение к хранилищу бросает исключение. Решение в Noomic Bot — shim в начале `<head>` (`SHIM` в `scripts/build_noomic_plus.py`): `window.__CPX_SAVE` (стартовые данные) + `parent.postMessage({coopix:"save", data}, "*")` с задержкой 120 мс и сбросом при скрытии страницы.
- **Что маркет вставляет в игру:** `__CPX_LANG`, `__CPX_SAVE`, `__CPX_ITEMS` (купленное), `__CPX_STATS`, `__CPX_MAP` (карта из ссылки), `__CPX_TOP` / `__CPX_BOT` (высота интерфейса Telegram сверху и снизу).
- **Сообщения игры → маркет:** `coopix:"save" | "items" | "maps" | "stats"`; ответ приходит тем же `rid`. В коде клиента ещё встречаются `"market"` и `"filedone"`.
- **Telegram.WebApp** внутри игры недоступен. Всё, что нужно от Telegram, делает маркет.
- **Цены предметов** проверяет сервер по `api/_lib/items.js`; значение от клиента игнорируется.

Чеклист новой игры в магазине (по `publish_noomicbot.py`): поля строки `games` — `id, title, tags (до 3), description, changes, version, author_name, item (cassette|cd|floppy|handheld|cards), cover + cover_img (JPEG 512×512, ≤280 КБ в base64), shot_img, access (public|staff|off), sort, play_kind, play_html (≤300 КБ), file_html, dl_off, price`. Безопаснее сначала `access: "staff"` (видят только админы), потом `public`.

## 5. Подводные камни

- `build_noomic_plus.py` при каждом запуске **перезаписывает `api/_lib/items.js`** из `items.json`. Это не только сборка игры, но и правка серверной таблицы цен: после неё нужен деплой API.
- Сборка Noomic Bot держится на `assert s.count(якорь)==1` по строкам внутри `NoomicBot.base.html` (например `addEventListener("resize",resize);let W=new Game(MAPS)`). Любая правка этих строк в base ломает сборку.
- Править нужно `NoomicBot.base.html` и модули, но не собранный `NoomicBot.html` (1,49 МБ, он тоже в git и уходит в магазин).
- `public/assets/spr/*` отдаются с `immutable` на год: заменили картинку — переименуйте файл.
- Смена `BOT_TOKEN` ломает производные от него вещи: секрет вебхука `/api/bot` (переподключить кнопкой в админке) и ключ AES для публичных id профилей (старые ссылки на профили перестанут открываться). Не проверял, следует из `pid.js` и DEPLOY.md.
- Тесты гоняются на `tests/mem.js`, а не на настоящем Supabase. Расхождение `mem.js` и `store.js` тесты не поймают.
- Профили и отзывы встроенных игр общие; «свои карточки» в браузере остаются локальными (`localStorage`).

## 6. Находки при изучении (по важности)

1. **Пикселия уже в git и на GitHub, хотя память и HANDOFF говорят «локально, не публиковать».** Коммиты `2343e0a` (21.11) и `d9b000c` (24.11) содержат `games/pixelia/**`, оба есть в `origin/main` (`git status`: `main...origin/main`, без отставания). В магазин (таблица `games`) игра **не** загружена: нет ни записи в `scripts/upload_games.py`, ни `publish_*.py`. Репозиторий `github.com/MakamaBrat/Coopix`; публичный он или приватный, не проверял (`gh` не установлен).
2. **Нет Node.js на этой машине.** `npm test` и `build-widgets.mjs` запустить нельзя, `node_modules` нет. Конфиги `static` и `promo` в `.claude/launch.json` ведут на несуществующий `D:\Programs\Adobe Photoshop 25\node.exe`. Рабочие — только python-серверы. Тесты в этой сессии не запускались, цифры «68/70 проходят» из HANDOFF не перепроверены.
3. **Документы устарели:** HANDOFF «68/70 тестов», DEPLOY «51 тест», по коду ≈107. HANDOFF упоминает браузерные e2e (Playwright), которых в репозитории нет.
4. **Вес репозитория.** `.git` ≈ 110 МБ: 88,6 МБ — 1023 несжатых объекта, 19,3 МБ — pack. Тяжёлые блобы в истории: `games/noomicbot/vice_src/_preview.png` (3 МБ) и копия в `noomiclone/`, `public/_tmp_unik.html` (2,4 МБ), `SnowRider.html` + `SnowRider.orig.html` (по 2,8 МБ), десяток версий `NoomicBot.html` (по 2,3 МБ).
5. **Мёртвый и лишний код/ассеты:**
   - `public/assets/sprites.js` (697 КБ) нигде не подключён (в `index.html` осталась только ссылка в комментарии), но деплоится.
   - `games/noomicbot/vice.js` + `vice_assets.json` (≈845 КБ): в сборке отключены (`if False and …`).
   - `supabase/autoplay/*.sql` (3,2 МБ), `scripts/__pycache__/*.pyc` в git, `.gitignore` не знает про `__pycache__`.
   - `NoomicBot.base.html` (1,17 МБ) и собранный `NoomicBot.html` (1,49 МБ) лежат в git оба.
6. **Скрипты публикации — копипаста.** `publish_noomicbot.py`, `publish_party4.py`, `publish_snowrider.py` почти одинаковы (строка `games`, `req`, `env`). `upload_games.py` знает только 4 игры из 8.
7. **Не проверено:** выставлен ли в Vercel регион функций = регион Supabase (HANDOFF называет это «самым заметным», что оставалось сделать).
8. **Мелочи:** `.claude/launch.json` содержит абсолютные пути этой машины; `preview_start` не находит его, если сессия запущена из подпапки (`games/pixelia`), потому что файл лежит в корне.

## 7. Бэклог оптимизаций разработки

Лёгкие (минуты):
- Установить Node ≥20, прогнать `npm i && npm test`, обновить числа в HANDOFF/DEPLOY.
- Добавить в `.gitignore`: `__pycache__/`, `*.pyc`; убрать `scripts/__pycache__` из индекса (`git rm --cached`).
- Починить `.claude/launch.json`: убрать или поправить конфиги с Photoshop-node; при необходимости положить копию `launch.json` в `games/pixelia/.claude/`.
- Удалить мёртвое после подтверждения владельцем: `public/assets/sprites.js`, `vice.js` + `vice_assets.json`, `supabase/autoplay/`.
- `git gc --prune=now` (не меняет историю, обычно сильно уменьшает объём из-за 1023 несжатых объектов; эффект не проверял).

Средние (час-два):
- Один `scripts/publish_game.py <id>` с манифестом на игру (`games/<id>/game.json`: id, title, tags, sort, flags, пути к cover/shot/tv/файлу) вместо трёх копий; `upload_games.py` читает те же манифесты.
- Общий модуль «CPX-мост» для игр (shim `localStorage`, чтение `__CPX_*`, `postMessage`) в одном месте. Сейчас он только внутри сборки Noomic Bot и нужен Пикселии.
- Одна команда `python scripts/build_all.py` (Пикселия, Noomic Bot, виджеты) с проверкой, что собранные файлы совпадают с закоммиченными.
- Smoke-проверка игр в браузере (запуск, 600 шагов, отсутствие исключений) — как хотя бы одна автоматизированная проверка для `games/*`.

Тяжёлые (по необходимости):
- Разрезать `public/index.html` (441 КБ, `no-cache`): CSS и JS в файлы с хэшем в имени и годовым кэшем. Ломает принцип «без сборки», поэтому только при реальных жалобах на старт.
- Чистка истории (`git filter-repo`) под тяжёлые блобы — только если важен размер клона; при наличии `origin` это переписывание публичной истории, решать владельцу.
- Интеграционные тесты `store.js` против настоящей (тестовой) базы Supabase.

## 8. Открытые вопросы владельцу

- Пикселия: оставить код в GitHub как есть (уже запушен) или это нежелательно? Публиковать в магазин пока нельзя (прежнее указание владельца), какие шаги нужны до публикации — в [games/pixelia/NOTES.md](games/pixelia/NOTES.md).
- Ставить ли Node на эту машину, чтобы гонять тесты и сборку виджетов.
- Можно ли удалять мёртвые файлы из п. 6.5.
