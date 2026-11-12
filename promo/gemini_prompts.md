# Coopix Market — рилс «Апокалипсис»: промпты для Gemini (Veo)

10 клипов по 6–8 секунд, вертикально **9:16**, без звука (озвучка и музыка уже в ролике `promo/reel.html`).
Каждый клип заменяет или «украшает» сцену ролика (`c1…c8`). Генерируйте каждый клип отдельно, прикладывая указанные референсы.

> Как пользоваться: в Gemini выберите генерацию видео (Veo), формат 9:16, длительность 8 с.
> Сначала вставьте **СТИЛЬ-ГИД** (общий блок ниже), затем промпт клипа. Приложите картинки из колонки «Референсы».
> Экраны телефона в генерации часто «плывут» (буквы, интерфейс). Поэтому в клипах телефон светится, а настоящий интерфейс маркета
> мы накладываем в монтаже поверх экрана (кадры уже есть в `promo/shots/`).

---

## СТИЛЬ-ГИД (вставлять в начало каждого промпта)

```
STYLE BIBLE — keep identical in every shot:
Stylized 3D animation, low-poly toy-like look, soft global illumination, cinematic but playful, Pixar-meets-indie-game.
World: post-apocalyptic ruined city at dusk, burnt orange-red sky, drifting ash particles, broken concrete buildings with dark empty windows, a burnt car on its side with small flames, rubble on cracked asphalt. Color palette: rust red, ember orange, deep purple shadows, with cool cyan phone glow as the only clean light.
Characters are STICK FIGURES with thick cylinder limbs and big round white heads with two black dot eyes (no mouth unless stated):
 • HERO: blue hoodie torso, dark grey legs, red knit beanie with a pom-pom, red scarf, holds a black smartphone whose screen glows cyan.
 • SEREGA (friend): green jacket torso, dark grey legs, black knit beanie, brown backpack, carries a metal water bucket.
Camera: smooth, purposeful moves; shallow depth of field; vertical 9:16 framing with subjects centered in the middle third (top 15% kept free for subtitles).
No text, no logos, no watermarks, no readable letters anywhere in the frame. No real brands. No gore.
```

**Негатив (если есть поле «negative prompt»):**
`text, letters, subtitles, captions, logos, watermark, realistic humans, photorealistic faces, gore, blood, extra limbs, distorted hands, flickering, low resolution, horizontal frame`

---

## Клип 1 — Хук: «Апокалипсис» (сцена c1, 0:00–0:04)
**Референсы:** `promo/shots/` не нужны; можно приложить скрин из ролика (сцена c1) как стиль.
```
[STYLE BIBLE]
Shot: epic slow aerial drone descent over the ruined burning city at dusk, ash falling, distant smoke columns, a huge low red sun behind skyscraper skeletons. The camera glides down a ruined street and settles on the HERO standing alone in the middle of the street, looking at his glowing phone. A low battery warning makes the phone screen pulse red twice. Wind moves his scarf. Mood: dramatic, but slightly comedic. 8 seconds, ends on a medium shot of the HERO.
```

## Клип 2 — Звонкий кадр батареи (вставка в c1)
**Референсы:** нет.
```
[STYLE BIBLE]
Shot: extreme close-up macro of the HERO's gloved hand holding the smartphone; the screen shows only a big red battery icon blinking (no numbers, no text). Ash flakes land on the screen and slide off. Subtle camera push-in, shallow depth of field, cinematic tension. 5 seconds.
```

## Клип 3 — «Пока ловит» (сцена c2)
**Референсы:** `promo/shots/market.jpg` (как подсказка цвета и неоновых карточек на экране).
```
[STYLE BIBLE]
Shot: the HERO climbs onto a pile of rubble and raises the phone high toward the sky, desperately searching for signal; a tiny bar of signal appears as a cyan glow pulse. Low-angle hero shot against the red sky, dramatic backlight. He taps the screen with his thumb; a burst of cyan light comes from the screen. The phone screen shows abstract colorful neon game cards (purple, cyan, pink, orange), no readable text. 8 seconds.
```

## Клип 4 — «Скачать все игры» — загрузка (сцена c2→c3)
**Референсы:** `promo/shots/market.jpg`.
```
[STYLE BIBLE]
Shot: close-up over the HERO's shoulder: from the glowing phone, four small glowing 3D game cartridges fly OUT of the screen one after another — a cyan handheld console, a stack of playing cards, a red floppy disk, an orange game cartridge — they orbit the phone once and dive back INTO the screen like a download. Each one leaves a neon trail. Satisfying, magical, "loot collected" vibe. 7 seconds.
```

## Клип 5 — «Интернет больше не нужен» (сцена c3)
**Референсы:** нет.
```
[STYLE BIBLE]
Shot: the HERO switches airplane mode — a holographic airplane icon floats up from the phone screen, the last signal tower in the background sparks and its lights go dark one by one. The HERO shrugs, unbothered, and sits down on a broken concrete block with the phone glowing. Comedic timing: the tower collapses softly behind him and he doesn't even look. 8 seconds.
```

