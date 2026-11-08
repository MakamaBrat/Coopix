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
