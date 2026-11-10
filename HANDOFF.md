# HANDOFF — Coopix Market

Стек: Vercel serverless (`api/`), Supabase (service_role только на сервере), один HTML-клиент `public/index.html`, админка `public/admin.html`. Тесты: `npm test` (node --test, нужен Node 20+).

## Готово и проверено
- Профиль: вкладки, один пост на игрока, чужие профили по аватару в отзывах (opaque pid), `synced` в ответе профиля (новое устройство подтягивает данные с сервера).
- Рейтинг из отзывов, счётчики «Играли/Скачали», журнал действий, график активности.
- Каталог игр: сервер (`api/_lib/games.js`, маршруты в `hub.js` и `core.js`), клиент (загрузка каталога, запуск HTML-игр в sandbox-iframe, «Мои игры» и правки автора), админка (вкладки «Игры» и «Правки», «Опубликовать в маркет» в заявке).
- Тесты: 57 из 60 проходят на in-memory store; клиент и админка прогнаны вручную в браузере против того же store (игрок, автор, модератор, главный админ).

## Исправлено при продолжении
- `hub.js`: локальная функция счётчиков называлась `gameWire` и затеняла импорт из `games.js` — список игр приходил без полей (это и были 3 падающих теста каталога). Переименована в `statsWire`.
- `store.saveGame` делал `upsert` с частью полей: в Postgres `INSERT … ON CONFLICT` проверяет NOT NULL (`title`) до конфликта, правка доступа/одобрение правок упали бы. Разделено на `createGame` (insert) и `updateGame` (update).
- id новой игры `g + время` совпадал у двух игр, созданных в одну миллисекунду; добавлен случайный хвост (`newGameId`).
- `index.html`: при окне 0×0 на старте `drawBg` бросал исключение и останавливал цикл анимации.

## Осталось
1. Выполнить `supabase/schema.sql` в Supabase (таблицы `games`, `game_edits` + 4 встроенные игры) и проверить на настоящем Postgres.
2. `npm install` (нужен `@vercel/functions`), тогда пройдут 3 теста в `tests/handlers.test.js`.
3. e2e (Playwright) на каталог — харнесс лежал вне проекта.

## Безопасность
RLS без политик, `revoke` у anon/authenticated, service_role только в env Vercel, авторизация по HMAC initData Telegram, сторонний HTML — только в iframe `sandbox="allow-scripts allow-pointer-lock"` без `allow-same-origin`.
