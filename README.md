# Paper Bastion

A papercraft tower defense game: eleven towers, twenty kinds of ink enemies, nine maps, thirty waves plus an endless mode, a Daily Ink challenge, a Workshop of permanent perks, and an online leaderboard. Live at https://paper-bastion.netlify.app

## Layout

- `src/core.js` is the game engine: towers, enemies, waves, maps, difficulties, Daily Ink twists. Pure logic, also loads in Node.
- `src/ui.js` holds drawing, sound, music, menus and input. `src/shell.html` holds the page markup and CSS.
- `src/build.js` builds `public/index.html` (`node src/build.js`). Never edit `public/index.html` by hand.
- `src/bot.js` is a balance-test bot: `node -e "const b=require('./src/bot.js'); b.table(['full','ok','neo','mixed'], [{abil:true}], 3)"`.
- `netlify/functions/scores.mts` is the leaderboard API at `/api/scores`, backed by Netlify Blobs. The `MAPS` list in it must contain every map id in `src/core.js`.
  - `GET /api/scores?map=meadow&difficulty=standard` returns the top 25 (best run per player).
  - Daily Ink boards use `map=daily&difficulty=YYYY-MM-DD`.
  - `POST /api/scores` with `{ name, map, difficulty, wave, won, lives, kills, runId }` records a run.
- `CHANGELOG.md` records every update, newest first.

Pushing to `main` redeploys the site on Netlify.

## Ground rules for updates

- Never remove or rename a map id, tower kind or enemy type: saved bests, Workshop perks and leaderboard boards depend on them.
- Balance target with the bots (abilities on): Standard winnable on every map by the `full`, `ok` and `neo` plans; Brutal hard (roughly 0-7 wins in 27 runs per plan); single-tower spam strategies should not win.
- New towers need a sprite in `drawTower`, a colour in `TC`, a `statLine` entry, and a place in `ORDER` (keys are `1234567890-`, so more than 11 towers needs a new key scheme).
- New enemies need a colour in `EC`, a shape in `drawEnemy` and a `tip`. New maps need a theme in `THEMES`, a music entry in the `MM` table in ui.js, and their id added to the server's `MAPS` list.