## Клип 6 — Экшен-переход в игру (начало c4)
**Референсы:** `promo/shots/sf1.jpg`, `promo/shots/sf2.jpg` (как стиль игры: стикмены, снежный город, деревянный дом).
```
Stylized 2D-to-3D transition. Camera dives INTO the glowing phone screen and emerges inside the game world: a snowy minimalist city with grey block buildings and a wooden house on a hill, flat pastel colors, clean vector look. A black stick figure with a red headband does a slow-motion flying jump kick toward two olive-green zombie stick figures, small debris particles burst on impact, camera orbits around the frozen moment (bullet-time), then speeds back up. Dynamic, epic, playful. No text, no UI. Vertical 9:16, 8 seconds.
```

## Клип 7 — Мультиплеер по Wi-Fi (c4)
**Референсы:** `promo/shots/net.jpg` (экран «Игра по сети»).
```
[STYLE BIBLE]
Shot: night falls; the HERO and three other survivors (stick figures in different colored hoodies: yellow, purple, orange) sit in a circle around a small campfire inside a ruined building, each holding a glowing phone. Thin cyan holographic Wi-Fi waves connect all the phones in a ring, pulsing like a heartbeat. They all react at the same moment (lean forward, cheer). Cozy, funny, "the end of the world but we're gaming" vibe. Slow orbit around the circle. 8 seconds.
```

## Клип 8 — «Серёга пошёл за водой» (сцена c5)
**Референсы:** скрин сцены c5 из ролика (как внешний вид SEREGA).
```
[STYLE BIBLE]
Shot: wide shot. SEREGA with his backpack and metal bucket walks heroically past the HERO, who sits on a concrete block playing on his phone. SEREGA stops, glances curiously at the glowing screen over the HERO's shoulder… the camera slowly pushes in on SEREGA's face as the cyan light reflects in his eyes. He freezes, mesmerized. Comedic slow push-in. 8 seconds.
```

## Клип 9 — «Не дошёл… прошла неделя» (сцена c6)
**Референсы:** скрин сцены c6/c7 из ролика.
```
[STYLE BIBLE]
Shot: locked-off timelapse. The HERO and SEREGA sit side by side on the rubble, staring at their glowing phones, not moving. The bucket lies tipped over next to them. Around them time races: sun and moon whip across the sky several times, day-night lighting flickers, dust and leaves pile up on their shoulders, a spider web grows between them, plants sprout from the cracks. Their bodies gradually turn into cartoon skeletons (white bones, still wearing the beanies and scarf), still holding the glowing phones. Funny, not scary. 8 seconds.
```

## Клип 10 — Панчлайн и концовка (сцены c7–c8)
**Референсы:** `promo/shots/lose.jpg` (экран «ТЫ ПРОИГРАЛ» — для монтажа поверх экрана).
```
[STYLE BIBLE]
Shot: slow cinematic push-in on two cartoon skeletons sitting side by side in the ruins at dusk, wearing a red beanie and a black beanie, holding phones whose screens still glow cyan. A crow lands on SEREGA's skull, looks at the phone screen, and also freezes, mesmerized. Dust motes float in the warm light. Gentle comedic beat. The last second: camera tilts up to the red sky where the ash swirls into a glowing purple-cyan neon star burst (abstract, no letters) for the logo to appear later in edit. 8 seconds.
```

---

## Куда вставлять в монтаже

| Клип | Сцена ролика | Время | Поверх наложить |
|---|---|---|---|
| 1 | c1 | 0:00–0:04 | титры «АПОКАЛИПСИС / СВЯЗИ НЕТ / ЗАРЯДА 7%» |
| 2 | c1 | вставка 1 с | плашка батареи 7% |
| 3 | c2 | 0:04–0:07 | экран: `market.jpg` + кнопка «СКАЧАТЬ ВСЕ ИГРЫ» (из ролика) |
| 4 | c2→c3 | вставка 2 с | — |
| 5 | c3 | 0:07–0:10 | экран: файлы от бота (из ролика) |
| 6 | c4 | 0:10–0:12 | затем настоящие кадры `sf1/sf2/unik/gravity` |
| 7 | c4 | 0:13–0:15 | вставка `net.jpg` (экран Wi-Fi) |
| 8 | c5 | 0:15–0:17 | «СЕРЁГА ПОШЁЛ ЗА ВОДОЙ» |
| 9 | c6 | 0:17–0:20 | «НЕ ДОШЁЛ… ПРОШЛА НЕДЕЛЯ» |
| 10 | c7–c8 | 0:20–0:27 | экран `lose.jpg`, затем карточка COOPIX MARKET |

Советы:
- Генерируйте каждый клип 2–3 раза и берите лучший дубль; если персонаж «поплыл», добавьте в промпт `consistent character, same outfit as described`.
- Клипы режьте под ритм озвучки: в рилсе склейка каждые 0,6–1,5 с.
- Если Veo нарисует на экране буквы — закройте экран в монтаже кадром из `promo/shots/`.

## Референсы (приложить файлы из проекта)
- `promo/shots/market.jpg` — список игр маркета
- `promo/shots/net.jpg` — экран «Игра по сети» (Wi-Fi)
- `promo/shots/sf1.jpg`, `sf2.jpg`, `sf3.jpg` — геймплей Stick Fight
- `promo/shots/unik.png` — геймплей UNIK
- `promo/shots/gravity.png` — геймплей Gravity Fight
- `promo/shots/lose.jpg` — «ТЫ ПРОИГРАЛ»
- `promo/shots/home.jpg` — главный экран маркета
- Скрины сцен ролика (персонажи и мир): откройте `promo/reel.html` и сделайте снимки экрана на 0:02, 0:16, 0:18 и 0:21
