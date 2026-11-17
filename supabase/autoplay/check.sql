-- Проверка: какая версия игр сейчас в базе.
-- ok = новая (сразу геймплей); old = старая рабочая; BROKEN = файл обрезан (выполнена не вся загрузка) — выполните все части этой игры из supabase/autoplay.
select g.id, char_length(g.file_html) as len, e.new_len,
  case when char_length(g.file_html) = e.new_len then 'ok'
       when rtrim(g.file_html, E' \r\n\t') like '%</html>' then 'old'
       else 'BROKEN' end as state
from public.games g join (values ('gravity', 510596), ('metro', 445043), ('stickfight', 541547), ('unik', 1636436)) as e(id, new_len) on e.id = g.id
order by g.id;
