const TD = require(require('path').join(__dirname, 'core.js'));
const { Game, TOWERS } = TD;

function samples(g) {
  const pts = [], o = {};
  for (const p of g.paths) for (let d = 0; d <= p.total; d += .25) { TD.posAt(p, d, o); pts.push([o.x, o.y]); }
  pts.fly = [];
  for (const p of g.flyPaths) for (let d = 0; d <= p.total; d += .25) { TD.posAt(p, d, o); pts.fly.push([o.x, o.y]); }
  return pts;
}
function coverage(pts, c, r, range) {
  let n = 0; const x = c + .5, y = r + .5, r2 = range * range;
  for (const p of pts) if ((p[0] - x) ** 2 + (p[1] - y) ** 2 <= r2) n++;
  return n;
}
// mode: null = best tile, 'ok' = decent but noisy, 'rand' = any tile that reaches the road
function bestTile(g, pts, kind, mode, rnd) {
  const T = TOWERS[kind]; let best = null, bv = -1e9;
  for (let r = 0; r < g.H; r++) for (let c = 0; c < g.W; c++) {
    if (!g.canBuild(c, r, kind)) continue;
    let v;
    if (kind === 'banner') { v = 0; for (const t of g.towers) if (!TOWERS[t.kind].support && !TOWERS[t.kind].road && (t.x - c - .5) ** 2 + (t.y - r - .5) ** 2 <= 2.56) v += t.spent; v += .01 * coverage(pts, c, r, 2.5); }
    else if (kind === 'press') v = -coverage(pts, c, r, 2.6);
    else if (kind === 'tacks') { v = coverage(pts, c, r, .7) * 10; for (const t of g.towers) if (t.kind === 'glue' && (t.x - c - .5) ** 2 + (t.y - r - .5) ** 2 <= 4) v += 15; }
    else v = coverage(pts, c, r, T.lv[0].range) + (T.air ? .7 * coverage(pts.fly, c, r, T.lv[0].range) : 0);
    if (mode === 'rand') v = (kind === 'press' || kind === 'banner' || v > 0) ? rnd() : -1;
    else if (mode === 'ok') v = v * (.55 + .45 * rnd());
    if (v > bv) { bv = v; best = [c, r]; }
  }
  return best;
}

const PLANS = {
  mixed: ['quill', 'quill', 'mortar', 'glue', 'quill', 'spark', 'mortar', 'lens', 'quill', 'glue', 'spark', 'lens', 'mortar', 'quill', 'spark', 'lens'],
  full: ['quill', 'quill', 'mortar', 'glue', 'quill', 'spark', 'tacks', 'mortar', 'lens', 'banner', 'quill', 'glue', 'tacks', 'spark', 'lens', 'mortar', 'banner', 'quill', 'spark', 'lens', 'tacks'],
  eco: ['quill', 'press', 'quill', 'press', 'mortar', 'glue', 'press', 'quill', 'spark', 'mortar', 'lens', 'quill', 'glue', 'spark', 'lens', 'banner', 'mortar', 'quill', 'spark', 'lens'],
  greed: ['press', 'quill', 'press', 'press', 'quill', 'press', 'mortar', 'glue', 'quill', 'spark', 'mortar', 'lens', 'quill', 'glue', 'spark', 'lens', 'mortar', 'quill', 'spark', 'lens'],
  tackspam: ['tacks', 'quill', 'tacks', 'tacks', 'glue', 'tacks', 'quill', 'tacks', 'tacks', 'quill', 'tacks', 'glue', 'tacks', 'quill', 'tacks', 'tacks', 'quill', 'tacks', 'tacks', 'quill', 'tacks', 'tacks', 'tacks', 'quill'],
  banners: ['quill', 'quill', 'banner', 'mortar', 'glue', 'quill', 'spark', 'banner', 'mortar', 'lens', 'quill', 'banner', 'spark', 'lens', 'mortar', 'quill', 'spark', 'lens'],
  mT: ['quill', 'quill', 'mortar', 'glue', 'tacks', 'quill', 'spark', 'mortar', 'tacks', 'lens', 'quill', 'glue', 'tacks', 'spark', 'lens', 'mortar', 'quill', 'spark', 'lens', 'tacks'],
  mB: ['quill', 'quill', 'mortar', 'glue', 'quill', 'spark', 'banner', 'mortar', 'lens', 'quill', 'glue', 'banner', 'spark', 'lens', 'mortar', 'quill', 'banner', 'spark', 'lens'],
  mP: ['quill', 'quill', 'press', 'mortar', 'glue', 'press', 'quill', 'spark', 'mortar', 'lens', 'quill', 'glue', 'spark', 'lens', 'mortar', 'quill', 'spark', 'lens'],
  neo: ['quill', 'punch', 'mortar', 'glue', 'plane', 'quill', 'spark', 'fan', 'punch', 'mortar', 'lens', 'plane', 'banner', 'glue', 'spark', 'punch', 'lens', 'plane', 'fan', 'mortar', 'quill'],
  newonly: ['punch', 'plane', 'punch', 'fan', 'plane', 'punch', 'plane', 'fan', 'punch', 'plane', 'punch', 'plane', 'fan', 'punch', 'plane'],
  fanspam: ['quill', 'fan', 'fan', 'quill', 'fan', 'fan', 'quill', 'fan', 'fan', 'quill', 'fan', 'fan', 'quill', 'fan'],
  quill: ['quill'], plane: ['plane'], punch: ['punch'], mortar: ['mortar'], spark: ['spark'], lens: ['lens'],
};

