"""Встраивает переводы (i18n/ui.js, i18n/content.js) и выбор языка в games/party4/src/index.html.
Повторный запуск обновляет блок между /*I18N_DATA*/ и /*I18N_END*/ (словари можно править и запускать снова)."""
import os
NL, CR = chr(10), chr(13)
D = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(os.path.dirname(D), "src", "index.html")
s = open(p, encoding="utf-8", newline="").read()
CRLF = (CR + NL) in s
s = s.replace(CR + NL, NL)
ui = open(os.path.join(D, "ui.js"), encoding="utf-8").read()
content = open(os.path.join(D, "content.js"), encoding="utf-8").read()

def rep(a, b, cnt=1):
    global s
    assert s.count(a) == cnt, (a[:80], s.count(a))
    s = s.replace(a, b)

runtime = """
const LANGS = { ru: 'RU', uk: 'UA', en: 'EN' };
const pickLang = c => { c = String(c || '').toLowerCase(); return c.startsWith('uk') ? 'uk' : /^(ru|be|kk)/.test(c) ? 'ru' : c ? 'en' : ''; };
/* язык: сохранённый выбор игрока, иначе язык Telegram (передаёт магазин), иначе язык телефона */
let LANG = (S.lang && LANGS[S.lang]) ? S.lang : (pickLang(window.__CPX_LANG) || pickLang(navigator.language) || 'ru');
const TRMAP = { uk: new Map(), en: new Map() };
I18N_UI.forEach(([r, u, e]) => { TRMAP.uk.set(r, u); TRMAP.en.set(r, e); });
const CYR = /[А-Яа-яЁё]/;
function trText(t) {
  if (LANG === 'ru' || !t) return t;
  const k = t.trim(); if (!k || !CYR.test(k)) return t;
  let v = TRMAP[LANG].get(k);
  if (v == null && / ·$/.test(k)) { const w = TRMAP[LANG].get(k.slice(0, -2)); if (w != null) v = w + ' ·'; }
  if (v == null) for (const [rx, u, e] of I18N_RX) if (rx.test(k)) { v = k.replace(rx, LANG === 'uk' ? u : e); break; }
  return v == null ? t : t.replace(k, v);
}
const trOne = n => { const pn = n.parentNode; if (!pn || pn.nodeName === 'SCRIPT' || pn.nodeName === 'STYLE') return; const v = trText(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; };
function trNode(root) {
  if (LANG === 'ru' || !root) return;
  if (root.nodeType === 3) { trOne(root); return; }
  if (root.nodeType !== 1 || root.nodeName === 'SCRIPT' || root.nodeName === 'STYLE') return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; const list = [];
  while ((n = w.nextNode())) list.push(n);
  list.forEach(trOne);
  [root, ...root.querySelectorAll('[placeholder],[aria-label],[title],[alt]')].forEach(el => { for (const a of ['placeholder', 'aria-label', 'title', 'alt']) { const v = el.getAttribute && el.getAttribute(a); if (v && CYR.test(v)) { const t = trText(v); if (t !== v) el.setAttribute(a, t); } } });
}
const RU0 = { TRUTH: TRUTH.slice(), DARE: DARE.slice(), LOCS: LOCS.map(l => l[1]), TOPICS: TOPICS.slice(), LETTERS, ELIAS_W: ELIAS_W.slice(), CROC: { e: CROC_W.e.slice(), m: CROC_W.m.slice(), h: CROC_W.h.slice() } };
function setContent() {
  const c = LANG === 'ru' ? null : I18N_CONTENT[LANG], put = (arr, src) => arr.splice(0, arr.length, ...src);
  put(TRUTH, c ? c.TRUTH : RU0.TRUTH); put(DARE, c ? c.DARE : RU0.DARE); put(TOPICS, c ? c.TOPICS : RU0.TOPICS);
  LOCS.forEach((l, i) => { l[1] = (c ? c.LOCS : RU0.LOCS)[i] || l[1]; });
  LETTERS = c ? c.LETTERS : RU0.LETTERS; put(ELIAS_W, c ? c.ELIAS_W : RU0.ELIAS_W);
  for (const k of ['e', 'm', 'h']) put(CROC_W[k], c ? c.CROC_W[k] : RU0.CROC[k]);
}
function setLang(l) { if (!LANGS[l]) return; LANG = l; S.lang = l; save(); document.documentElement.lang = l; setContent(); G.deck = null; render(); trNode(document.body); }
A.lang = d => setLang(d.l);
new MutationObserver(ms => { if (LANG === 'ru') return; for (const m of ms) { if (m.type === 'characterData') trOne(m.target); else m.addedNodes.forEach(trNode); } })
  .observe(document.body, { subtree: true, childList: true, characterData: true });
document.documentElement.lang = LANG; setContent();
"""
block = "/*I18N_DATA*/" + NL + ui + NL + content + NL + runtime + "/*I18N_END*/" + NL
if "/*I18N_DATA*/" in s:
    a = s.index("/*I18N_DATA*/"); b = s.index("/*I18N_END*/") + len("/*I18N_END*/") + 1
    s = s[:a] + block + s[b:]
else:
    rep("const LETTERS = 'АБВГДКЛМНОПРСТЧШ';", "let LETTERS = 'АБВГДКЛМНОПРСТЧШ';")
    # блок — перед первым вызовом render() в самом конце скрипта
    tail = "document.addEventListener('visibilitychange', () => { if (!document.hidden && isGame(route)) lockScreen(); });" + NL + "render();"
    rep(tail, "document.addEventListener('visibilitychange', () => { if (!document.hidden && isGame(route)) lockScreen(); });" + NL + block + "render();")
    # выбор языка на главной — над плитками игр
    rep('<div class="hcol right"><div class="gcards">',
        '<div class="hcol right"><div class="langs" role="radiogroup" aria-label="Язык">${Object.entries(LANGS).map(([k, v]) => `<button type="button" data-a="lang" data-l="${k}" class="${LANG === k ? \'on\' : \'\'}">${v}</button>`).join(\'\')}</div><div class="gcards">')
    css = """/*LANGS*/
.langs{display:flex;justify-content:center;gap:6px;margin:4px auto 2px;padding:4px;width:max-content;border-radius:999px;background:#0e0804cc;border:1px solid #5a3c1c}
.langs button{min-width:46px;height:30px;padding:0 12px;border:0;border-radius:999px;background:none;color:#c9a774;font:900 13px "Nunito",sans-serif;letter-spacing:.5px;cursor:pointer}
.langs button.on{background:linear-gradient(#f6c46a,#d8862a);color:#2b1707}
"""
    rep("/*HLINKS*/", css + "/*HLINKS*/")
out = s.replace(NL, CR + NL) if CRLF else s
open(p, "w", encoding="utf-8", newline="").write(out)
print("ok")
