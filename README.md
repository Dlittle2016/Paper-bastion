# Paper Bastion

A papercraft tower defense game. Eight towers, fifteen kinds of ink enemies, six maps, thirty waves plus an endless mode, a Daily Ink challenge, a Workshop of permanent perks, and an online leaderboard.

- `public/index.html` is the whole game (one self-contained file).
- `netlify/functions/scores.mts` is the leaderboard API at `/api/scores`, backed by Netlify Blobs.
  - `GET /api/scores?map=meadow&difficulty=standard` returns the top 25 (best run per player).
  - Daily Ink boards use `map=daily&difficulty=YYYY-MM-DD` (open for two days either side of today).
  - `POST /api/scores` with `{ name, map, difficulty, wave, won, lives, kills, runId }` records a run.

Pushing to `main` redeploys the site on Netlify.
