/**
 * Перехваты и рекорд серии игрока в игре: хранятся на сервере (таблица game_stats), игра присылает свои текущие значения.
 * Сервер копит: числа не уменьшаются, а рост ограничен по времени (не больше ~3 перехватов в секунду + запас), рекорд серии не больше числа перехватов.
 * Первая запись игрока в игре принимается почти как есть: так переносится прогресс, накопленный до появления серверного хранения.
 */

export const STATS_PUTS_PER_MIN = 30;
const TOTAL_MAX = 10_000_000, STREAK_MAX = 100_000, FIRST_MAX = 1_000_000;
const n = (v, hi) => Math.min(hi, Math.max(0, Number.isFinite(+v) ? Math.trunc(+v) : 0));

/** cur — строка из базы или null; req — {regrabs, best} от игры → { regrabs, best_streak } */
export function mergeGameStats(cur, req, now = Date.now()) {
  const rg = n(req?.regrabs, TOTAL_MAX), best = n(req?.best, STREAK_MAX);
  if (!cur) { const r = Math.min(rg, FIRST_MAX); return { regrabs: r, best_streak: Math.min(best, r) }; }
  const since = cur.updated_at ? Date.parse(cur.updated_at) : now;
  const sec = Math.max(0, Math.min(86400, (now - since) / 1000));
  const room = 50 + Math.floor(sec * 3);
  const regrabs = Math.max(Number(cur.regrabs) || 0, Math.min(rg, (Number(cur.regrabs) || 0) + room));
  const best_streak = Math.max(Number(cur.best_streak) || 0, Math.min(best, (Number(cur.best_streak) || 0) + room, regrabs));
  return { regrabs, best_streak };
}

export const statsWire = (r) => ({ regrabs: Number(r?.regrabs) || 0, best: Number(r?.best_streak) || 0 });
