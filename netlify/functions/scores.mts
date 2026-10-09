import { getStore } from "@netlify/blobs";
import type { Config, Context } from "@netlify/functions";

// One blob per player per board holds that player's best run:
//   best/<map>/<difficulty>/<player key>
// Every accepted post is also logged once under runs/... (append-only) so
// scores can be audited or rebuilt. No counters or read-modify-write state.

const MAPS = ["meadow", "loop", "twin", "spiral", "ring", "cut"];
const DIFFS = ["casual", "standard", "brutal"];
const NAME_RE = /^[\p{L}\p{N} _.'!-]{1,16}$/u;
const TOP_N = 25;

type Best = { name: string; wave: number; won: boolean; lives: number; kills: number; at: string };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const store = () => getStore({ name: "leaderboard", consistency: "strong" });
const boardPrefix = (map: string, diff: string) => `best/${map}/${diff}/`;
const playerKey = (name: string) => encodeURIComponent(name.toLowerCase());

// Higher wave wins; ties go to more lives left, then to whoever got there first.
const better = (a: Best, b: Best) =>
  a.wave !== b.wave ? a.wave > b.wave : a.lives !== b.lives ? a.lives > b.lives : a.at < b.at;

async function loadBoard(map: string, diff: string): Promise<Best[]> {
  const s = store();
  const { blobs } = await s.list({ prefix: boardPrefix(map, diff) });
  const rows = await Promise.all(blobs.map((b) => s.get(b.key, { type: "json" }) as Promise<Best | null>));
  return rows
    .filter((r): r is Best => !!r)
    .sort((a, b) => (better(a, b) ? -1 : better(b, a) ? 1 : 0));
}

function readBoardParams(map: unknown, diff: unknown): { map: string; diff: string } | string {
  if (typeof map !== "string" || !MAPS.includes(map)) return "Unknown map.";
  if (typeof diff !== "string" || !DIFFS.includes(diff)) return "Unknown difficulty.";
  return { map, diff };
}

const isInt = (v: unknown, lo: number, hi: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= lo && v <= hi;

export default async (req: Request, _context: Context) => {
  try {
    if (req.method === "GET") {
      const url = new URL(req.url);
      const p = readBoardParams(url.searchParams.get("map"), url.searchParams.get("difficulty"));
      if (typeof p === "string") return json({ error: p }, 400);
      const rows = (await loadBoard(p.map, p.diff)).slice(0, TOP_N);
      return json({ rows: rows.map(({ name, wave, won, lives, at }) => ({ name, wave, won, lives, at })) });
    }

    if (req.method === "POST") {
      let body: Record<string, unknown>;
      try {
        body = await req.json();
      } catch {
        return json({ error: "Send the score as JSON." }, 400);
      }
      const p = readBoardParams(body.map, body.difficulty);
      if (typeof p === "string") return json({ error: p }, 400);

      const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
      if (!NAME_RE.test(name)) {
        return json({ error: "Names can be 1 to 16 letters, numbers, spaces and . _ ' ! -" }, 400);
      }
      if (!isInt(body.wave, 1, 999)) return json({ error: "That wave number doesn't look right." }, 400);
      if (!isInt(body.lives, 0, 99)) return json({ error: "That lives count doesn't look right." }, 400);
      if (!isInt(body.kills, 0, 1_000_000)) return json({ error: "That kill count doesn't look right." }, 400);
      const won = body.won === true && body.wave >= 30;
      const runId = typeof body.runId === "string" ? body.runId.slice(0, 24).replace(/[^a-z0-9]/gi, "") : "";

      const run: Best = { name, wave: body.wave, won, lives: body.lives, kills: body.kills, at: new Date().toISOString() };
      const s = store();
      const key = boardPrefix(p.map, p.diff) + playerKey(name);
      const prev = (await s.get(key, { type: "json" })) as Best | null;
      const isBest = !prev || better(run, prev);
      if (isBest) await s.setJSON(key, run);
      await s.setJSON(`runs/${p.map}/${p.diff}/${run.at}-${runId || Math.random().toString(36).slice(2, 10)}`, run);

      const board = await loadBoard(p.map, p.diff);
      const mine = board.findIndex((r) => playerKey(r.name) === playerKey(name));
      return json({ rank: mine + 1, total: board.length, best: isBest });
    }

    return json({ error: "Use GET to read scores or POST to add one." }, 405);
  } catch (err) {
    console.error("scores function failed", err);
    return json({ error: "The scoreboard hit a problem. Try again in a moment." }, 500);
  }
};

export const config: Config = {
  path: "/api/scores",
  method: ["GET", "POST"],
};
