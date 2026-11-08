App Market: static one-page site, no build step.

Deploy to Vercel: drag this folder onto vercel.com/new, or run `npx vercel` inside it.
Local preview: `npx serve` in this folder.

index.html         the whole page (HTML, CSS, JS)
assets/sprites.js  sprites cut from the monochrome sheet, inlined as data URIs
assets/sprites/    the same sprites as PNG
assets/fonts/      Pixelify Sans (self-hosted)

App page: tap a card to open it. It has a CRT TV with a noise filter (knob on the right)
running a micro beta of the game, description, reviews (stored in localStorage) and a Play button.
The game is picked by genre: Arcade=breakout, Music=pads, Shooter=shooter, Puzzle=blocks, other=catch.
Description is editable in the card editor (pencil).

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