function run(mapIdx, diffIdx, strat, seed, opt = {}) {
  const g = new Game(mapIdx, diffIdx, false, seed, opt.gopts); g.fxOn = false;
  const pts = samples(g); let rs = seed * 7 + 1;
  const rnd = () => { rs = (rs * 16807) % 2147483647; return rs / 2147483647; };
  const sloppy = strat === 'sloppy', ok = strat === 'ok';
  const plan = sloppy ? null : PLANS[ok ? 'full' : strat]; let pi = 0, think = 0;
  const maxT = opt.maxT || (plan && plan.length > 20 ? 26 : 22);
  const spec = t => opt.spec ? opt.spec(t) : (t.id % 2);
  g.callWave();
  let guard = 0;
  while (!g.over && guard++ < 60 * 60 * 70) {
    g.step();
    if (opt.maxWave && g.wave > opt.maxWave) break;
    if (opt.abil && g.enemies.length > 6) {
      if (g.cd.weight <= 0) { let b = g.enemies[0]; for (const e of g.enemies) if (e.path.total - e.d < b.path.total - b.d) b = e; g.ability('weight', b.x, b.y); }
      if (g.cd.gust <= 0 && g.enemies.some(e => e.path.total - e.d < 3)) g.ability('gust');
    }
    if ((think -= TD.DT) > 0) continue;
    think = sloppy ? .8 : .25;
    for (let k = 0; k < 4; k++) {
      const want = Math.min(maxT, 3 + Math.floor(g.wave * .62));
      if (sloppy) {
        if (rnd() < .5 || g.towers.length < 3) {
          const kind = TD.ORDER[Math.floor(rnd() * TD.ORDER.length)];
          if (g.gold >= TOWERS[kind].cost && g.towers.length < 26) { const t = bestTile(g, pts, kind, 'rand', rnd); if (t) g.build(kind, t[0], t[1]); }
        } else if (g.towers.length) g.upgrade(g.towers[Math.floor(rnd() * g.towers.length)], rnd() < .5 ? 0 : 1);
        break;
      }
      if (g.towers.length < want) {
        const kind = plan[pi % plan.length];
        if (g.banned[kind]) { pi++; continue; }
        if (g.gold >= TOWERS[kind].cost) { const t = bestTile(g, pts, kind, ok ? 'ok' : null, rnd); if (t && g.build(kind, t[0], t[1])) { pi++; continue; } if (!t) { pi++; continue; } }
        break;
      }
      let bt = null, bc = 1e9;
      for (const t of g.towers) { const c = g.upgradeCost(t, spec(t)); if (c != null && c < bc) { bc = c; bt = t; } }
      if (bt && g.gold >= bc) { g.upgrade(bt, spec(bt)); continue; }
      break;
    }
  }
  return { over: g.over, wave: g.wave, lives: g.lives, kills: g.kills, earned: g.earned, towers: g.towers.length, time: Math.round(g.time) };
}

function table(strats, opts, N) {
  for (const s of strats) for (const o of opts) {
    let line = (s + (o.abil ? '+ab' : '')).padEnd(12);
    for (let m = 0; m < TD.MAPS.length; m++) for (let d = 0; d < 3; d++) {
      const n = s === 'sloppy' ? 4 : N, rs = []; for (let i = 0; i < n; i++) rs.push(run(m, d, s, 11 + i * 17, o));
      const w = rs.filter(r => r.over === 'win').length, aw = rs.reduce((a, r) => a + r.wave, 0) / n, al = rs.reduce((a, r) => a + r.lives, 0) / n;
      line += `${d ? '' : ' ' + TD.MAPS[m].id.slice(0, 3) + ':'} ${w}/${n} w${aw.toFixed(0).padStart(2)} L${al.toFixed(0).padStart(2)} |`;
    }
    console.log(line);
  }
}
if (require.main === module) {
  const strats = process.argv[2] ? process.argv[2].split(',') : ['full', 'ok', 'mixed'];
  const ab = process.argv[3] === 'both' ? [{}, { abil: true }] : process.argv[3] === 'ab' ? [{ abil: true }] : [{}];
  console.log('columns per map: casual | standard | brutal   (wins, avg wave reached, avg lives left)');
  table(strats, ab, +process.argv[4] || 2);
}
module.exports = { run, table };
