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

- `KNOWLEDGE.md` lists every map, tower, enemy and system with the job it does. Read it before planning, and keep it current.
- Replacing is allowed. If a new tower, enemy, map or twist does an existing one's job better, or makes it redundant, retire the old one in the same update: remove it from `ORDER`, the waves, the menus or the twist list (and from the server's `MAPS` list for a map), and record its id under "Retired ids" in `KNOWLEDGE.md` with the reason. Reworking an existing piece in place is often better than retiring it.
- Never reuse a retired id, and never change what an existing id means to something unrelated: saved bests and leaderboard boards are keyed by map id.
- Keep at least six maps and eight towers, and don't retire more than one map per update.
- Balance target with the bots (abilities on): Standard winnable on every map by the `full`, `ok` and `neo` plans; Brutal hard (roughly 0-7 wins in 27 runs per plan); single-tower spam strategies should not win. Bot plans live in `src/bot.js`; update them when towers change.
- New towers need a sprite in `drawTower`, a colour in `TC`, a `statLine` entry, and a place in `ORDER` (keys are `1234567890-`, so more than 11 towers needs a new key scheme or a retirement).
- New enemies need a colour in `EC`, a shape in `drawEnemy` and a `tip`. New maps need a theme in `THEMES`, a music entry in the `MM` table in ui.js, and their id added to the server's `MAPS` list.
