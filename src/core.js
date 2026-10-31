/* ===== Paper Bastion core: pure game logic, no DOM ===== */
const TD = (function () {
  'use strict';
  const GW = 14, GH = 9, DT = 1 / 60, WAVES = 30, AUTO = 8;

  const TOWERS = {
    quill: {
      name: 'Quill', air: true, cost: 70, blurb: 'Quick pencil darts. Hits flyers.',
      lv: [{ dmg: 9, cd: .8, range: 2.6 }, { cost: 55, dmg: 15, cd: .7, range: 2.8 }, { cost: 100, dmg: 24, cd: .6, range: 3.0 }],
      sp: [{ name: 'Volley', tag: '3 targets', cost: 190, dmg: 29, cd: .58, range: 3.2, multi: 3 },
           { name: 'Sharpshot', tag: 'Pierce + crit', cost: 190, dmg: 90, cd: 1.05, range: 4.2, crit: .25, pierce: true }]
    },
    mortar: {
      name: 'Mortar', air: false, cost: 120, blurb: 'Lobbed blasts hit groups. Ground only.',
      lv: [{ dmg: 22, cd: 2.0, range: 3.0, rad: .9 }, { cost: 90, dmg: 38, cd: 1.9, range: 3.1, rad: 1.0 }, { cost: 150, dmg: 62, cd: 1.75, range: 3.3, rad: 1.1 }],
      sp: [{ name: 'Confetti', tag: 'Huge blast', cost: 260, dmg: 110, cd: 1.5, range: 3.5, rad: 1.7 },
           { name: 'Anvil', tag: 'Heavy + stun', cost: 260, dmg: 250, cd: 2.5, range: 4.2, rad: 1.2, stun: .7 }]
    },
    glue: {
      name: 'Glue Pot', air: false, cost: 90, blurb: 'Slows everything nearby. Ground only.',
      lv: [{ slow: .62, cd: 1, range: 1.9, dmg: 0 }, { cost: 70, slow: .52, cd: 1, range: 2.1, dmg: 3 }, { cost: 110, slow: .43, cd: 1, range: 2.3, dmg: 6 }],
      sp: [{ name: 'Superglue', tag: 'Sticks them fast', cost: 200, slow: .3, cd: 1, range: 2.6, dmg: 10, root: 1.4 },
           { name: 'Solvent', tag: '+30% damage taken', cost: 200, slow: .45, cd: 1, range: 2.6, dmg: 10, vuln: true }]
    },
    spark: {
      name: 'Spark', air: true, cost: 150, blurb: 'Lightning jumps between enemies. Hits flyers.',
      lv: [{ dmg: 16, cd: 1.1, range: 2.4, chain: 3 }, { cost: 110, dmg: 26, cd: 1.05, range: 2.5, chain: 4 }, { cost: 180, dmg: 40, cd: 1.0, range: 2.6, chain: 5 }],
      sp: [{ name: 'Storm', tag: '9 jumps', cost: 300, dmg: 66, cd: .95, range: 2.9, chain: 9, fall: 1 },
           { name: 'Surge', tag: 'Rapid fire', cost: 300, dmg: 50, cd: .42, range: 2.8, chain: 4 }]
    },
    lens: {
      name: 'Sun Lens', air: true, cost: 200, blurb: 'Burning beam that ramps up. Ignores armor.',
      lv: [{ dps: 22, range: 2.8, ramp: 3 }, { cost: 150, dps: 38, range: 3.0, ramp: 3 }, { cost: 240, dps: 62, range: 3.2, ramp: 3 }],
      sp: [{ name: 'Prism', tag: '3 beams', cost: 380, dps: 80, range: 3.5, ramp: 3, beams: 3 },
           { name: 'Focus', tag: 'One brutal beam', cost: 380, dps: 125, range: 3.9, ramp: 4 }]
    },
    tacks: {
      name: 'Tacks', air: false, road: true, cost: 60, blurb: 'Goes ON the road. Pricks everything that walks over it.',
      lv: [{ dmg: 6, cd: .4, range: .62 }, { cost: 50, dmg: 10, cd: .4, range: .62 }, { cost: 90, dmg: 17, cd: .4, range: .66 }],
      sp: [{ name: 'Razor Wire', tag: 'Strips armor', cost: 170, dmg: 30, cd: .4, range: .7, shred: true },
           { name: 'Springboard', tag: 'Flings one back', cost: 170, dmg: 22, cd: .4, range: .7, spring: 6 }]
    },
    banner: {
      name: 'Banner', air: false, support: true, cost: 110, blurb: 'Towers next to it hit harder. Does not attack.',
      lv: [{ range: 1.6, bd: .18 }, { cost: 90, range: 1.6, bd: .27 }, { cost: 140, range: 2.1, bd: .34 }],
      sp: [{ name: 'War Drum', tag: 'Damage + speed', cost: 240, range: 2.3, bd: .34, br: .25 },
           { name: 'Lookout', tag: 'Damage + range', cost: 240, range: 2.3, bd: .42, brg: .6 }]
    },
    press: {
      name: 'Press', air: false, support: true, cost: 140, blurb: 'Prints gold after every wave. Does not attack.',
      lv: [{ range: 0, inc: 20 }, { cost: 120, range: 0, inc: 36 }, { cost: 180, range: 0, inc: 56 }],
      sp: [{ name: 'Mint', tag: 'Prints far more', cost: 300, range: 0, inc: 100 },
           { name: 'Almoner', tag: 'Gold, +1 life / 3 waves', cost: 300, range: 0, inc: 62, life: 3 }]
    },
    fan: {
      name: 'Paper Fan', air: true, cost: 100, blurb: 'Blows ink back down the road. Hits flyers.',
      lv: [{ dmg: 5, cd: 3.0, range: 1.9, push: .8 }, { cost: 80, dmg: 9, cd: 2.7, range: 2.0, push: .95 }, { cost: 130, dmg: 14, cd: 2.4, range: 2.2, push: 1.1 }],
      sp: [{ name: 'Cyclone', tag: 'Huge push', cost: 260, dmg: 24, cd: 2.4, range: 2.5, push: 1.9 },
           { name: 'Windmill', tag: 'Steady breeze + slow', cost: 260, dmg: 9, cd: .5, range: 2.4, push: .2, slow: .7 }]
    },
    plane: {
      name: 'Hangar', air: true, cost: 130, blurb: 'Launches paper planes from long range. Hits flyers.',
      lv: [{ dmg: 34, cd: 1.7, range: 4.0 }, { cost: 100, dmg: 56, cd: 1.6, range: 4.3 }, { cost: 160, dmg: 88, cd: 1.5, range: 4.6 }],
      sp: [{ name: 'Squadron', tag: '3 planes', cost: 300, dmg: 90, cd: 1.4, range: 4.9, multi: 3 },
           { name: 'Bomber', tag: 'Planes drop blasts', cost: 300, dmg: 145, cd: 1.6, range: 5.0, rad: 1.0 }]
    },
    punch: {
      name: 'Hole Punch', air: false, cost: 110, blurb: 'Close range. Ignores armor and punches holes: holed ink takes more damage.',
      lv: [{ dmg: 32, cd: 1.3, range: 1.7 }, { cost: 85, dmg: 52, cd: 1.25, range: 1.8 }, { cost: 140, dmg: 80, cd: 1.2, range: 1.9 }],
      sp: [{ name: 'Paper Cutter', tag: 'Finishes weak ink', cost: 270, dmg: 125, cd: 1.15, range: 2.0, exec: .22 },
           { name: 'Three-Hole', tag: 'Punches 3 at once', cost: 270, dmg: 100, cd: 1.15, range: 2.0, multi: 3 }]
    }
  };
  const RANKS = [25, 75, 175];
  // Daily Ink twists. Everyone gets the same map, twist and enemy rolls on a given day.
  const MODS = {
    bargain: { name: 'Bargain Bin', tip: 'Towers cost 20% less, but Weight and Gust are locked.' },
    noglue:  { name: 'Unstuck', tip: 'No Glue Pots today.' },
    swift:   { name: 'Running Ink', tip: 'Enemies move 20% faster and pay 15% more gold.' },
    glass:   { name: 'Glass Keep', tip: 'Only 5 lives, but every enemy is 20% weaker.' },
    elite:   { name: 'Elite Day', tip: 'Brutal-style elites show up in every wave.' },
    purse:   { name: 'Tight Purse', tip: 'Start with 150 gold. Kills pay 25% more.' },
    pencils: { name: 'Pencils Only', tip: 'No Mortars, Glue Pots or Sparks.' },
    sky:     { name: 'Sky Day', tip: 'From wave 3, half the Blots and Drips sprout wings and fly.' },
    rush:    { name: 'Gold Rush', tip: 'Gold scraps come twice as often and pay double. Enemies are 15% tougher.' }
  };
  const MOD_ORDER = ['bargain', 'noglue', 'swift', 'glass', 'elite', 'purse', 'pencils', 'sky', 'rush'];
  function hashStr(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function daily(date) {
    const h = hashStr('paper-bastion:' + date);
    return { date, map: h % (date >= '2026-11-01' ? MAPS.length : 6), mod: MOD_ORDER[Math.floor(h / 6) % MOD_ORDER.length], seed: (h % 2000000000) + 1 };
  }
  const ORDER = ['quill', 'mortar', 'glue', 'spark', 'lens', 'tacks', 'banner', 'press', 'fan', 'plane', 'punch'];

  const ENEMIES = {
    blot:    { name: 'Blot',       hp: 30,  spd: 1.0,  gold: 5,   r: .26, leak: 1, tip: 'Plain ink. Nothing fancy.' },
    drip:    { name: 'Drip',       hp: 17,  spd: 1.9,  gold: 5,   r: .2,  leak: 1, tip: 'Fast and fragile.' },
    smudge:  { name: 'Smudge',     hp: 140, spd: .6,   gold: 14,  r: .38, leak: 2, tip: 'Slow and very tough.' },
    shell:   { name: 'Capback',    hp: 75,  spd: .8,   gold: 12,  r: .3,  leak: 1, armor: 5, tip: 'Armored. Small hits bounce off.' },
    speck:   { name: 'Speck',      hp: 8,   spd: 1.4,  gold: 2,   r: .14, leak: 1, tip: 'Tiny, and there are a lot of them.' },
    glob:    { name: 'Glob',       hp: 95,  spd: .8,   gold: 9,   r: .34, leak: 2, split: 3, tip: 'Bursts into three blots.' },
    moth:    { name: 'Ink Moth',   hp: 32,  spd: 1.25, gold: 8,   r: .24, leak: 1, fly: true, tip: 'Flies straight to the keep.' },
    well:    { name: 'Inkwell',    hp: 110, spd: .75,  gold: 16,  r: .3,  leak: 2, heal: true, tip: 'Heals the ink around it.' },
    skip:    { name: 'Skipper',    hp: 26,  spd: 1.05, gold: 6,   r: .22, leak: 1, hop: 1.2, tip: 'Hops ahead every few seconds.' },
    slick:   { name: 'Slick',      hp: 38,  spd: 1.45, gold: 7,   r: .24, leak: 1, noslow: true, tip: 'Glue cannot slow it.' },
    fader:   { name: 'Fader',      hp: 50,  spd: .95,  gold: 9,   r: .27, leak: 1, fade: true, tip: 'Fades from sight. Only blasts reach it then.' },
    balloon: { name: 'Ink Balloon', hp: 150, spd: .6,  gold: 16,  r: .4,  leak: 2, fly: true, pop: 2, tip: 'A tough flyer. Pops into moths.' },
    splat:   { name: 'Splatter',   hp: 85,  spd: .85,  gold: 11,  r: .31, leak: 1, jam: 1.6, tip: 'Jams nearby towers when it bursts.' },
    boss:    { name: 'The Spill',  hp: 650, spd: .38,  gold: 150, r: .6,  leak: 8, boss: true, tip: 'Huge. Sheds blots as it goes.' },
    flood:   { name: 'The Deluge', hp: 430, spd: .5,   gold: 200, r: .62, leak: 8, boss: true, fly: true, tip: 'A flying boss. Bring anti-air.' },
    wasp:    { name: 'Ink Wasp',   hp: 10,  spd: 2.0,  gold: 3,   r: .16, leak: 1, fly: true, tip: 'Tiny, quick flyers that come in swarms.' },
    streak:  { name: 'Streak',     hp: 42,  spd: 1.1,  gold: 7,   r: .23, leak: 1, dash: true, tip: 'Dashes forward when it gets hit.' },
    sponge:  { name: 'Sponge',     hp: 120, spd: .7,   gold: 12,  r: .33, leak: 1, soak: true, tip: 'Soaks up blasts. Darts, beams and punches work best.' },
    stamp:   { name: 'Stamper',    hp: 170, spd: .55,  gold: 15,  r: .36, leak: 2, armor: 3, stomp: 6, tip: 'Stomps every few seconds and jams towers beside the road.' },
    king:    { name: 'The Blot King', hp: 1000, spd: .32, gold: 240, r: .66, leak: 10, armor: 4, boss: true, brood: 'shell', split: 2, kid: 'smudge', kidMul: .8, tip: 'Armored boss. Calls Capbacks and bursts into Smudges.' }
  };

  // [type, count, gap seconds, start delay seconds]
  const WAVE_DEFS = [
    [['blot', 8, 1.0, 0]],
    [['blot', 12, .8, 0]],
    [['blot', 8, .9, 0], ['drip', 6, .5, 4]],
    [['blot', 12, .6, 0], ['skip', 6, .7, 5]],
    [['smudge', 4, 1.8, 0], ['blot', 12, .6, 3]],
    [['speck', 24, .22, 0], ['drip', 8, .45, 5]],
    [['blot', 12, .6, 0], ['moth', 6, .9, 3]],
    [['shell', 6, 1.2, 0], ['blot', 12, .5, 4], ['wasp', 8, .35, 6]],
    [['glob', 4, 1.6, 0], ['slick', 8, .5, 4]],
    [['blot', 10, .6, 0], ['boss', 1, 0, 4], ['drip', 10, .4, 10]],
    [['shell', 10, .9, 0], ['moth', 10, .7, 4], ['streak', 8, .6, 7]],
    [['speck', 40, .16, 0], ['smudge', 6, 1.3, 3], ['fader', 5, 1.1, 6], ['wasp', 8, .3, 8]],
    [['smudge', 8, 1.1, 0], ['well', 2, 3, 2], ['blot', 16, .4, 8], ['sponge', 4, 1.6, 4]],
    [['moth', 12, .55, 0], ['drip', 16, .3, 3], ['balloon', 2, 3, 5]],
    [['glob', 6, 1.2, 0], ['shell', 8, .9, 3], ['well', 2, 4, 5], ['splat', 3, 2, 14]],
    [['slick', 16, .35, 0], ['skip', 14, .4, 3], ['moth', 8, .6, 6], ['streak', 8, .55, 9]],
    [['smudge', 12, .9, 0], ['well', 3, 3, 2], ['speck', 30, .15, 9], ['fader', 8, .9, 5], ['stamp', 3, 3, 6]],
    [['shell', 16, .7, 0], ['speck', 36, .14, 6], ['balloon', 4, 2.4, 8]],
    [['glob', 8, 1.0, 0], ['moth', 18, .45, 3], ['well', 2, 5, 4], ['splat', 6, 1.3, 6], ['sponge', 4, 1.5, 9]],
    [['shell', 12, .7, 0], ['boss', 2, 6, 3], ['drip', 20, .3, 12]],
    [['smudge', 14, .8, 0], ['shell', 14, .7, 2], ['well', 3, 3, 4], ['fader', 10, .8, 6], ['stamp', 3, 3, 8]],
    [['speck', 60, .11, 0], ['glob', 8, .9, 2], ['moth', 14, .5, 8], ['skip', 16, .35, 5], ['wasp', 14, .25, 10]],
    [['slick', 30, .22, 0], ['shell', 14, .6, 4], ['well', 3, 3, 6], ['splat', 8, 1.1, 5], ['streak', 10, .45, 9]],
    [['moth', 24, .35, 0], ['balloon', 6, 2, 2], ['smudge', 12, .8, 3], ['sponge', 5, 1.3, 6]],
    [['glob', 12, .8, 0], ['flood', 1, 0, 5], ['shell', 16, .6, 6], ['well', 4, 3, 8]],
    [['smudge', 20, .6, 0], ['moth', 20, .4, 4], ['speck', 40, .12, 10], ['fader', 12, .7, 6], ['stamp', 4, 2.6, 7]],
    [['shell', 26, .45, 0], ['well', 5, 2.5, 3], ['slick', 26, .22, 8], ['splat', 8, 1, 5], ['king', 1, 0, 10]],
    [['glob', 16, .6, 0], ['balloon', 8, 1.8, 3], ['moth', 20, .35, 4], ['smudge', 12, .7, 8], ['wasp', 18, .2, 9], ['streak', 12, .4, 12]],
    [['speck', 70, .09, 0], ['shell', 20, .5, 3], ['well', 5, 2.5, 5], ['boss', 1, 0, 10], ['fader', 14, .6, 6], ['sponge', 6, 1.2, 8]],
    [['smudge', 16, .6, 0], ['boss', 2, 8, 3], ['flood', 1, 0, 9], ['shell', 20, .5, 6], ['moth', 24, .4, 10], ['well', 4, 3, 12], ['splat', 10, .9, 7], ['king', 1, 0, 14], ['stamp', 4, 2.5, 9]]
  ];

  function waveDef(n) {
    if (n <= WAVES) return WAVE_DEFS[n - 1];
    const base = WAVE_DEFS[20 + ((n - 1) % 10)], k = 1 + .12 * (n - WAVES);
    return base.map(g => [g[0], Math.max(1, Math.round(g[1] * (ENEMIES[g[0]].boss ? 1 + .04 * (n - WAVES) : k))), g[2] / Math.sqrt(k), g[3]]);
  }
  function wavePreview(n) {
    const m = {}, out = [];
    for (const g of waveDef(n)) m[g[0]] = (m[g[0]] || 0) + g[1];
    for (const k in m) out.push([k, m[k]]);
    out.sort((a, b) => (ENEMIES[b[0]].boss ? 1 : 0) - (ENEMIES[a[0]].boss ? 1 : 0));
    return out;
  }
  function hpScale(w) { return (1 + HP_LIN * (w - 1)) * Math.pow(HP_EXP, w - 1); }
  let HP_LIN = .13, HP_EXP = 1.05;

  const MAPS = [
    {
      id: 'meadow', name: 'Meadow Fold', tag: 'One long winding road. A gentle start.', theme: 'meadow', hp: 1,
      paths: [[[-1, 1], [2, 1], [2, 6], [6, 6], [6, 2], [10, 2], [10, 6], [12, 6]]],
      trees: [[0, 3], [0, 8], [5, 0], [8, 8], [9, 8], [13, 0], [13, 1], [4, 8]],
      rocks: [[4, 0], [12, 8], [13, 4]], pond: [[8, 4], [8, 5]]
    },
    {
      id: 'loop', name: 'Ember Loop', tag: 'The road crosses itself. Guard the knot.', theme: 'ember', hp: 1.2,
      paths: [[[-1, 4], [9, 4], [9, 1], [5, 1], [5, 7], [11, 7], [11, 3], [12, 3]]],
      trees: [[0, 0], [1, 0], [0, 8], [2, 7], [13, 8], [13, 0], [12, 0], [3, 6]],
      rocks: [[2, 2], [8, 6], [13, 6]], pond: [[7, 2], [8, 2]]
    },
    {
      id: 'twin', name: 'Twin Creases', tag: 'Two roads in, one road out. Split your guard.', theme: 'frost', hp: 1,
      paths: [
        [[-1, 1], [5, 1], [5, 4], [8, 4], [8, 7], [11, 7], [11, 2], [12, 2]],
        [[-1, 7], [2, 7], [2, 4], [5, 4], [8, 4], [8, 7], [11, 7], [11, 2], [12, 2]]
      ],
      trees: [[0, 4], [7, 0], [8, 0], [13, 8], [13, 5], [4, 8], [9, 2]],
      rocks: [[6, 2], [10, 5], [0, 0]], pond: [[6, 6], [6, 7]]
    },
    {
      id: 'spiral', name: 'Blossom Spiral', tag: 'A long coil to the middle. Flyers skip all of it.', theme: 'blossom', hp: 1.15, airHp: .7,
      paths: [[[-1, 1], [12, 1], [12, 7], [1, 7], [1, 3], [10, 3], [10, 5], [7, 5]]],
      trees: [[0, 0], [13, 0], [13, 8], [0, 8], [7, 0], [6, 8], [11, 5], [3, 2]],
      rocks: [[10, 2], [2, 6], [13, 4]], pond: [[4, 5], [5, 5]]
    },
    {
      id: 'ring', name: 'Ring Binder', tag: 'The road forks around the middle and meets again.', theme: 'blueprint', hp: .82,
      paths: [
        [[-1, 4], [3, 4], [3, 1], [9, 1], [9, 4], [12, 4]],
        [[-1, 4], [3, 4], [3, 7], [9, 7], [9, 4], [12, 4]]
      ],
      trees: [[0, 0], [0, 8], [13, 0], [13, 8], [6, 0], [6, 8], [12, 1]],
      rocks: [[1, 2], [11, 6], [1, 7]], pond: [[6, 3], [6, 4], [6, 5]]
    },
    {
      id: 'cut', name: 'Paper Cut', tag: 'Short, sharp and unforgiving. For experts.', theme: 'kraft', hp: .88,
      paths: [[[-1, 7], [3, 7], [3, 5], [6, 5], [6, 3], [9, 3], [9, 1], [12, 1]]],
      trees: [[0, 0], [1, 0], [13, 8], [12, 8], [0, 3], [7, 7], [11, 5]],
      rocks: [[5, 1], [10, 7], [2, 2]], pond: [[4, 4], [5, 4]]
    },
    {
      id: 'tri', name: 'Tri-Fold', tag: 'Ink pours in from three sides at once.', theme: 'dusk', hp: .8, airHp: .75,
      paths: [
        [[-1, 4], [7, 4], [7, 6], [11, 6], [11, 2], [12, 2]],
        [[3, -1], [3, 2], [7, 2], [7, 4], [7, 6], [11, 6], [11, 2], [12, 2]],
        [[14, 8], [9, 8], [9, 6], [11, 6], [11, 2], [12, 2]]
      ],
      trees: [[0, 0], [1, 1], [13, 0], [0, 8], [5, 8], [13, 5], [9, 0], [5, 6]],
      rocks: [[10, 4], [1, 6], [13, 3]], pond: [[9, 3], [9, 4]]
    },
    {
      id: 'fold', name: 'Accordion', tag: 'A tight zigzag. Lots of road, lots of ink.', theme: 'mint', hp: 1.1, airHp: .5,
      paths: [[[1, -1], [1, 7], [4, 7], [4, 1], [7, 1], [7, 7], [10, 7], [10, 1], [12, 1]]],
      trees: [[0, 3], [0, 8], [13, 8], [13, 0], [3, 8], [9, 0], [12, 5], [2, 0]],
      rocks: [[13, 4], [6, 0], [11, 8]], pond: [[5, 4], [6, 4]]
    },
    {
      id: 'stitch', name: 'Cross Stitch', tag: 'Two roads cross in the middle. Guard the crossing.', theme: 'denim', hp: .9,
      paths: [
        [[-1, 2], [2, 2], [2, 5], [11, 5], [11, 7], [12, 7]],
        [[8, -1], [8, 3], [5, 3], [5, 7], [11, 7], [12, 7]]
      ],
      trees: [[0, 0], [13, 0], [0, 8], [13, 8], [4, 0], [12, 3], [3, 7]],
      rocks: [[6, 1], [1, 6], [13, 5]], pond: [[10, 2], [11, 2]]
    }
  ];
  const DIFFS = [
    { id: 'casual', name: 'Casual', hp: .7, gold: 320, lives: 30, count: 1, elite: 0, killGold: 1, bossHp: 1,
      tag: 'Forgiving. Learn the towers.' },
    { id: 'standard', name: 'Standard', hp: 1, gold: 250, lives: 20, count: 1, elite: 0, killGold: 1, bossHp: 1,
      tag: 'The intended challenge.' },
    { id: 'brutal', name: 'Brutal', hp: 1.25, gold: 240, lives: 15, count: 1.3, elite: .45, killGold: .86, bossHp: 1.25,
      tag: 'More ink, less gold, and elites that are armored, swift, shielded or regenerating.' }
  ];

  function mulberry(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function buildPath(pts) {
    const P = pts.map(p => ({ x: p[0], y: p[1] })), cum = [0];
    for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y));
    return { P, cum, total: cum[cum.length - 1] };
  }
  // tile waypoints -> centre-line polyline with rounded corners
  function smoothPath(tiles) {
    const c = tiles.map(p => [p[0] + .5, p[1] + .5]), out = [c[0]], R = .45;
    for (let i = 1; i < c.length - 1; i++) {
      const a = c[i - 1], b = c[i], d = c[i + 1];
      const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(d[0] - b[0], d[1] - b[1]);
      const u = [(b[0] - a[0]) / l1, (b[1] - a[1]) / l1], v = [(d[0] - b[0]) / l2, (d[1] - b[1]) / l2];
      const p0 = [b[0] - u[0] * R, b[1] - u[1] * R], p2 = [b[0] + v[0] * R, b[1] + v[1] * R];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6, m = 1 - t;
        out.push([m * m * p0[0] + 2 * m * t * b[0] + t * t * p2[0], m * m * p0[1] + 2 * m * t * b[1] + t * t * p2[1]]);
      }
    }
    out.push(c[c.length - 1]);
    return buildPath(out);
  }
  function posAt(path, d, out) {
    const P = path.P, cum = path.cum;
    if (d <= 0) d = 0; else if (d >= path.total) d = path.total;
    let i = 1;
    while (i < cum.length - 1 && cum[i] < d) i++;
    const a = P[i - 1], b = P[i], seg = cum[i] - cum[i - 1] || 1, t = (d - cum[i - 1]) / seg;
    out.x = a.x + (b.x - a.x) * t; out.y = a.y + (b.y - a.y) * t; out.a = Math.atan2(b.y - a.y, b.x - a.x);
    return out;
  }

  class Game {
    constructor(mapIdx, diffIdx, portrait, seed, opts) {
      const m = MAPS[mapIdx], D = DIFFS[diffIdx];
      this.mapIdx = mapIdx; this.diffIdx = diffIdx; this.map = m; this.diff = Object.assign({}, D); this.portrait = !!portrait;
      this.W = portrait ? GH : GW; this.H = portrait ? GW : GH;
      const tp = p => portrait ? [p[1], p[0]] : [p[0], p[1]];
      this.rng = mulberry(seed || 12345);
      this.tilePaths = m.paths.map(pp => pp.map(tp));
      this.paths = this.tilePaths.map(smoothPath);
      this.flyPaths = this.tilePaths.map(pp => buildPath([[pp[0][0] + .5, pp[0][1] + .5], [pp[pp.length - 1][0] + .5, pp[pp.length - 1][1] + .5]]));
      this.base = tp(m.paths[0][m.paths[0].length - 1]);
      this.trees = m.trees.map(tp); this.rocks = m.rocks.map(tp); this.pond = m.pond.map(tp);
      // grid: 0 free, 1 road, 2 scenery, 3 base, 4 tower, 5 road with tacks on it
      this.grid = new Uint8Array(this.W * this.H);
      for (const pp of this.tilePaths) for (let i = 1; i < pp.length; i++) {
        let [x, y] = pp[i - 1]; const [bx, by] = pp[i];
        for (;;) { this.setG(x, y, 1); if (x === bx && y === by) break; x += Math.sign(bx - x); y += Math.sign(by - y); }
      }
      for (const t of this.trees.concat(this.rocks, this.pond)) this.setG(t[0], t[1], 2);
      this.setG(this.base[0], this.base[1], 3);
      this.hpMul = D.hp * m.hp; this.airMul = m.airHp || 1; this.seen = {};
      this.gold = D.gold; this.lives = D.lives; this.maxLives = D.lives;
      this.wave = 0; this.paid = 0; this.time = 0; this.auto = 0; this.autoOn = false;
      this.enemies = []; this.towers = []; this.shots = []; this.spawns = [];
      this.eid = 0; this.tid = 0; this.over = null; this.endless = false;
      this.kills = 0; this.leaks = 0; this.earned = 0;
      this.cd = { weight: 0, gust: 0 }; this.cdMax = { weight: 32, gust: 45 };
      // workshop perks (never in the Daily Ink) and daily twists
      const o = opts || {}, P = (!o.daily && o.perks) || {};
      this.daily = o.daily || null; this.mod = this.daily ? this.daily.mod : null;
      this.costMul = 1 - .03 * (P.frugal || 0); this.rankMul = 1 - .1 * (P.learn || 0);
      this.dropMul = 1 + .25 * (P.luck || 0); this.dropRate = 1; this.spdMul = 1; this.banned = {}; this.noAbil = false; this.sky = false;
      this.gold += 25 * (P.gold || 0); this.lives += P.lives || 0; this.maxLives = this.lives;
      const cdk = 1 - .1 * (P.cd || 0); this.cdMax.weight *= cdk; this.cdMax.gust *= cdk;
      switch (this.mod) {
        case 'bargain': this.costMul *= .8; this.noAbil = true; break;
        case 'noglue': this.banned.glue = 1; break;
        case 'swift': this.spdMul = 1.2; this.diff.killGold *= 1.15; break;
        case 'glass': this.lives = this.maxLives = 5; this.hpMul *= .8; break;
        case 'elite': this.diff.elite = .35; break;
        case 'purse': this.gold = 150; this.diff.killGold *= 1.25; break;
        case 'pencils': this.banned.mortar = this.banned.glue = this.banned.spark = 1; break;
        case 'sky': this.sky = true; break;
        case 'rush': this.dropRate = 2; this.dropMul *= 2; this.hpMul *= 1.15; break;
      }
      if (this.daily) this.endless = true;
      this.fx = []; this.fxOn = true; this.tmp = { x: 0, y: 0, a: 0 };
    }
    setG(x, y, v) { if (x >= 0 && y >= 0 && x < this.W && y < this.H) this.grid[y * this.W + x] = v; }
    getG(x, y) { return (x >= 0 && y >= 0 && x < this.W && y < this.H) ? this.grid[y * this.W + x] : -1; }
    emit(o) { if (this.fxOn) this.fx.push(o); }

    /* ---------- towers ---------- */
    stats(t) { const T = TOWERS[t.kind]; return t.spec >= 0 ? T.sp[t.spec] : T.lv[t.lvl]; }
    canBuild(c, r, kind) { return this.getG(c, r) === (kind && TOWERS[kind].road ? 1 : 0); }
    rangeOf(t) { const T = TOWERS[t.kind]; return this.stats(t).range + (T.road || T.support ? 0 : t.brg + .06 * t.rank); }
    recalcBuffs() {
      for (const t of this.towers) {
        t.bd = 0; t.br = 0; t.brg = 0;
        if (TOWERS[t.kind].support) continue;
        for (const b of this.towers) {
          if (b.kind !== 'banner') continue;
          const st = this.stats(b);
          if ((b.x - t.x) ** 2 + (b.y - t.y) ** 2 > st.range * st.range) continue;
          t.bd = Math.max(t.bd, st.bd || 0); t.br = Math.max(t.br, st.br || 0); t.brg = Math.max(t.brg, st.brg || 0);
        }
      }
    }
    towerAt(c, r) { for (const t of this.towers) if (t.c === c && t.r === r) return t; return null; }
    costOf(kind) { return Math.round(TOWERS[kind].cost * this.costMul); }
    collect(v) { this.gold += v; this.earned += v; }
    rankNeed(i) { return Math.round(RANKS[i] * this.rankMul); }
    build(kind, c, r) {
      const T = TOWERS[kind], cost = T && this.costOf(kind);
      if (this.over || !T || this.banned[kind] || !this.canBuild(c, r, kind) || this.gold < cost) return null;
      this.gold -= cost;
      const t = { id: ++this.tid, kind, c, r, x: c + .5, y: r + .5, lvl: 0, spec: -1, cool: .2, angle: -Math.PI / 2, mode: 'first',
        spent: cost, kills: 0, fireT: -9, beams: [], rootT: 0, builtT: this.time, jamT: 0, bd: 0, br: 0, brg: 0, springT: 0, made: 0, bw: this.wave, rank: 0 };
      this.towers.push(t); this.setG(c, r, T.road ? 5 : 4); this.recalcBuffs();
      this.emit({ k: 'build', x: t.x, y: t.y, kind });
      return t;
    }
    upgradeCost(t, spec) {
      const T = TOWERS[t.kind];
      if (t.spec >= 0) return null;
      if (t.lvl < 2) return Math.round(T.lv[t.lvl + 1].cost * this.costMul);
      return Math.round(T.sp[spec || 0].cost * this.costMul);
    }
    upgrade(t, spec) {
      const c = this.upgradeCost(t, spec);
      if (this.over || c == null || this.gold < c) return false;
      this.gold -= c; t.spent += c;
      if (t.lvl < 2) t.lvl++; else t.spec = spec || 0;
      t.beams.length = 0; t.upT = this.time; this.recalcBuffs();
      this.emit({ k: 'upgrade', x: t.x, y: t.y, kind: t.kind });
      return true;
    }
    sellValue(t) { return Math.round(t.spent * (this.time - t.builtT < 3 && t.spent === this.costOf(t.kind) ? 1 : .7)); }
    sell(t) {
      const i = this.towers.indexOf(t); if (i < 0) return;
      this.gold += this.sellValue(t); this.towers.splice(i, 1); this.setG(t.c, t.r, TOWERS[t.kind].road ? 1 : 0); this.recalcBuffs();
      this.emit({ k: 'sell', x: t.x, y: t.y });
    }

    /* ---------- waves ---------- */
    canCall() { return !this.over && this.spawns.length === 0 && (this.endless || this.wave < WAVES); }
    callBonus() {
      if (this.wave === 0) return 0;
      const b = 10 + 2 * this.wave;
      if (this.enemies.length) return b;
      return this.autoOn ? Math.round(b * .5 * this.auto / AUTO) : 0;
    }
    callWave() {
      if (!this.canCall()) return false;
      const bonus = this.callBonus();
      if (bonus) { this.gold += bonus; this.earned += bonus; }
      this.wave++; this.autoOn = false; this.auto = 0;
      let i = 0;
      const D = this.diff;
      for (const g of waveDef(this.wave)) {
        const cm = D.count, boss = ENEMIES[g[0]].boss, n = boss ? g[1] : Math.round(g[1] * cm), gap = boss ? g[2] : g[2] / Math.sqrt(cm);
        for (let k = 0; k < n; k++) this.spawns.push({ t: this.time + .6 + g[3] + k * gap, type: g[0], pi: (i++) % this.paths.length });
      }
      this.spawns.sort((a, b) => a.t - b.t);
      const news = [];
      for (const g of waveDef(this.wave)) if (!this.seen[g[0]]) { this.seen[g[0]] = 1; news.push(g[0]); }
      this.emit({ k: 'wave', n: this.wave, bonus, news, boss: waveDef(this.wave).some(g => ENEMIES[g[0]].boss) });
      return true;
    }
    spawn(type, pi, d, w, mul, gold) {
      if (this.sky && w >= 3 && (type === 'blot' || type === 'drip') && (this.skyN = (this.skyN || 0) + 1) % 2 === 0) type = 'moth';
      const E = ENEMIES[type], D = this.diff, s = this.hpMul * hpScale(w) * (mul || 1) * (E.fly ? this.airMul : 1) * (E.boss ? D.bossHp : 1);
      const e = {
        id: ++this.eid, type, E, pi, w, path: E.fly ? this.flyPaths[pi] : this.paths[pi], d: d || 0,
        hp: E.hp * s, max: E.hp * s, spd: E.spd * this.spdMul, armor: (E.armor || 0) * (1 + .07 * w), r: E.r, fly: !!E.fly,
        gold: gold != null ? gold : E.gold * D.killGold, off: E.boss ? 0 : (this.rng() - .5) * (E.fly ? .9 : .34),
        x: 0, y: 0, a: 0, slowT: 0, slowF: 1, stun: 0, vuln: 0, hitT: -9, healT: 2, spawnT: 5,
        seed: this.rng() * 6.283, dead: false, born: this.time, hopT: 2.4, hopAt: -9, hid: false, dmgT: -9, shield: 0, shieldMax: 0, regen: 0, elite: null, holes: 0, pushd: 0, dashT: 0, dashOn: 0, stompT: E.stomp || 0
      };
      if (D.elite && gold == null && !E.boss && this.rng() < D.elite * Math.min(1, Math.max(0, (w - 3) / 20))) this.makeElite(e);
      this.place(e); this.enemies.push(e); return e;
    }
    makeElite(e) {
      const kinds = ['armored', 'swift', 'shield', 'regen'], k = kinds[Math.floor(this.rng() * 4)];
      e.elite = k; e.hp *= 1.3; e.max = e.hp; e.gold *= 1.6;
      if (k === 'armored') e.armor += 4 + .35 * e.w;
      else if (k === 'swift') e.spd *= 1.3;
      else if (k === 'shield') { e.shield = e.shieldMax = e.max * .5; }
      else e.regen = .05;
      if (!this.seenElite) { this.seenElite = 1; this.emit({ k: 'elite' }); }
    }
    place(e) {
      const p = posAt(e.path, e.d, this.tmp);
      e.a = p.a; e.x = p.x - Math.sin(p.a) * e.off; e.y = p.y + Math.cos(p.a) * e.off;
    }
    speedOf(e) {
      if (e.stun > 0) return 0;
      const s = e.dashOn > 0 ? e.spd * 2.2 : e.spd;
      if (e.slowT > 0) return s * (e.E.boss ? 1 - (1 - e.slowF) * .5 : e.slowF);
      return s;
    }

    /* ---------- combat ---------- */
    hurt(e, amt, pierce, t, blast) {
      if (e.dead) return 0;
      let a = amt;
      if (!pierce && e.vuln <= 0 && e.armor) a = Math.max(a * .25, a - e.armor);
      if (e.vuln > 0) a *= 1.3;
      if (e.holes) a *= 1 + .1 * e.holes;
      if (blast && e.E.soak) a *= .5;
      if (e.E.dash && e.dashT <= 0 && a > 0) { e.dashT = 3; e.dashOn = .7; }
      if (e.shield > 0) { const sa = Math.min(e.shield, a); e.shield -= sa; a -= sa; if (e.shield <= 0) this.emit({ k: 'shieldpop', x: e.x, y: e.y }); }
      e.hp -= a; e.hitT = this.time; e.dmgT = this.time;
      if (e.hp <= 0) {
        e.dead = true; this.kills++; this.gold += e.gold; this.earned += e.gold;
        if (t) {
          t.kills++;
          if (t.rank < 3 && t.kills >= this.rankNeed(t.rank)) { t.rank++; t.rankT = this.time; this.emit({ k: 'rank', x: t.x, y: t.y, rank: t.rank, kind: t.kind }); }
        }
        this.emit({ k: 'die', x: e.x, y: e.y, type: e.type, r: e.r, gold: Math.round(e.gold), fly: e.fly });
        const kids = e.E.split || e.E.pop || 0;
        for (let i = 0; i < kids; i++) {
          const c = this.spawn(e.E.kid || (e.E.pop ? 'moth' : 'blot'), e.pi, Math.max(0, e.d - i * .32), e.w, e.E.kidMul || .6, e.E.kid ? 8 : 2);
          c.born = this.time - 1;
        }
        if (e.E.jam) {
          let any = false;
          for (const o of this.towers) {
            if (TOWERS[o.kind].support || (o.x - e.x) ** 2 + (o.y - e.y) ** 2 > 1.6) continue;
            o.jamT = e.E.jam; o.beams.length = 0; any = true;
          }
          this.emit({ k: 'jam', x: e.x, y: e.y, any });
        }
      }
      return a;
    }
    multi(k0, x, y) { const n = this.kills - k0; if (n >= 3) this.emit({ k: 'multi', x, y, n }); }
    slow(e, f, dur) { if (e.E.noslow) return; if (e.slowT <= 0 || f <= e.slowF) e.slowF = f; e.slowT = Math.max(e.slowT, dur); }
    pick(t, range, skip) {
      const air = TOWERS[t.kind].air, r2 = range * range, mode = t.mode;
      let best = null, bv = -Infinity;
      for (const e of this.enemies) {
        if (e.dead || e.hid || (e.fly && !air) || (skip && skip.indexOf(e) >= 0)) continue;
        const dx = e.x - t.x, dy = e.y - t.y, d2 = dx * dx + dy * dy, rr = range + e.r * .5;
        if (d2 > rr * rr) continue;
        const rem = e.path.total - e.d;
        const v = mode === 'first' ? -rem : mode === 'last' ? rem : mode === 'strong' ? e.hp : -d2;
        if (v > bv) { bv = v; best = e; }
      }
      return best;
    }
    stepTower(t, dt) {
      const st = this.stats(t), kind = t.kind;
      if (TOWERS[kind].support) return;
      if (t.jamT > 0) { t.jamT -= dt; return; }
      const rg = this.rangeOf(t), dm = 1 + t.bd + .06 * t.rank, cdm = 1 / (1 + t.br);
      if (kind === 'lens') {
        const n = st.beams || 1;
        for (let i = 0; i < n; i++) {
          let b = t.beams[i];
          if (!b) b = t.beams[i] = { e: null, ramp: 0 };
          let e = b.e;
          if (e) {
            const rr = rg + e.r * .5 + .15;
            if (e.dead || e.hid || (e.x - t.x) ** 2 + (e.y - t.y) ** 2 > rr * rr) e = null;
          }
          if (!e) {
            const skip = [];
            for (let j = 0; j < n; j++) if (j !== i && t.beams[j] && t.beams[j].e) skip.push(t.beams[j].e);
            e = this.pick(t, rg, skip); b.ramp = 0;
          }
          b.e = e;
          if (e) {
            const m = 1 + (st.ramp - 1) * Math.min(1, b.ramp / 3);
            const h0 = e.hitT; this.hurt(e, st.dps * dm * m * dt, true, t); e.hitT = h0; b.ramp += dt;
            if (i === 0) t.angle = Math.atan2(e.y - t.y, e.x - t.x);
            t.fireT = this.time;
            if (e.dead) b.e = null;
          }
        }
        return;
      }
      t.cool -= dt;
      if (kind === 'tacks') {
        if (st.spring && (t.springT -= dt) <= 0) {
          let b = null;
          for (const e of this.enemies) {
            if (e.dead || e.fly || e.E.boss) continue;
            const rr = rg + e.r * .5;
            if ((e.x - t.x) ** 2 + (e.y - t.y) ** 2 <= rr * rr && (!b || e.hp > b.hp)) b = e;
          }
          if (b) {
            this.emit({ k: 'spring', x: t.x, y: t.y });
            b.d = Math.max(0, b.d - st.spring); b.stun = Math.max(b.stun, .5); this.place(b); t.springT = 6; t.fireT = this.time;
          } else t.springT = 0;
        }
        if (t.cool > 0) return;
        let any = false; const k0 = this.kills;
        for (const e of this.enemies) {
          if (e.dead || e.fly) continue;
          const rr = rg + e.r * .5;
          if ((e.x - t.x) ** 2 + (e.y - t.y) ** 2 > rr * rr) continue;
          any = true; if (st.shred) e.armor = 0;
          this.hurt(e, st.dmg * dm, false, t);
        }
        this.multi(k0, t.x, t.y);
        if (any) { t.cool = st.cd * cdm; if (!st.spring) t.fireT = this.time; this.emit({ k: 'tack', x: t.x, y: t.y }); }
        return;
      }
      if (t.cool > 0) return;
      if (kind === 'fan') {
        let any = false; const k0 = this.kills;
        for (const e of this.enemies) {
          if (e.dead) continue;
          const rr = rg + e.r * .5;
          if ((e.x - t.x) ** 2 + (e.y - t.y) ** 2 > rr * rr) continue;
          any = true;
          const amt = st.push * (e.E.boss ? .25 : 1) / (1 + e.pushd * .3);
          e.pushd += amt; e.d = Math.max(0, e.d - amt); this.place(e);
          if (st.slow) this.slow(e, st.slow, .8);
          this.hurt(e, st.dmg * dm, false, t, true);
        }
        if (any) { t.cool = st.cd * cdm; t.fireT = this.time; this.emit({ k: 'fan', x: t.x, y: t.y, r: rg, soft: st.cd < 1 }); this.multi(k0, t.x, t.y); }
        return;
      }
      if (kind === 'glue') {
        let any = false;
        const doRoot = st.root && (t.rootT -= st.cd) <= 0;
        for (const e of this.enemies) {
          if (e.dead || e.fly) continue;
          const rr = rg + e.r * .5;
          if ((e.x - t.x) ** 2 + (e.y - t.y) ** 2 > rr * rr) continue;
          any = true; this.slow(e, st.slow, 1.5);
          if (st.vuln) e.vuln = 1.5;
          if (doRoot && !e.E.boss) e.stun = Math.max(e.stun, st.root);
          if (st.dmg) { const h0 = e.hitT; this.hurt(e, st.dmg, true, t); e.hitT = h0; }
        }
        if (any) {
          t.cool = st.cd; t.fireT = this.time;
          if (doRoot) t.rootT = 5;
          this.emit({ k: 'glue', x: t.x, y: t.y, r: rg, root: !!doRoot });
        } else if (doRoot) t.rootT = 0;
        return;
      }
      const e = this.pick(t, rg);
      if (!e) return;
      t.cool = st.cd * cdm; t.fireT = this.time; t.angle = Math.atan2(e.y - t.y, e.x - t.x);
      if (kind === 'quill') {
        const n = st.multi || 1, used = [e];
        for (let i = 0; i < n; i++) {
          let tg = e;
          if (i > 0) { tg = this.pick(t, rg, used) || e; used.push(tg); }
          const crit = st.crit && this.rng() < st.crit;
          this.shots.push({ k: 'dart', x: t.x, y: t.y, e: tg, tx: tg.x, ty: tg.y, dmg: st.dmg * dm * (crit ? 3 : 1), crit, pierce: !!st.pierce, t, a: t.angle, sp: st.pierce ? 16 : 11 });
        }
        this.emit({ k: 'dart', x: t.x, y: t.y });
      } else if (kind === 'plane') {
        const n = st.multi || 1, used = [e];
        for (let i = 0; i < n; i++) {
          let tg = e;
          if (i > 0) { tg = this.pick(t, rg, used) || e; used.push(tg); }
          const a = t.angle + (i - (n - 1) / 2) * .9 + (this.rng() - .5) * .6;
          this.shots.push({ k: 'plane', x: t.x, y: t.y, e: tg, tx: tg.x, ty: tg.y, dmg: st.dmg * dm, rad: st.rad || 0, t, a, sp: 5.2, age: 0 });
        }
        this.emit({ k: 'launch', x: t.x, y: t.y });
      } else if (kind === 'punch') {
        const n = st.multi || 1, used = []; const k0 = this.kills;
        for (let i = 0; i < n; i++) {
          const tg = i ? this.pick(t, rg, used) : e; if (!tg) break; used.push(tg);
          if (st.exec && !tg.E.boss && tg.hp <= tg.max * st.exec) { this.hurt(tg, tg.hp + tg.shield + 1, true, t); this.emit({ k: 'snip', x: tg.x, y: tg.y }); continue; }
          this.hurt(tg, st.dmg * dm, true, t);
          if (!tg.dead && tg.holes < 3) tg.holes++;
          this.emit({ k: 'punch', x: tg.x, y: tg.y });
        }
        this.multi(k0, e.x, e.y);
      } else if (kind === 'mortar') {
        const dist = Math.hypot(e.x - t.x, e.y - t.y), T = .42 + dist * .11;
        const p = posAt(e.path, e.d + this.speedOf(e) * T, this.tmp);
        this.shots.push({ k: 'shell', sx: t.x, sy: t.y, tx: p.x, ty: p.y, x: t.x, y: t.y, age: 0, T, dmg: st.dmg * dm, rad: st.rad, stun: st.stun || 0, t, big: t.spec >= 0 });
        this.emit({ k: 'lob', x: t.x, y: t.y });
      } else if (kind === 'spark') {
        const k0 = this.kills, pts = [{ x: t.x, y: t.y }], hit = [e]; let cur = e, dmg = st.dmg * dm; const fall = st.fall || .82;
        this.hurt(e, dmg, false, t, true); pts.push({ x: e.x, y: e.y });
        for (let i = 1; i < st.chain; i++) {
          let nb = null, nd = 1.7 * 1.7;
          for (const o of this.enemies) {
            if (o.dead || hit.indexOf(o) >= 0) continue;
            const d2 = (o.x - cur.x) ** 2 + (o.y - cur.y) ** 2;
            if (d2 < nd) { nd = d2; nb = o; }
          }
          if (!nb) break;
          dmg *= fall; hit.push(nb); this.hurt(nb, dmg, false, t, true); pts.push({ x: nb.x, y: nb.y }); cur = nb;
        }
        this.emit({ k: 'zap', pts });
        this.multi(k0, e.x, e.y);
      }
    }
    stepShots(dt) {
      const S = this.shots;
      for (let i = S.length - 1; i >= 0; i--) {
        const s = S[i];
        if (s.k === 'plane') {
          s.age += dt;
          if (!s.e.dead) { s.tx = s.e.x; s.ty = s.e.y; }
          const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy), want = Math.atan2(dy, dx);
          let da = want - s.a; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
          const turn = (3.5 + s.age * 6) * dt; s.a += Math.max(-turn, Math.min(turn, da));
          const mv = s.sp * dt;
          if (d <= mv + .18 || s.age > 3) {
            const k0 = this.kills;
            if (s.rad) {
              for (const e of this.enemies) {
                if (e.dead || (e.fly && e !== s.e)) continue;
                const rr = s.rad + e.r * .6;
                if ((e.x - s.tx) ** 2 + (e.y - s.ty) ** 2 > rr * rr) continue;
                this.hurt(e, s.dmg, false, s.t, true);
              }
              this.emit({ k: 'boom', x: s.tx, y: s.ty, r: s.rad, big: false });
            } else if (!s.e.dead) {
              const a = this.hurt(s.e, s.dmg, false, s.t);
              this.emit({ k: 'hit', x: s.tx, y: s.ty, dmg: a });
            }
            this.multi(k0, s.tx, s.ty);
            S.splice(i, 1);
          } else { s.x += Math.cos(s.a) * mv; s.y += Math.sin(s.a) * mv; }
        } else if (s.k === 'dart') {
          if (!s.e.dead) { s.tx = s.e.x; s.ty = s.e.y; }
          const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy), mv = s.sp * dt;
          s.a = Math.atan2(dy, dx);
          if (d <= mv + .12) {
            if (!s.e.dead) {
              const a = this.hurt(s.e, s.dmg, s.pierce, s.t);
              this.emit({ k: 'hit', x: s.tx, y: s.ty, crit: s.crit, dmg: a });
            }
            S.splice(i, 1);
          } else { s.x += dx / d * mv; s.y += dy / d * mv; }
        } else {
          s.age += dt; const u = Math.min(1, s.age / s.T);
          s.x = s.sx + (s.tx - s.sx) * u; s.y = s.sy + (s.ty - s.sy) * u;
          if (u >= 1) {
            const k0 = this.kills;
            for (const e of this.enemies) {
              if (e.dead || e.fly) continue;
              const rr = s.rad + e.r * .6;
              if ((e.x - s.tx) ** 2 + (e.y - s.ty) ** 2 > rr * rr) continue;
              this.hurt(e, s.dmg, false, s.t, true);
              if (s.stun && !e.dead && !e.E.boss) e.stun = Math.max(e.stun, s.stun);
            }
            this.emit({ k: 'boom', x: s.tx, y: s.ty, r: s.rad, big: s.big });
            this.multi(k0, s.tx, s.ty);
            S.splice(i, 1);
          }
        }
      }
    }
    ability(name, x, y) {
      if (this.over || this.noAbil || this.cd[name] > 0 || this.wave === 0) return false;
      if (name === 'weight') {
        const R = 1.6, dmg = 60 + 24 * this.wave, k0 = this.kills;
        for (const e of this.enemies) {
          if (e.dead) continue;
          const rr = R + e.r * .6;
          if ((e.x - x) ** 2 + (e.y - y) ** 2 > rr * rr) continue;
          this.hurt(e, dmg, true, null, true);
          if (!e.dead && !e.E.boss) e.stun = Math.max(e.stun, 1.5);
        }
        this.emit({ k: 'weight', x, y, r: R });
        this.multi(k0, x, y);
      } else if (name === 'gust') {
        for (const e of this.enemies) {
          if (e.dead) continue;
          e.d = Math.max(0, e.d - (e.E.boss ? .8 : 2.6)); this.slow(e, .5, 1.5); this.place(e);
        }
        this.emit({ k: 'gust' });
      } else return false;
      this.cd[name] = this.cdMax[name];
      return true;
    }

    /* ---------- main step ---------- */
    step() {
      if (this.over) return;
      const dt = DT; this.time += dt;
      if (this.cd.weight > 0) this.cd.weight -= dt;
      if (this.cd.gust > 0) this.cd.gust -= dt;
      const SP = this.spawns;
      while (SP.length && SP[0].t <= this.time) { const s = SP.shift(); this.spawn(s.type, s.pi, 0, this.wave); }

      const EN = this.enemies, n0 = EN.length;
      for (let i = 0; i < n0; i++) {
        const e = EN[i];
        if (e.dead) continue;
        const sp = this.speedOf(e);
        if (e.stun > 0) e.stun -= dt;
        if (e.slowT > 0) e.slowT -= dt;
        if (e.vuln > 0) e.vuln -= dt;
        if (e.dashT > 0) e.dashT -= dt;
        if (e.dashOn > 0) e.dashOn -= dt;
        e.d += sp * dt;
        if (e.d >= e.path.total) {
          e.dead = true; this.lives -= e.E.leak; this.leaks++;
          this.emit({ k: 'leak', x: e.x, y: e.y, n: e.E.leak, type: e.type });
          if (this.lives <= 0) { this.lives = 0; this.over = 'lose'; this.emit({ k: 'lose' }); return; }
          continue;
        }
        if (e.E.hop && e.stun <= 0 && (e.hopT -= dt) <= 0) {
          e.hopT = 2.4; e.hopAt = this.time; e.d = Math.min(e.path.total - .05, e.d + e.E.hop);
        }
        this.place(e);
        if (e.regen && e.hp < e.max && this.time - e.dmgT > 1.2) e.hp = Math.min(e.max, e.hp + e.max * e.regen * dt);
        if (e.E.fade) e.hid = (this.time - e.born + e.seed) % 3.6 < 1.2;
        if (e.E.heal && (e.healT -= dt) <= 0) {
          e.healT = 1.5; let any = false;
          for (const o of EN) {
            if (o === e || o.dead || o.hp >= o.max || (o.x - e.x) ** 2 + (o.y - e.y) ** 2 > 3.24) continue;
            o.hp = Math.min(o.max, o.hp + o.max * (o.E.boss ? .02 : .07)); any = true;
          }
          if (any) this.emit({ k: 'heal', x: e.x, y: e.y });
        }
        if (e.E.stomp && e.stun <= 0 && (e.stompT -= dt) <= 0) {
          e.stompT = e.E.stomp; let any = false;
          for (const o of this.towers) {
            if (TOWERS[o.kind].support || (o.x - e.x) ** 2 + (o.y - e.y) ** 2 > 1.56) continue;
            o.jamT = Math.max(o.jamT, 1.1); o.beams.length = 0; any = true;
          }
          this.emit({ k: 'stomp', x: e.x, y: e.y, any });
        }
        if (e.E.boss && (e.spawnT -= dt) <= 0) {
          e.spawnT = e.E.brood ? 7 : 5;
          for (let k = 0; k < 2; k++) { const c = this.spawn(e.E.brood || (e.fly ? 'moth' : 'blot'), e.pi, Math.max(0, e.d - .3 - k * .3), e.w, .6, 2); c.born = this.time - 1; }
          this.emit({ k: 'brood', x: e.x, y: e.y });
        }
      }
      for (const t of this.towers) this.stepTower(t, dt);
      this.stepShots(dt);
      for (let i = EN.length - 1; i >= 0; i--) if (EN[i].dead) EN.splice(i, 1);

      if (this.wave > 0 && SP.length === 0 && EN.length === 0) {
        if (this.paid < this.wave) {
          let b = 0;
          for (let w = this.paid + 1; w <= this.wave; w++) {
            b += 15 + 3 * w;
            for (const t of this.towers) {
              if (t.kind !== 'press' || t.bw >= w) continue;
              const st = this.stats(t);
              this.gold += st.inc; this.earned += st.inc; t.made += st.inc; t.fireT = this.time;
              const life = st.life && w % st.life === 0 && this.lives < this.maxLives;
              if (life) this.lives++;
              this.emit({ k: 'print', x: t.x, y: t.y, inc: st.inc, life });
            }
          }
          this.paid = this.wave; this.gold += b; this.earned += b;
          this.emit({ k: 'clear', n: this.wave, bonus: b });
        }
        if (this.wave >= WAVES && !this.endless) { this.over = 'win'; this.emit({ k: 'win' }); return; }
        if (!this.autoOn) { this.autoOn = true; this.auto = AUTO; }
        else if ((this.auto -= dt) <= 0) this.callWave();
      }
    }
    stars() { const f = this.lives / this.maxLives; return f >= .75 ? 3 : f >= .4 ? 2 : 1; }
    continueEndless() { if (this.over === 'win') { this.over = null; this.endless = true; this.autoOn = false; } }
  }

  return { RANKS, MODS, daily, GW, GH, DT, WAVES, AUTO, TOWERS, ORDER, ENEMIES, MAPS, DIFFS, Game, waveDef, wavePreview, posAt, hpScale,
    _tune(l, e) { HP_LIN = l; HP_EXP = e; } };
})();
if (typeof module !== 'undefined') module.exports = TD;
