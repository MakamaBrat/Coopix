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
