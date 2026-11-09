App Market: static one-page site, no build step.

Deploy to Vercel: drag this folder onto vercel.com/new, or run `npx vercel` inside it.
Local preview: `npx serve` in this folder.

index.html         the whole page (HTML, CSS, JS)
assets/sprites.js  sprites cut from the monochrome sheet, inlined as data URIs
assets/sprites/    the same sprites as PNG
assets/fonts/      Pixelify Sans (self-hosted)

App page: tap a card to open it. It has a CRT TV with a noise filter (knob on the right)
running a micro beta of the game, description, reviews (stored in localStorage) and a Play button.
The game is picked by the first matching tag: Arcade=breakout, Music=pads, Shooter=shooter, Puzzle=blocks, other=catch.
Description is editable in the card editor (pencil).
Editor: preview, header and buttons stay fixed, only the middle scrolls. Gadget and Background are dropdown menus.
Tags: up to 3 per card (type + Enter / comma, or tap a suggestion). The first tag is the main genre and picks the game.

Performance: Settings > Quality (Auto / High / Mid / Low). Auto picks a tier from device hints
(Save-Data, memory, cores) and steps down by itself if the frame rate stays low.
Cards render the shader at reduced resolution and 30 fps (15 on Low), pause everything off-screen,
and the app underneath is frozen while an app page is open.

Compatibility: the app page has an explicit solid background and the main app is hidden behind it,
and CSS has fallbacks for browsers without color-mix() / inset. WebGL contexts are created only for
cards near the viewport and released when far away.

Card backgrounds (Settings > Card background, or per card in the editor > Background):
Waves, Mosaic (cover tiles scroll), Sunset (cover inside the sun), Rain (streaks take cover colours).
Mix = each card gets its own by id. All four read the game cover, squeezed to a 32x32 texture.

Lite mode (quality Low): shader, stars, sheen, glow, particles, noise and animations are off, cards
use a flat static gradient. Auto turns it on at once for weak phones: Save-Data, <=2 GB RAM, <=2 cores,
old WebView (no aspect-ratio, Chrome < 88), software or very old GPU, no WebGL. It also switches on by
itself if the frame rate stays low (a toast tells the user), and the choice is remembered.

Branding: the header shows the Coopix Market logo and the pigeon mascot (assets/coopix-pigeon.png).
The pigeon hops, its goggles glint, the bag screen blinks, and a tap makes it jump with confetti. Lite mode turns the motion off.
The small planet sits behind its wing; to remove it, delete the <canvas id="planet"> line in index.html.

Front page (Home): first tab in the bottom dock, opens by default. It is a one-screen title screen (no scrolling):
gadgets, headline "Быстрые офлайн игры с Мультиплеером", button "Перейти в маркет" (goes to Store),
a swipeable news slider (autoplay, dots) and two buttons (Канал / Чатик).
On short phones extras (tag chips, sponsors row) are hidden instead of scrolling.
News: NEWS array in index.html (search "NEWS="): c = tag colour, app:"card id" makes the item open that app page.
Sponsors: SPONSORS array. Links: LINKS object (replace the placeholder t.me URLs with the real ones).
Search bar (#sbar) sits above the card list in Store: it hides non-matching cards by title / tags without rebuilding them. Dock is now: Home, Store, Community (trophy icon), Profile. Store tabs: Home, Games, Favorites (heart, was Music), Mine, Settings. Heart on every card and on the app page toggles a favorite (saved in the card data as fav).

Club tab (title "Community", buttons Канал / Чатик): big slogan "Игру может сделать каждый" (.cl-hero), closed channel, closed chat, Boosty button, the "Зачем закрытый канал?" text and the sponsors list with
short messages (SPONSORS[].msg). Links live in LINKS (search "LINKS="): pchannel / pchat = invite links to the
closed channel and chat, boosty = Boosty page. All three are placeholders, replace them with the real URLs.
Tapping a sponsor chip on Home opens the Club tab.

Font: UI uses Tektur (assets/fonts/tektur-*.woff2: 500 for regular, 700 for headings, latin + cyrillic). Pixelify Sans stays for the logo only.
