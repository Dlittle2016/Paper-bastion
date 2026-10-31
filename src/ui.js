/* ===== Paper Bastion front end: drawing, input, sound, menus ===== */
(function () {
  'use strict';
  const { TOWERS, ORDER, ENEMIES, MAPS, DIFFS, Game, WAVES, DT } = TD;
  const U = 64, TAU = Math.PI * 2, SH = 'rgba(26,22,58,.22)', INK = '#221d46', PAPER = '#f7f0e1';
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const rand = (a, b) => a + Math.random() * (b - a);

  const THEMES = {
    meadow: { g1: '#a9d79b', g2: '#a0d091', edge: '#74b06b', path: '#f6e6bf', path2: '#e3cc98', stitch: '#b99a5e', tree: ['#3f9463', '#57ad78', '#8fd0a2'], rock: ['#a9a8b8', '#d2d1dc'], water: ['#62b3d4', '#93d0e6'], flower: ['#ffffff', '#ffc9d6', '#ffe07a'] },
    ember:  { g1: '#ecc57c', g2: '#e6bc6e', edge: '#c4923f', path: '#fcf2dc', path2: '#ead5ac', stitch: '#c2a06a', tree: ['#b8452a', '#dc6c34', '#f6a55a'], rock: ['#9d928e', '#c9c0bb'], water: ['#5aa5c2', '#86c5da'], flower: ['#fff6dd', '#c8552f', '#8a3b22'] },
    frost:  { g1: '#e2edf4', g2: '#d7e5ee', edge: '#a9c0d0', path: '#cdbda3', path2: '#b5a385', stitch: '#8c7b61', tree: ['#2a676c', '#3f8a88', '#f4fafc'], rock: ['#8f9db0', '#c0cad7'], water: ['#75b0da', '#a9d2ec'], flower: ['#ffffff', '#b5d3e4', '#8fbcd4'] }
  };
  THEMES.blossom = { g1: '#cfe6c1', g2: '#c5dfb5', edge: '#8fba80', path: '#fdf1ea', path2: '#eed3c8', stitch: '#c79a8d', tree: ['#e07fa2', '#f2a5bd', '#fde3ea'], rock: ['#a9a8b8', '#d2d1dc'], water: ['#6db7d3', '#9bd3e6'], flower: ['#ffffff', '#f7b7cb', '#ffd86b'] };
  THEMES.blueprint = { g1: '#6d9bd8', g2: '#6593d2', edge: '#4270b4', path: '#f3f7fd', path2: '#cbdaf1', stitch: '#7b99ca', tree: ['#2c5aa3', '#477dcb', '#dce9fb'], rock: ['#3b5d96', '#8cabd9'], water: ['#3d6db7', '#5b8bd1'], flower: ['#ffffff', '#dce9fb', '#ffffff'] };
  THEMES.kraft = { g1: '#d0aa7d', g2: '#c9a275', edge: '#a17b4e', path: '#f7ecd5', path2: '#e1ceaa', stitch: '#b09263', tree: ['#587a41', '#789a58', '#f3a6b8'], rock: ['#8b7864', '#b9a792'], water: ['#57a5bb', '#86c6d6'], flower: ['#fff7e0', '#e9564c', '#f2b632'] };
  THEMES.dusk = { g1: '#8d86c4', g2: '#8680bd', edge: '#625ba0', path: '#f6ecd9', path2: '#d9c9ad', stitch: '#a38f6c', tree: ['#3b3577', '#524b99', '#f2b632'], rock: ['#5f5a86', '#9993bf'], water: ['#4b6fb8', '#7899d6'], flower: ['#fff4d8', '#ffcf6b', '#ff9c7a'] };
  THEMES.mint = { g1: '#9fdcc8', g2: '#96d5c0', edge: '#66b29a', path: '#fbf3e4', path2: '#e4d3b5', stitch: '#b49b70', tree: ['#2d8a72', '#45a98d', '#ffe6a0'], rock: ['#8fa3a6', '#c3d2d3'], water: ['#4fa8c6', '#86cde0'], flower: ['#ffffff', '#ffb3a7', '#ffe07a'] };
  THEMES.denim = { g1: '#7d93bf', g2: '#768cb8', edge: '#56699a', path: '#f4ead2', path2: '#d8c7a4', stitch: '#e7a23a', tree: ['#2f4677', '#435f99', '#e7a23a'], rock: ['#566791', '#9aa9c9'], water: ['#3f68ad', '#6d91cf'], flower: ['#ffffff', '#e7a23a', '#ffd8a0'] };
  const TC = { fan: ['#5cc7e8', '#2e98bb', '#c4efff'], plane: ['#5c7aa6', '#3f5a84', '#b9cbe6'], punch: ['#9cc43c', '#6f9425', '#d8f09a'], tacks: ['#8f9bb3', '#636d87', '#dfe5f0'], banner: ['#dd5a96', '#ad3b73', '#f8b0cf'], press: ['#59a45c', '#3a7a41', '#aadba6'], quill: ['#e9564c', '#b93a33', '#ff9486'], mortar: ['#f0a92e', '#bd7a10', '#ffd27a'], glue: ['#2fb5a6', '#1d8a7e', '#9be8dc'], spark: ['#8a63d2', '#5e3fa2', '#c9b0f7'], lens: ['#f6c945', '#c4922a', '#fff2b0'] };
  const EC = { blot: '#2a2552', drip: '#3d3190', smudge: '#1a1733', shell: '#2d2957', speck: '#322c68', glob: '#6d2c7e', moth: '#3a3676', well: '#1d4d56', boss: '#17132e', skip: '#2b3f9c', slick: '#0f0e1c', fader: '#8a84bd', balloon: '#3a3676', splat: '#5e1b50', flood: '#16224f', wasp: '#241f4a', streak: '#3b2a8a', sponge: '#4b4a7d', stamp: '#3a1f3f', king: '#121034' };
  const KEYS = '1234567890-';
  const AIM = { first: 'First', last: 'Last', strong: 'Strong', close: 'Close' }, AIMS = ['first', 'last', 'strong', 'close'];

  /* ---------- storage ---------- */
  const store = {
    d: { best: {}, muted: false, snd: 2, map: 0, diff: 1, seals: 0, perks: {}, daily: {} },
    load() { try { const s = localStorage.getItem('paperBastion.v1'); if (s) Object.assign(this.d, JSON.parse(s)); } catch (e) { } },
    save() { try { localStorage.setItem('paperBastion.v1', JSON.stringify(this.d)); } catch (e) { } }
  };
  store.load();
  if (store.d.muted) { store.d.snd = 0; store.d.muted = false; }

  /* ---------- sound ---------- */
  const Snd = {
    ac: null, last: {},
    init() {
      if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
      try {
        const A = window.AudioContext || window.webkitAudioContext; this.ac = new A();
        this.out = this.ac.createGain(); this.out.gain.value = .45; this.out.connect(this.ac.destination);
        this.mus = this.ac.createGain(); this.mus.gain.value = .8; this.mus.connect(this.ac.destination);
        const b = this.ac.createBuffer(1, this.ac.sampleRate * .6, this.ac.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.nb = b;
      } catch (e) { this.ac = null; }
    },
    tone(type, f0, f1, dur, vol, delay) {
      const ac = this.ac, t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(this.out); o.start(t); o.stop(t + dur + .03);
    },
    noise(f0, f1, dur, vol, delay, kind) {
      const ac = this.ac, t = ac.currentTime + (delay || 0), s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = this.nb; f.type = kind || 'lowpass'; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(this.out); s.start(t); s.stop(t + dur + .03);
    },
    music(want, o) { if (this.ac && store.d.snd === 2 && this.ac.state === 'running') Music.tick(this.ac, this.mus, this.nb, want, o); },
    play(n) {
      if (!this.ac || !store.d.snd) return;
      const now = performance.now(), gap = { fan: 220, launch: 110, punch: 70, snip: 90, stomp: 150, multi: 150, rank: 300, dart: 55, die: 50, hit: 60, zap: 80, glue: 200, boom: 70, lob: 90, tack: 110, print: 60 }[n] || 30;
      if (now - (this.last[n] || 0) < gap) return; this.last[n] = now;
      switch (n) {
        case 'dart': this.tone('triangle', 980, 520, .05, .05); break;
        case 'lob': this.tone('sine', 190, 90, .12, .12); break;
        case 'boom': this.noise(900, 120, .28, .26); this.tone('sine', 120, 45, .22, .2); break;
        case 'zap': this.tone('sawtooth', 1500, 240, .09, .05); this.noise(5000, 1500, .07, .06, 0, 'highpass'); break;
        case 'glue': this.tone('sine', 260, 150, .14, .06); break;
        case 'die': this.tone('sine', 340, 110, .07, .07); break;
        case 'build': this.tone('square', 170, 120, .07, .08); this.tone('triangle', 520, 780, .09, .08, .05); break;
        case 'upgrade': [523, 659, 784, 1047].forEach((f, i) => this.tone('triangle', f, f, .11, .09, i * .06)); break;
        case 'sell': this.tone('triangle', 988, 988, .07, .08); this.tone('triangle', 1319, 1319, .12, .08, .07); break;
        case 'leak': this.tone('sawtooth', 150, 60, .35, .14); break;
        case 'wave': this.tone('triangle', 392, 392, .16, .1); this.tone('triangle', 523, 523, .26, .1, .14); break;
        case 'boss': this.tone('sawtooth', 82, 55, .9, .16); this.tone('sawtooth', 110, 73, .9, .1, .12); break;
        case 'weight': this.noise(1400, 60, .5, .4); this.tone('sine', 150, 35, .45, .35); break;
        case 'gust': this.noise(300, 2600, .7, .2, 0, 'bandpass'); break;
        case 'heal': this.tone('sine', 660, 880, .14, .04); break;
        case 'rank': [659, 784, 988, 1319].forEach((f, i) => this.tone('square', f, f, .09, .045, i * .07)); this.tone('triangle', 1319, 1319, .3, .06, .28); break;
        case 'multi': [523, 784, 1047].forEach((f, i) => this.tone('triangle', f, f * 1.01, .1, .08, i * .05)); break;
        case 'bosskill': this.noise(2400, 60, 1.1, .45); this.tone('sine', 110, 30, 1, .35); [392, 523, 659, 784, 1047].forEach((f, i) => this.tone('triangle', f, f, .5, .07, .5 + i * .09)); break;
        case 'sting': this.tone('sawtooth', 220, 210, .25, .09); this.tone('sawtooth', 233, 220, .45, .09, .22); break;
        case 'beat': this.tone('sine', 70, 45, .12, .22); this.tone('sine', 66, 42, .14, .18, .2); break;
        case 'clear': this.tone('triangle', 659, 659, .1, .08); this.tone('triangle', 880, 880, .18, .08, .09); break;
        case 'win': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone('triangle', f, f, .22, .11, i * .11)); break;
        case 'lose': [392, 330, 262, 196].forEach((f, i) => this.tone('sawtooth', f, f * .97, .3, .08, i * .17)); break;
        case 'no': this.tone('square', 140, 110, .08, .06); break;
        case 'tick': this.tone('triangle', 700, 700, .03, .05); break;
        case 'tack': this.tone('square', 1300, 900, .025, .022); break;
        case 'shield': this.tone('triangle', 1760, 2637, .12, .06); this.noise(6000, 3000, .1, .05, 0, 'highpass'); break;
        case 'spring': this.tone('sine', 220, 880, .16, .1); break;
        case 'print': this.tone('triangle', 1047, 1047, .06, .07); this.tone('triangle', 1568, 1568, .12, .07, .06); break;
        case 'fan': this.noise(500, 1800, .32, .12, 0, 'bandpass'); break;
        case 'launch': this.tone('triangle', 620, 1240, .12, .05); this.noise(3000, 6000, .08, .03, 0, 'highpass'); break;
        case 'punch': this.tone('square', 240, 110, .05, .06); this.noise(4000, 1200, .05, .08, 0, 'highpass'); break;
        case 'snip': this.noise(7000, 2500, .09, .1, 0, 'highpass'); this.tone('triangle', 1800, 900, .08, .06); break;
        case 'stomp': this.tone('sine', 95, 40, .22, .3); this.noise(600, 80, .2, .2); break;
        case 'jam': this.noise(700, 200, .22, .16); this.tone('sawtooth', 200, 90, .2, .06); break;
      }
    }
  };

  /* ---------- music: an original chiptune, sequenced live (pulse lead, square arp, triangle bass, noise drums) ---------- */
  const Music = (function () {
    const SD = 60 / 132 / 4, hz = m => 440 * Math.pow(2, (m - 69) / 12);
    // each bar: c = chord tones, b = bass root, m = lead notes [step, midi note, length in steps]
    const SONG = {
      calm: [
        { c: [60, 64, 67], b: 36, m: [[0, 76, 4], [4, 79, 4], [8, 72, 6]] },
        { c: [55, 59, 62], b: 43, m: [[0, 74, 4], [4, 79, 4], [8, 71, 6]] },
        { c: [57, 60, 64], b: 45, m: [[0, 72, 4], [4, 76, 4], [8, 69, 4], [12, 72, 4]] },
        { c: [53, 57, 60], b: 41, m: [[0, 69, 4], [4, 72, 4], [8, 77, 4], [12, 76, 2], [14, 74, 2]] }
      ],
      battle: [
        { c: [57, 60, 64], b: 45, m: [[0, 76, 2], [2, 81, 2], [4, 79, 1], [5, 76, 3], [8, 72, 2], [10, 74, 2], [12, 76, 4]] },
        { c: [53, 57, 60], b: 41, m: [[0, 77, 2], [2, 81, 2], [4, 79, 1], [5, 77, 3], [8, 72, 2], [10, 74, 2], [12, 72, 4]] },
        { c: [60, 64, 67], b: 48, m: [[0, 76, 2], [2, 79, 2], [4, 84, 3], [7, 83, 1], [8, 79, 2], [10, 76, 2], [12, 79, 4]] },
        { c: [55, 59, 62], b: 43, m: [[0, 74, 2], [2, 79, 2], [4, 83, 3], [7, 81, 1], [8, 79, 2], [10, 74, 2], [12, 71, 2], [14, 74, 2]] },
        { c: [57, 60, 64], b: 45, m: [[0, 81, 3], [3, 79, 1], [4, 76, 2], [6, 72, 2], [8, 76, 3], [11, 74, 1], [12, 72, 2], [14, 69, 2]] },
        { c: [53, 57, 60], b: 41, m: [[0, 77, 3], [3, 76, 1], [4, 72, 2], [6, 69, 2], [8, 72, 2], [10, 77, 2], [12, 81, 4]] },
        { c: [62, 65, 69], b: 50, m: [[0, 74, 2], [2, 77, 2], [4, 81, 2], [6, 77, 2], [8, 74, 2], [10, 77, 2], [12, 81, 2], [14, 86, 2]] },
        { c: [64, 68, 71], b: 40, m: [[0, 83, 3], [3, 80, 1], [4, 76, 4], [8, 80, 2], [10, 83, 2], [12, 88, 4]], fill: true }
      ],
      boss: [
        { c: [57, 60, 64], b: 45, m: [[0, 81, 2], [2, 76, 2], [4, 81, 2], [6, 84, 2], [8, 83, 2], [10, 81, 2], [12, 80, 2], [14, 81, 2]] },
        { c: [57, 60, 64], b: 45, m: [[0, 76, 2], [2, 72, 2], [4, 76, 2], [6, 81, 2], [8, 79, 3], [11, 76, 1], [12, 74, 2], [14, 76, 2]] },
        { c: [53, 57, 60], b: 41, m: [[0, 77, 2], [2, 72, 2], [4, 77, 2], [6, 81, 2], [8, 79, 2], [10, 77, 2], [12, 76, 2], [14, 77, 2]] },
        { c: [64, 68, 71], b: 40, m: [[0, 76, 2], [2, 80, 2], [4, 83, 2], [6, 88, 2], [8, 86, 2], [10, 83, 2], [12, 80, 2], [14, 76, 2]], fill: true }
      ]
    };
    // two more lead lines over the same battle chords, so maps can sound different
    const LEADS = {
      B: [
        [[0, 69, 1], [2, 72, 1], [3, 76, 2], [6, 74, 1], [7, 72, 1], [8, 76, 3], [11, 79, 1], [12, 81, 4]],
        [[0, 77, 2], [2, 76, 1], [3, 72, 2], [6, 69, 2], [8, 72, 2], [10, 77, 2], [12, 76, 2], [14, 74, 2]],
        [[0, 72, 1], [2, 76, 1], [3, 79, 2], [6, 84, 2], [8, 83, 1], [9, 79, 1], [10, 76, 2], [12, 79, 4]],
        [[0, 83, 2], [2, 79, 1], [3, 74, 2], [6, 79, 2], [8, 81, 2], [10, 83, 2], [12, 86, 4]],
        [[0, 81, 1], [1, 79, 1], [2, 76, 2], [4, 72, 2], [6, 76, 2], [8, 81, 3], [11, 83, 1], [12, 84, 4]],
        [[0, 84, 2], [2, 81, 2], [4, 77, 2], [6, 81, 2], [8, 79, 2], [10, 77, 2], [12, 76, 2], [14, 77, 2]],
        [[0, 74, 1], [1, 77, 1], [2, 81, 2], [4, 86, 2], [6, 84, 2], [8, 81, 2], [10, 77, 2], [12, 74, 4]],
        [[0, 76, 2], [2, 80, 2], [4, 83, 2], [6, 88, 2], [8, 86, 1], [9, 83, 1], [10, 80, 2], [12, 76, 4]]
      ],
      C: [
        [[0, 76, 6], [6, 74, 2], [8, 72, 4], [12, 69, 4]],
        [[0, 72, 4], [4, 77, 4], [8, 76, 4], [12, 72, 4]],
        [[0, 79, 6], [6, 77, 2], [8, 76, 4], [12, 72, 4]],
        [[0, 74, 4], [4, 79, 4], [8, 83, 6], [14, 81, 2]],
        [[0, 81, 6], [6, 79, 2], [8, 76, 4], [12, 72, 4]],
        [[0, 77, 4], [4, 81, 4], [8, 84, 4], [12, 81, 4]],
        [[0, 81, 4], [4, 77, 4], [8, 74, 4], [12, 77, 4]],
        [[0, 76, 4], [4, 80, 4], [8, 83, 8]]
      ]
    };
    for (const k in LEADS) SONG['battle' + k] = SONG.battle.map((b, i) => ({ c: b.c, b: b.b, fill: b.fill, m: LEADS[k][i] }));
    const DR = {
      calm:   { k: 'x.........x.....', s: '................', h: '..x...x...x...x.' },
      battle: { k: 'x.....x.x.....x.', s: '....x.......x...', h: 'x.x.x.x.x.x.x.xx' },
      boss:   { k: 'x...x...x...x.x.', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx' }
    };
    let pulse = null, pulseAc = null;
    function wave(ac) {
      if (pulseAc === ac) return pulse;
      const n = 24, re = new Float32Array(n), im = new Float32Array(n);
      for (let i = 1; i < n; i++) re[i] = 2 / (i * Math.PI) * Math.sin(i * Math.PI * .25);   // 25% duty pulse
      pulseAc = ac; return pulse = ac.createPeriodicWave(re, im);
    }
    function note(ac, out, type, f, t, dur, vol, pluck) {
      const o = ac.createOscillator(), g = ac.createGain();
      if (type === 'pulse') o.setPeriodicWave(wave(ac)); else o.type = type;
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(vol * (pluck || .7), t + dur * .8); g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + .02);
    }
    function hit(ac, out, nb, kind, t, vol) {
      if (kind === 'k') {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + .11);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .15);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + .17); return;
      }
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), d = kind === 's' ? .12 : .035;
      s.buffer = nb; f.type = 'highpass'; f.frequency.value = kind === 's' ? 1400 : 7500;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
      s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * .3); s.stop(t + d + .02);
      if (kind === 's') note(ac, out, 'triangle', 196, t, .07, vol * .9, .4);
    }
    // schedule one 16th-note step of a section at audio time t
    // o: { lead: 'A' | 'B' | 'C', tr: semitones, lvl: 0-3 intensity (battle only) }
    function sched(ac, out, nb, sec, step, t, o) {
      o = o || { lead: 'A', tr: 0, lvl: 3 };
      const key = sec === 'battle' && o.lead && o.lead !== 'A' ? 'battle' + o.lead : sec, tr = o.tr || 0;
      const bars = SONG[key], B = bars[Math.floor(step / 16) % bars.length], s = step % 16, d = DR[sec], calm = sec === 'calm', boss = sec === 'boss';
      const lvl = sec === 'battle' ? (o.lvl == null ? 3 : o.lvl) : 3;
      if (lvl >= 2) for (const m of B.m) if (m[0] === s) {
        note(ac, out, calm ? 'square' : 'pulse', hz(m[1] + tr), t, m[2] * SD * .94, calm ? .034 : .05);
        if (sec === 'battle' && lvl >= 3) note(ac, out, 'square', hz(m[1] + tr - 12), t, m[2] * SD * .9, .018, .5);
      }
      if (calm) { if (s % 2 === 0) note(ac, out, 'square', hz(B.c[[0, 1, 2, 1][(s / 2) % 4]] + 12 + tr), t, SD * 1.7, .012, .3); }
      else if (lvl >= 1) note(ac, out, 'square', hz(B.c[[0, 1, 2, 1][s % 4]] + 12 + tr), t, SD * .9, .018, .4);
      if (calm) { if (s === 0) note(ac, out, 'triangle', hz(B.b + tr), t, SD * 7.5, .13); else if (s === 8) note(ac, out, 'triangle', hz(B.b + 7 + tr), t, SD * 6, .11); }
      else if (boss) note(ac, out, 'triangle', hz(B.b + tr + (s % 4 === 2 ? 12 : 0)), t, SD * .9, .15);
      else if (s % 2 === 0) note(ac, out, 'triangle', hz(B.b + tr + [0, 0, 12, 0, 0, 0, 12, 7][s / 2]), t, SD * 1.8, .15);
      const fill = B.fill && s >= 13 && lvl >= 1;
      if (d.k[s] === 'x') hit(ac, out, nb, 'k', t, calm ? .12 : .24);
      if ((d.s[s] === 'x' && lvl >= 1) || fill) hit(ac, out, nb, 's', t, fill ? .07 + (s - 13) * .02 : .12);
      if (d.h[s] === 'x' || (sec === 'battle' && lvl >= 3)) hit(ac, out, nb, 'h', t, (calm ? .025 : .04) * (s % 4 === 0 ? 1 : (boss || lvl >= 3) && s % 2 ? .45 : .7));
    }
    let sec = 'calm', step = 0, next = 0, cur = null;
    return {
      SD, sched,
      tick(ac, out, nb, want, o) {
        const now = ac.currentTime;
        if (next < now - .25) { next = now + .06; step = 0; sec = want; cur = o; }
        while (next < now + .2) {
          if (step % 16 === 0) { if (want !== sec) { sec = want; step = 0; } cur = o; }
          else if (step % 4 === 0 && o && cur && o.lvl > cur.lvl) cur = o;   // build up on the beat, calm down on the bar
          sched(ac, out, nb, sec, step, next, cur); next += SD; step++;
        }
      }
    };
  })();

  /* ---------- tiny draw helpers ---------- */
  function circ(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  function rr(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); c.fill(); }
  function tri(c, x1, y1, x2, y2, x3, y3) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.closePath(); c.fill(); }
  function blob(c, x, y, r, seed, t, amp, n) {
    const px = [], py = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU, k = r * (1 + amp * Math.sin(a * 3 + seed + t * 4) + amp * .7 * Math.sin(a * 5 - seed * 2 - t * 3));
      px.push(x + Math.cos(a) * k); py.push(y + Math.sin(a) * k);
    }
    c.beginPath(); c.moveTo((px[n - 1] + px[0]) / 2, (py[n - 1] + py[0]) / 2);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; c.quadraticCurveTo(px[i], py[i], (px[i] + px[j]) / 2, (py[i] + py[j]) / 2); }
    c.fill();
  }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- terrain (drawn once per board) ---------- */
  function strokePaths(c, g, width, style, dash) {
    c.lineWidth = width; c.strokeStyle = style; c.lineJoin = 'round'; c.lineCap = 'butt'; c.setLineDash(dash || []);
    for (const p of g.paths) { c.beginPath(); p.P.forEach((q, i) => i ? c.lineTo(q.x * U, q.y * U) : c.moveTo(q.x * U, q.y * U)); c.stroke(); }
    c.setLineDash([]);
  }
  function drawTerrain(c, g, mini) {
    const th = THEMES[g.map.theme], W = g.W, H = g.H, rnd = mulberry(g.mapIdx * 977 + 7);
    c.fillStyle = th.g1; c.fillRect(0, 0, W * U, H * U);
    c.fillStyle = th.g2;
    for (let r = 0; r < H; r++) for (let x = 0; x < W; x++) if ((x + r) & 1) c.fillRect(x * U, r * U, U, U);
    if (g.map.theme === 'blueprint') {
      c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = mini ? 3 : 1.5; c.beginPath();
      for (let x = 0; x <= W; x++) { c.moveTo(x * U, 0); c.lineTo(x * U, H * U); }
      for (let r = 0; r <= H; r++) { c.moveTo(0, r * U); c.lineTo(W * U, r * U); }
      c.stroke();
      if (!mini) { c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 1; c.beginPath(); for (let x = .5; x < W; x++) { c.moveTo(x * U, 0); c.lineTo(x * U, H * U); } for (let r = .5; r < H; r++) { c.moveTo(0, r * U); c.lineTo(W * U, r * U); } c.stroke(); }
    }
    if (!mini) {
      for (let i = 0; i < 2400; i++) { c.fillStyle = rnd() < .5 ? 'rgba(255,255,255,.07)' : 'rgba(30,40,60,.045)'; c.fillRect(rnd() * W * U, rnd() * H * U, 2.2, 2.2); }
      for (let r = 0; r < H; r++) for (let x = 0; x < W; x++) {
        if (g.getG(x, r) !== 0) { rnd(); continue; }
        const k = rnd(), ox = x * U + 12 + rnd() * 40, oy = r * U + 14 + rnd() * 38;
        if (k < .16) {
          for (let f = 0; f < 3; f++) {
            const fx = ox + (f - 1) * 11 + rnd() * 4, fy = oy + rnd() * 12 - 6;
            c.fillStyle = th.flower[f % 2]; for (let p = 0; p < 5; p++) circ(c, fx + Math.cos(p * 1.257) * 3, fy + Math.sin(p * 1.257) * 3, 2.3);
            c.fillStyle = th.flower[2]; circ(c, fx, fy, 1.8);
          }
        } else if (k < .5) {
          c.strokeStyle = th.edge; c.lineWidth = 2; c.lineCap = 'round';
          for (let s = -1; s <= 1; s++) { c.beginPath(); c.moveTo(ox + s * 3, oy); c.lineTo(ox + s * 6, oy - 8 + Math.abs(s) * 2); c.stroke(); }
        }
      }
    }
    // road: shadow, edge, stitches, top sheet
    c.save(); c.translate(3, 5); strokePaths(c, g, U * .86, 'rgba(26,32,58,.2)'); c.restore();
    strokePaths(c, g, U * .84, th.path2);
    strokePaths(c, g, U * .74, th.stitch, [6, 8]);
    strokePaths(c, g, U * .62, th.path);
    if (mini) {
      c.fillStyle = INK; for (const p of g.paths) circ(c, clamp(p.P[0].x, .2, W - .2) * U, clamp(p.P[0].y, .2, H - .2) * U, 22);
      c.fillStyle = '#e9564c'; circ(c, (g.base[0] + .5) * U, (g.base[1] + .5) * U, 26); c.fillStyle = PAPER; circ(c, (g.base[0] + .5) * U, (g.base[1] + .5) * U, 12);
    } else {
      // the spill where ink comes in
      for (const p of g.paths) {
        const sx = clamp(p.P[0].x, .02, W - .02) * U, sy = clamp(p.P[0].y, .02, H - .02) * U;
        c.fillStyle = 'rgba(26,22,58,.25)'; blob(c, sx + 3, sy + 4, 34, 1.3, 0, .16, 11);
        c.fillStyle = '#1c1838'; blob(c, sx, sy, 33, 1.3, 0, .16, 11);
        c.fillStyle = '#2f295e'; blob(c, sx + 2, sy - 2, 20, 4.1, 0, .2, 9);
        c.fillStyle = 'rgba(255,255,255,.22)'; circ(c, sx + 8, sy - 10, 4); circ(c, sx + 15, sy - 4, 2);
        c.fillStyle = '#1c1838'; circ(c, sx + 34, sy + 16, 6); circ(c, sx + 30, sy - 24, 4.5); circ(c, sx + 44, sy - 6, 3.5);
      }
    }
    // pond
    if (g.pond.length) {
      const pp = g.pond.map(t => [(t[0] + .5) * U, (t[1] + .5) * U]);
      const all = (fn) => { pp.forEach((q, i) => { fn(q[0], q[1]); if (i) fn((q[0] + pp[i - 1][0]) / 2, (q[1] + pp[i - 1][1]) / 2); }); };
      c.fillStyle = th.edge; all((x, y) => circ(c, x, y, 30));
      c.fillStyle = th.water[0]; all((x, y) => circ(c, x, y + 2, 26));
      c.fillStyle = th.water[1]; all((x, y) => circ(c, x - 3, y - 3, 17));
      if (!mini) {
        c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2; c.lineCap = 'round';
        c.beginPath(); c.arc(pp[0][0] + 4, pp[0][1] + 6, 9, 3.6, 5); c.stroke();
        const l = pp[pp.length - 1]; c.fillStyle = '#4fa56c'; c.beginPath(); c.moveTo(l[0] + 6, l[1] + 4); c.arc(l[0] + 6, l[1] + 4, 9, .5, 5.6); c.fill();
        c.fillStyle = '#ffc9d6'; circ(c, l[0] + 4, l[1] + 3, 3);
      }
    }
    for (const t of g.rocks) {
      const x = (t[0] + .5) * U, y = (t[1] + .5) * U;
      c.fillStyle = SH; c.beginPath(); c.ellipse(x + 4, y + 14, 24, 10, 0, 0, TAU); c.fill();
      c.fillStyle = th.rock[0]; c.beginPath(); c.moveTo(x - 22, y + 14); c.lineTo(x - 16, y - 8); c.lineTo(x - 2, y - 16); c.lineTo(x + 14, y - 6); c.lineTo(x + 22, y + 14); c.closePath(); c.fill();
      c.fillStyle = th.rock[1]; c.beginPath(); c.moveTo(x - 16, y - 8); c.lineTo(x - 2, y - 16); c.lineTo(x + 2, y + 2); c.lineTo(x - 12, y + 6); c.closePath(); c.fill();
      c.fillStyle = th.rock[0]; c.beginPath(); c.moveTo(x + 6, y + 16); c.lineTo(x + 12, y + 4); c.lineTo(x + 22, y + 6); c.lineTo(x + 26, y + 16); c.closePath(); c.fill();
    }
    for (const t of g.trees) {
      const x = (t[0] + .5) * U + (rnd() - .5) * 8, y = (t[1] + .5) * U + (rnd() - .5) * 6;
      if (g.map.theme === 'frost') {
        c.fillStyle = SH; c.beginPath(); c.ellipse(x + 6, y + 22, 22, 9, 0, 0, TAU); c.fill();
        c.fillStyle = '#7a5a45'; c.fillRect(x - 3, y + 14, 6, 9);
        for (let k = 0; k < 3; k++) {
          const w = 24 - k * 5, by = y + 16 - k * 13;
          c.fillStyle = th.tree[0]; tri(c, x - w, by, x, by - 22, x + w, by);
          c.fillStyle = th.tree[1]; tri(c, x - w, by, x, by - 22, x + 2, by);
          c.fillStyle = th.tree[2]; tri(c, x - w * .42, by - 13, x, by - 23, x + w * .42, by - 13);
        }
      } else if (g.map.theme === 'kraft') {
        c.fillStyle = SH; c.beginPath(); c.ellipse(x + 6, y + 22, 22, 8, 0, 0, TAU); c.fill();
        c.fillStyle = th.tree[0]; rr(c, x - 8, y - 24, 16, 46, 8); rr(c, x - 22, y - 8, 9, 19, 4.5); rr(c, x - 22, y + 3, 16, 8, 4); rr(c, x + 13, y - 15, 9, 19, 4.5); rr(c, x + 6, y - 4, 16, 8, 4);
        c.fillStyle = th.tree[1]; rr(c, x - 5, y - 21, 5, 40, 2.5); rr(c, x - 20, y - 6, 3, 13, 1.5); rr(c, x + 15, y - 13, 3, 13, 1.5);
        c.fillStyle = th.tree[2]; circ(c, x, y - 24, 4); circ(c, x + 17.5, y - 16, 3);
      } else {
        c.fillStyle = SH; c.beginPath(); c.ellipse(x + 7, y + 12, 25, 20, 0, 0, TAU); c.fill();
        c.fillStyle = th.tree[0]; circ(c, x, y + 2, 24); circ(c, x + 14, y + 10, 13);
        c.fillStyle = th.tree[1]; circ(c, x - 3, y - 3, 19); circ(c, x + 13, y + 7, 9);
        c.fillStyle = th.tree[2]; circ(c, x - 8, y - 9, 9);
        if (g.map.theme === 'blossom') for (let k = 0; k < 6; k++) circ(c, x + Math.cos(k * 1.9 + t[0]) * 14, y + 2 + Math.sin(k * 1.9 + t[0]) * 13, 2.6);
      }
    }
  }

  /* ---------- sprites ---------- */
  const TACK_AT = [[-11, -11], [11, 11], [0, 0], [11, -11], [-11, 11], [0, -13], [0, 13], [-13, 0], [13, 0]];
  function drawTacks(c, lvl, spec, kick) {
    c.fillStyle = 'rgba(26,22,58,.2)'; rr(c, -20, -18, 44, 44, 9);
    c.fillStyle = '#a97a4c'; rr(c, -22, -20, 44, 44, 9); c.fillStyle = '#c69a69'; rr(c, -22, -22, 44, 42, 9);
    c.fillStyle = 'rgba(120,80,40,.35)'; for (let i = 0; i < 9; i++) circ(c, Math.sin(i * 2.3) * 17, Math.cos(i * 3.1) * 16 - 1, 1.5);
    if (spec === 0) {
      c.strokeStyle = '#59627a'; c.lineWidth = 2.2;
      for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(i * 7, -1 + (i % 2 ? 6 : -6), 9, 0, TAU); c.stroke(); }
    }
    const n = spec >= 0 ? 9 : 5 + lvl * 2, head = spec === 0 ? '#e9564c' : '#8f9bb3', hi = spec === 0 ? '#ffb0a8' : '#eef2f8';
    for (let i = 0; i < n; i++) {
      const x = TACK_AT[i][0], y = TACK_AT[i][1] - 1 - kick * (i % 2 ? 2.5 : 1);
      if (spec === 1 && i === 2) continue;
      c.fillStyle = 'rgba(26,22,58,.3)'; circ(c, x + 1.5, y + 3, 4.6);
      c.fillStyle = spec === 0 ? '#b93a33' : '#636d87'; circ(c, x, y + 1, 4.6); c.fillStyle = head; circ(c, x, y, 4.6);
      c.fillStyle = hi; circ(c, x - 1.3, y - 1.4, 1.9); c.fillStyle = INK; circ(c, x + .8, y + .9, 1.1);
    }
    if (spec === 1) {
      const s = 1 + kick * .5;
      c.fillStyle = 'rgba(26,22,58,.3)'; circ(c, 1.5, 2.5, 10 * s);
      c.fillStyle = '#c58a12'; circ(c, 0, 0, 10 * s); c.fillStyle = '#f2b632'; circ(c, 0, -1, 9 * s);
      c.strokeStyle = '#c58a12'; c.lineWidth = 1.8; c.beginPath(); c.arc(0, -1, 5.5 * s, 0, TAU); c.stroke(); c.fillStyle = '#fff6d0'; circ(c, 0, -1, 2.4 * s);
    }
  }
  function drawTower(c, kind, lvl, spec, ang, kick, time) {
    if (kind === 'tacks') return drawTacks(c, lvl, spec, kick);
    const col = TC[kind], m = col[0], d = col[1], l = col[2];
    c.fillStyle = SH; rr(c, -20, -17, 48, 48, 12);
    c.fillStyle = '#d3c6a9'; rr(c, -24, -20, 48, 48, 12);
    c.fillStyle = PAPER; rr(c, -24, -24, 48, 48, 12);
    c.fillStyle = d; circ(c, 0, -2, 19); c.fillStyle = m; circ(c, 0, -4, 19);
    const n = spec >= 0 ? 3 : lvl + 1;
    c.fillStyle = spec >= 0 ? '#f2b632' : INK;
    for (let i = 0; i < n; i++) circ(c, (i - (n - 1) / 2) * 8, 19.5, 2.4);
    if (spec >= 0) { c.strokeStyle = '#f2b632'; c.lineWidth = 2.6; c.beginPath(); c.arc(0, -4, 20.5, 0, TAU); c.stroke(); }
    if (kind === 'banner') return drawBanner(c, lvl, spec, time, col);
    if (kind === 'press') return drawPress(c, lvl, spec, kick, col);
    c.save(); c.translate(0, -4);
    if (kind === 'quill') {
      c.rotate(ang); c.translate(-kick * 6, 0);
      const rows = spec === 0 ? [-9, 0, 9] : (lvl >= 2 && spec < 0) ? [-5, 5] : [0];
      const len = spec === 1 ? 31 : 20 + lvl * 2, wd = spec === 1 ? 9 : rows.length > 1 ? 6.5 : 8;
      for (const y of rows) {
        c.fillStyle = SH; rr(c, -12, y - wd / 2 + 3, len + 12, wd, 2);
        c.fillStyle = '#f4a7b4'; rr(c, -14, y - wd / 2, 6, wd, 2);
        c.fillStyle = '#c9ccd6'; c.fillRect(-10, y - wd / 2, 4, wd);
        c.fillStyle = '#ffd166'; c.fillRect(-6, y - wd / 2, len - 2, wd);
        c.fillStyle = '#eeb23a'; c.fillRect(-6, y + wd / 6, len - 2, wd / 3);
        c.fillStyle = '#f3dcb3'; tri(c, len - 8, y - wd / 2, len + 1, y, len - 8, y + wd / 2);
        c.fillStyle = INK; tri(c, len - 3, y - wd / 5, len + 1, y, len - 3, y + wd / 5);
      }
      c.fillStyle = d; circ(c, -3, 0, 9); c.fillStyle = l; circ(c, -3, -1, 6);
      if (spec === 1) { c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(9, 0, 6.5, 0, TAU); c.moveTo(9, -6.5); c.lineTo(9, 6.5); c.stroke(); }
    } else if (kind === 'mortar') {
      c.rotate(ang); c.translate(-kick * 5, 0);
      const R = spec === 1 ? 17 : 13.5 + lvl * 1.2;
      c.fillStyle = SH; circ(c, 2, 4, R);
      c.fillStyle = '#5b5670'; rr(c, -5, -R - 3, 9, 2 * R + 6, 3);
      c.fillStyle = d; circ(c, 0, 0, R); c.fillStyle = l; circ(c, -1, -1, R - 2.5); c.fillStyle = m; circ(c, 0, 0, R - 5);
      c.fillStyle = INK;
      if (spec === 0) for (let i = 0; i < 3; i++) circ(c, 3 + Math.cos(i * 2.094) * 5.5, Math.sin(i * 2.094) * 5.5, 3.6);
      else circ(c, 3, 0, R * .5);
      if (spec === 1) { c.strokeStyle = '#c9ccd6'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, R - 1.5, 0, TAU); c.stroke(); }
    } else if (kind === 'glue') {
      const s = 1 + kick * .14; c.scale(s, s);
      c.fillStyle = l; for (let i = 0; i < 5 + lvl; i++) circ(c, Math.cos(i * 1.9 + .4) * 15, Math.sin(i * 1.9 + .4) * 15, 3.5 + (i % 3));
      c.fillStyle = SH; circ(c, 2, 4, 13);
      c.fillStyle = '#d9d0bb'; circ(c, 0, 1.5, 13); c.fillStyle = '#fdfaf2'; circ(c, 0, 0, 13);
      c.strokeStyle = m; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 9.5, 0, TAU); c.stroke();
      c.fillStyle = spec === 0 ? '#e9564c' : spec === 1 ? '#8a63d2' : '#f28a3c'; circ(c, 0, 0, 6);
      c.fillStyle = 'rgba(255,255,255,.55)'; circ(c, -1.5, -1.5, 2.6);
    } else if (kind === 'spark') {
      const spin = time * .9, np = spec === 0 ? 8 : 3 + lvl + (spec === 1 ? 1 : 0);
      for (let i = 0; i < np; i++) {
        const a = spin + i * TAU / np, cx = Math.cos(a), cy = Math.sin(a);
        c.strokeStyle = d; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx * 9, cy * 9); c.lineTo(cx * 16, cy * 16); c.stroke();
        c.fillStyle = '#ffe36e'; circ(c, cx * 17.5, cy * 17.5, 2.7);
      }
      c.fillStyle = d; circ(c, 0, 0, 12); c.fillStyle = l; circ(c, 0, -1, 9); c.fillStyle = d; circ(c, 0, 0, 6);
      if (kick > 0) { c.fillStyle = 'rgba(255,240,150,' + kick * .55 + ')'; circ(c, 0, 0, 10 + kick * 9); }
      c.fillStyle = '#ffe36e'; circ(c, 0, 0, 4 + kick * 2);
    } else if (kind === 'fan') {
      const nb = spec === 0 ? 6 : 4, L = spec === 1 ? 19 : 14 + lvl * 1.4, spin = time * (spec === 1 ? 6 : 1.4) + kick * 2.5;
      c.fillStyle = SH; circ(c, 2, 4, L * .8);
      c.save(); c.rotate(spin);
      for (let i = 0; i < nb; i++) {
        c.save(); c.rotate(i * TAU / nb);
        c.fillStyle = i % 2 ? l : '#fffaf0'; tri(c, 0, 0, L, -1, L * .32, -L * .78);
        c.fillStyle = i % 2 ? m : '#e7dcc6'; tri(c, 0, 0, L * .32, -L * .78, L * .16, -L * .38);
        c.restore();
      }
      c.restore();
      c.fillStyle = d; circ(c, 0, 0, 4.4); c.fillStyle = '#f2b632'; circ(c, 0, -.5, 2.6);
      if (spec === 0) { c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath(); c.arc(0, 0, L + 1.5, spin, spin + 1.4); c.stroke(); c.beginPath(); c.arc(0, 0, L + 1.5, spin + 3.1, spin + 4.5); c.stroke(); c.lineCap = 'butt'; }
    } else if (kind === 'plane') {
      c.fillStyle = d; rr(c, -15, -8, 30, 17, 8); c.fillStyle = l; rr(c, -15, -9, 30, 9, 5);
      c.fillStyle = INK; rr(c, -9, -2, 18, 10, 5);
      c.rotate(ang); c.translate(-kick * 5, 0);
      const pl = (x, y, k) => {
        c.fillStyle = 'rgba(26,22,58,.22)'; tri(c, x + 16 * k + 2, y + 3, x - 12 * k + 2, y - 10 * k + 3, x - 12 * k + 2, y + 10 * k + 3);
        c.fillStyle = '#fffaf0'; tri(c, x + 16 * k, y, x - 12 * k, y - 11 * k, x - 6 * k, y);
        c.fillStyle = '#e3d8c2'; tri(c, x + 16 * k, y, x - 12 * k, y + 11 * k, x - 6 * k, y);
        c.strokeStyle = '#c9bc9f'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + 16 * k, y); c.lineTo(x - 9 * k, y); c.stroke();
      };
      if (spec === 0) { pl(4, -7, .6); pl(4, 7, .6); pl(-2, 0, .7); }
      else { pl(0, 0, .8 + lvl * .08); if (spec === 1) { c.fillStyle = '#e9564c'; circ(c, -4, 0, 3.6); c.fillStyle = INK; circ(c, -4, 0, 1.5); } }
    } else if (kind === 'punch') {
      c.rotate(ang);
      const n = spec === 1 ? 3 : 1;
      c.fillStyle = SH; rr(c, -12, -8, 28, 20, 6);
      c.fillStyle = '#5b5670'; rr(c, -14, -11, 28, 22, 6); c.fillStyle = '#7d7896'; rr(c, -14, -11, 28, 9, 5);
      c.fillStyle = m; rr(c, -16 + kick * 4, -6, 24, 12, 5); c.fillStyle = l; rr(c, -16 + kick * 4, -6, 24, 5, 3);
      c.fillStyle = '#fffaf0'; rr(c, 10, -10, 7, 20, 2);
      c.fillStyle = INK; for (let i = 0; i < n; i++) circ(c, 13.5, n === 1 ? 0 : (i - 1) * 6, 2.3);
      if (spec === 0) { c.strokeStyle = '#dfe5f0'; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-10, 11.5); c.lineTo(16, 11.5); c.stroke(); c.lineCap = 'butt'; }
    } else {
      c.rotate(ang);
      const R = spec === 1 ? 15 : 11 + lvl * 1.2;
      c.fillStyle = SH; rr(c, -24, 1, 16, 6, 3); c.fillStyle = '#7a4f35'; rr(c, -26, -3, 17, 6, 3);
      c.fillStyle = SH; circ(c, 5, 4, R + 3);
      c.fillStyle = d; circ(c, 3, 0, R + 3.5); c.fillStyle = m; circ(c, 3, -1, R + 2);
      if (spec === 0) {
        c.fillStyle = '#d6f1ff'; tri(c, 3 + R - 1, -1, 3 - R * .55, -1 - R * .85, 3 - R * .55, -1 + R * .85);
        c.fillStyle = '#ff8fb0'; tri(c, 3 + R - 1, -1, 3 - R * .55, -1 - R * .85, 3 - R * .2, -1 - R * .25);
        c.fillStyle = '#7fe0d0'; tri(c, 3 + R - 1, -1, 3 - R * .55, -1 + R * .85, 3 - R * .2, -1 + R * .25);
      } else {
        c.fillStyle = '#bfe6fb'; circ(c, 3, -1, R - 1); c.fillStyle = '#eaf8ff'; circ(c, 0, -4, R * .42);
        if (spec === 1) { c.strokeStyle = d; c.lineWidth = 2; c.beginPath(); c.arc(3, -1, R * .55, 0, TAU); c.stroke(); }
      }
      if (kick > 0) { c.fillStyle = 'rgba(255,246,190,' + kick * .75 + ')'; circ(c, 3, -1, R - 1); }
    }
    c.restore();
  }
  function drawBanner(c, lvl, spec, time, col) {
    c.save(); c.translate(0, -4);
    if (spec === 0) {
      const b = 1 + .07 * Math.max(0, Math.sin(time * 7));
      c.fillStyle = SH; circ(c, 2, 4, 15);
      c.fillStyle = '#7a4f35'; circ(c, 0, 1.5, 15); c.fillStyle = col[1]; circ(c, 0, 0, 15);
      c.fillStyle = '#f6ead2'; circ(c, 0, 0, 11.5 * b); c.fillStyle = '#fffaf0'; circ(c, -2, -2, 6);
      c.fillStyle = '#f2b632'; for (let i = 0; i < 8; i++) circ(c, Math.cos(i * .785) * 13.2, Math.sin(i * .785) * 13.2, 1.5);
      c.strokeStyle = '#c9a06a'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(-10, 9); c.lineTo(6, -8); c.moveTo(10, 9); c.lineTo(-6, -8); c.stroke(); c.lineCap = 'butt';
      c.fillStyle = '#fff6e6'; circ(c, 6, -8, 2.6); circ(c, -6, -8, 2.6);
    } else {
      const w = Math.sin(time * 5) * 2.5, flags = spec === 1 ? 2 : 1 + (lvl > 0 ? 1 : 0);
      c.fillStyle = SH; rr(c, -1, -4, 5, 22, 2);
      c.fillStyle = '#5b5670'; rr(c, -2.5, -22, 5, 37, 2.5);
      for (let i = 0; i < flags; i++) {
        const y = -21 + i * 13, len = i ? 15 : 21 + lvl * 1.5;
        c.fillStyle = 'rgba(26,22,58,.25)'; c.beginPath(); c.moveTo(4, y + 3); c.quadraticCurveTo(12, y + w, len + 2, y + 9 + w); c.quadraticCurveTo(12, y + 14 + w, 4, y + 15); c.fill();
        c.fillStyle = i ? '#f2b632' : '#fff6e6'; c.beginPath(); c.moveTo(2, y); c.quadraticCurveTo(11, y - 3 + w, len, y + 6 + w); c.quadraticCurveTo(11, y + 11 + w, 2, y + 12); c.fill();
        if (!i) { c.fillStyle = col[0]; circ(c, 9, y + 6 + w * .5, 2.8); }
      }
      c.fillStyle = '#f2b632'; circ(c, 0, -23, 3.4);
      if (spec === 1) { c.fillStyle = '#7a4f35'; rr(c, -17, 4, 15, 6, 3); c.fillStyle = '#bfe6fb'; circ(c, -17, 7, 3.6); }
    }
    c.restore();
  }
  function drawPress(c, lvl, spec, kick, col) {
    c.save(); c.translate(0, -4);
    const o = kick * 7;
    c.fillStyle = SH; rr(c, -13, -9, 30, 25, 5);
    c.fillStyle = '#fffaf0'; rr(c, -9, -2, 18, 15 + o, 2);
    c.fillStyle = '#c58a12'; circ(c, 0, 7.6 + o, 4.4); c.fillStyle = '#f2b632'; circ(c, 0, 6.8 + o, 4.2);
    c.fillStyle = col[1]; rr(c, -15, -14, 30, 17, 5); c.fillStyle = col[2]; rr(c, -15, -15, 30, 9, 4.5);
    c.fillStyle = INK; rr(c, -11, 0, 22, 3, 1.5);
    c.fillStyle = '#5b5670'; circ(c, -10, -10.5, 2.2); circ(c, 10, -10.5, 2.2);
    if (spec === 0) { for (let i = 0; i < 3; i++) { c.fillStyle = '#c58a12'; circ(c, 13, 12 - i * 4, 5); c.fillStyle = '#f2b632'; circ(c, 13, 11 - i * 4, 4.6); } }
    else if (spec === 1) { c.fillStyle = '#e9564c'; circ(c, -3, -11, 3.2); circ(c, 3, -11, 3.2); tri(c, -6, -9.8, 6, -9.8, 0, -3.4); }
    else for (let i = 0; i < lvl; i++) { c.fillStyle = '#f2b632'; circ(c, -4 + i * 8, -10.5, 2.2); }
    c.restore();
  }

  function eyes(c, R, a, t, n, spread) {
    const fx = Math.cos(a), fy = Math.sin(a), blink = (t * 1.1) % 4.2 < .12;
    for (let i = 0; i < n; i++) {
      const s = n === 1 ? 0 : (i / (n - 1) - .5) * 2 * spread;
      const ex = fx * R * .34 - fy * R * s, ey = fy * R * .34 + fx * R * s - R * .1, er = R * (n === 3 && i === 1 ? .27 : .23);
      if (blink) { c.strokeStyle = '#fff'; c.lineWidth = Math.max(1.2, R * .08); c.beginPath(); c.moveTo(ex - er, ey); c.lineTo(ex + er, ey); c.stroke(); continue; }
      c.fillStyle = '#fff'; circ(c, ex, ey, er);
      c.fillStyle = '#17132e'; circ(c, ex + fx * er * .4, ey + fy * er * .4, er * .52);
    }
  }
  function drawEnemy(c, e, time) {
    const R = e.r * U, t = time + e.seed, ty = e.type, flash = time - e.hitT < .07;
    const age = time - e.born, sc = age < .22 ? .35 + .65 * age / .22 : 1, big = !!e.E.boss;
    c.save(); c.translate(e.x * U, e.y * U);
    if (e.hid) c.globalAlpha = .24;
    const hp = time - e.hopAt, jump = hp >= 0 && hp < .3 ? Math.sin(hp / .3 * Math.PI) * 16 : 0;
    if (e.fly) {
      c.fillStyle = 'rgba(26,22,58,.16)'; c.beginPath(); c.ellipse(9, 24, R * .8, R * .42, 0, 0, TAU); c.fill();
      c.translate(0, -10 + Math.sin(t * 5) * 3);
    } else {
      if (e.slowT > 0) { c.fillStyle = e.vuln > 0 ? 'rgba(160,120,230,.6)' : 'rgba(60,200,185,.6)'; c.beginPath(); c.ellipse(0, R * .62, R * 1.25, R * .55, 0, 0, TAU); c.fill(); }
      c.fillStyle = SH; c.beginPath(); c.ellipse(2, R * .62, R * 1.02, R * .52, 0, 0, TAU); c.fill();
    }
    if (e.elite) { c.strokeStyle = '#f2b632'; c.lineWidth = 3.2; c.beginPath(); c.ellipse(0, e.fly ? R * .2 : R * .62, R * 1.18, R * .6, 0, 0, TAU); c.stroke(); }
    if (jump) c.translate(0, -jump);
    if (ty === 'streak' && e.dashOn > 0) {
      const bx = -Math.cos(e.a), by = -Math.sin(e.a), nx = -by, ny = bx;
      c.strokeStyle = 'rgba(160,140,255,.75)'; c.lineWidth = 3; c.lineCap = 'round';
      for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(bx * R + nx * i * R * .5, by * R + ny * i * R * .5); c.lineTo(bx * R * 3 + nx * i * R * .5, by * R * 3 + ny * i * R * .5); c.stroke(); }
      c.lineCap = 'butt';
    }
    if (ty === 'stamp' && e.stompT != null && e.stompT < .35) { const k = e.stompT / .35; c.scale(1 + .25 * (1 - k), 1 - .2 * (1 - k)); }
    c.scale(sc, sc);
    const q = Math.sin(t * (5 + e.spd * 3)) * (e.stun > 0 || ty === 'balloon' ? 0 : .07);
    c.save(); c.rotate(e.a); c.scale(1 + q, 1 - q); c.rotate(-e.a);
    const body = flash ? '#ffffff' : EC[ty];
    c.fillStyle = body;
    if (ty === 'speck') circ(c, 0, 0, R);
    else if (ty === 'wasp') {
      const f = Math.sin(t * 34) * .5 + .6;
      c.save(); c.rotate(e.a);
      c.fillStyle = flash ? '#fff' : 'rgba(220,226,255,.75)';
      for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(-R * .1, sd * R * 1.05 * f, R * .95, R * .42, sd * .5, 0, TAU); c.fill(); }
      c.fillStyle = body; c.beginPath(); c.ellipse(0, 0, R * 1.25, R * .78, 0, 0, TAU); c.fill(); tri(c, -R * 1.1, -R * .25, -R * 1.75, 0, -R * 1.1, R * .25);
      if (!flash) { c.fillStyle = '#f2b632'; c.fillRect(-R * .55, -R * .7, R * .28, R * 1.4); c.fillRect(-R * .05, -R * .76, R * .28, R * 1.52); }
      c.restore();
    }
    else if (ty === 'streak') { c.save(); c.rotate(e.a); c.beginPath(); c.ellipse(R * .2, 0, R * 1.15, R * .8, 0, 0, TAU); c.fill(); tri(c, -R * .4, -R * .75, -R * 2.1, 0, -R * .4, R * .75); if (!flash) { c.fillStyle = '#8f7cf0'; tri(c, R * .9, -R * .2, -R * 1.2, -R * .1, R * .1, -R * .55); } c.restore(); }
    else if (ty === 'sponge') {
      rr(c, -R, -R * .9, R * 2, R * 1.8, R * .45);
      if (!flash) { c.fillStyle = '#6f6eaa'; rr(c, -R * .9, -R * .9, R * 1.8, R * .7, R * .35); c.fillStyle = '#2c2b55'; for (let i = 0; i < 7; i++) circ(c, Math.cos(i * 2.4 + 1) * R * .6, Math.sin(i * 2.4 + 1) * R * .5 + R * .05, R * (.08 + (i % 3) * .04)); }
    }
    else if (ty === 'stamp') {
      rr(c, -R * 1.05, -R * .55, R * 2.1, R * 1.25, R * .25);
      if (!flash) { c.fillStyle = '#8a3a5c'; rr(c, -R * 1.05, R * .4, R * 2.1, R * .32, R * .14); c.fillStyle = '#7a5a45'; rr(c, -R * .28, -R * 1.25, R * .56, R * .8, R * .2); c.fillStyle = '#a07a5c'; circ(c, 0, -R * 1.3, R * .42); c.fillStyle = 'rgba(255,255,255,.3)'; circ(c, -R * .12, -R * 1.42, R * .14); }
    }
    else if (ty === 'king') {
      blob(c, 0, 0, R, e.seed, t, .05, 14);
      if (!flash) {
        c.fillStyle = '#8d93a8'; for (let i = 0; i < 10; i++) { const a = i * .628 + t * .15; circ(c, Math.cos(a) * R * .92, Math.sin(a) * R * .92, R * .16); }
        c.fillStyle = '#c8cddb'; for (let i = 0; i < 10; i++) { const a = i * .628 + t * .15; circ(c, Math.cos(a) * R * .92, Math.sin(a) * R * .92 - 1.5, R * .11); }
        c.fillStyle = '#7d2a4f'; blob(c, -R * .05, R * .1, R * .62, e.seed + 1, t, .06, 11);
        c.fillStyle = '#121034'; blob(c, -R * .05, -R * .08, R * .55, e.seed + 2, t, .07, 11);
      }
    }
    else if (ty === 'drip') { c.save(); c.rotate(e.a); circ(c, R * .25, 0, R); tri(c, R * .1, -R * .92, -R * 1.9, 0, R * .1, R * .92); c.restore(); }
    else if (ty === 'moth') {
      const f = Math.sin(t * 20) * .55 + .6;
      c.save(); c.rotate(e.a);
      c.fillStyle = flash ? '#fff' : '#5a55a6';
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(R * .2, 0); c.quadraticCurveTo(R * .5, s * R * 2.1 * f, -R * .9, s * R * 1.5 * f); c.quadraticCurveTo(-R * .5, s * R * .3, R * .2, 0); c.fill(); }
      c.fillStyle = body; c.beginPath(); c.ellipse(0, 0, R * .95, R * .62, 0, 0, TAU); c.fill();
      c.restore();
    }
    else if (ty === 'skip') {
      c.fillStyle = flash ? '#fff' : '#1c2a70'; c.beginPath(); c.ellipse(-R * .5, R * .78, R * .36, R * .2, 0, 0, TAU); c.ellipse(R * .5, R * .78, R * .36, R * .2, 0, 0, TAU); c.fill();
      c.fillStyle = body; blob(c, 0, 0, R, e.seed, t, .06, 9);
      c.strokeStyle = flash ? '#fff' : '#6f86e8'; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath(); c.moveTo(-R * .3, -R * .8); c.lineTo(-R * .55, -R * 1.45); c.moveTo(R * .3, -R * .8); c.lineTo(R * .55, -R * 1.45); c.stroke(); c.lineCap = 'butt';
      c.fillStyle = '#ffe36e'; circ(c, -R * .55, -R * 1.45, 2.2); circ(c, R * .55, -R * 1.45, 2.2);
    }
    else if (ty === 'slick') {
      c.save(); c.rotate(e.a); c.beginPath(); c.ellipse(0, 0, R * 1.3, R * .82, 0, 0, TAU); c.fill(); tri(c, -R * .9, -R * .6, -R * 2, 0, -R * .9, R * .6);
      if (!flash) {
        c.fillStyle = 'rgba(111,224,208,.55)'; c.beginPath(); c.ellipse(-R * .25, R * .3, R * .5, R * .2, 0, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,143,176,.5)'; c.beginPath(); c.ellipse(R * .1, -R * .1, R * .42, R * .16, .3, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); c.arc(0, R * .1, R * .95, -2.3, -1.2); c.stroke(); c.lineCap = 'butt';
      }
      c.restore();
    }
    else if (ty === 'fader') {
      blob(c, 0, 0, R, e.seed, t, .09, 9);
      if (!flash) { c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.8; c.setLineDash([4, 5]); c.beginPath(); c.arc(0, 0, R * 1.18, 0, TAU); c.stroke(); c.setLineDash([]); }
    }
    else if (ty === 'balloon') {
      c.strokeStyle = 'rgba(34,29,70,.6)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, R); c.quadraticCurveTo(5, R + 9, -2, R + 17); c.quadraticCurveTo(-7, R + 23, 0, R + 30); c.stroke();
      c.beginPath(); c.ellipse(0, -R * .08, R * .95, R * 1.06, 0, 0, TAU); c.fill(); tri(c, -R * .18, R * .92, R * .18, R * .92, 0, R * 1.22);
      if (!flash) { c.fillStyle = '#5a55a6'; c.beginPath(); c.ellipse(-R * .2, -R * .3, R * .62, R * .7, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-R * .42, -R * .55, R * .16, R * .26, .5, 0, TAU); c.fill(); }
    }
    else if (ty === 'splat') {
      c.beginPath();
      for (let i = 0; i < 18; i++) { const a = i / 18 * TAU + t * .6, k = R * (i % 2 ? .72 : 1.22 + .08 * Math.sin(t * 6 + i)); if (i) c.lineTo(Math.cos(a) * k, Math.sin(a) * k); else c.moveTo(Math.cos(a) * k, Math.sin(a) * k); }
      c.closePath(); c.fill();
      if (!flash) { c.fillStyle = '#a23a8c'; circ(c, 0, 0, R * .62); }
    }
    else if (big && ty === 'flood') {
      const f = Math.sin(t * 9) * .35 + .75;
      c.fillStyle = flash ? '#fff' : '#3e55b3';
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * R * .3, -R * .2); c.quadraticCurveTo(s * R * 1.5, -R * 1.7 * f, s * R * 2.2, -R * .5 * f); c.quadraticCurveTo(s * R * 1.6, R * .5, s * R * .3, R * .4); c.fill(); }
      c.fillStyle = body; blob(c, 0, 0, R, e.seed, t, .06, 13);
      c.fillStyle = flash ? '#fff' : '#27397f'; blob(c, -R * .1, -R * .12, R * .7, e.seed + 2, t, .07, 11);
    }
    else if (ty === 'boss') {
      blob(c, 0, 0, R, e.seed, t, .07, 14);
      c.fillStyle = flash ? '#fff' : '#2a2456'; blob(c, -R * .1, -R * .12, R * .72, e.seed + 2, t, .08, 11);
      c.fillStyle = body; for (let i = 0; i < 5; i++) { const a = e.seed + i * 1.257 + t * .3; circ(c, Math.cos(a) * R * 1.12, Math.sin(a) * R * 1.12, R * (.1 + (i % 2) * .05)); }
    }
    else if (ty === 'smudge') { blob(c, 0, 0, R, e.seed, t, .1, 11); c.fillStyle = flash ? '#fff' : '#2b2650'; circ(c, -R * .3, R * .3, R * .22); circ(c, R * .35, R * .38, R * .15); }
    else if (ty === 'glob') { blob(c, 0, 0, R, e.seed, t, .12, 10); c.fillStyle = flash ? '#fff' : '#a35bbb'; circ(c, -R * .45, R * .2, R * .2); circ(c, R * .3, R * .45, R * .14); circ(c, R * .5, -R * .35, R * .11); }
    else blob(c, 0, 0, R, e.seed, t, .08, 9);
    if (ty === 'shell' && !flash) {
      c.fillStyle = '#8d93a8'; for (let i = 0; i < 12; i++) circ(c, Math.cos(i * .5236) * R * .6, Math.sin(i * .5236) * R * .6 - R * .16, R * .13);
      c.fillStyle = '#c8cddb'; circ(c, 0, -R * .16, R * .58); c.fillStyle = '#e6e9f1'; circ(c, -R * .08, -R * .24, R * .38);
      c.fillStyle = '#8d93a8'; circ(c, -R * .08, -R * .24, R * .12);
    }
    if (e.holes) { c.fillStyle = PAPER; for (let i = 0; i < e.holes; i++) circ(c, (i - (e.holes - 1) / 2) * R * .42, R * .38, Math.max(2, R * .13)); }
    if (ty === 'well' && !flash) {
      const p = .5 + .5 * Math.sin(t * 4);
      c.strokeStyle = 'rgba(95,224,184,' + (.35 + p * .4) + ')'; c.lineWidth = 2.5; c.beginPath(); c.arc(0, 0, R * (1.25 + p * .15), 0, TAU); c.stroke();
      c.fillStyle = '#5fe0b8'; rr(c, -R * .16, -R * .78, R * .32, R * .7, 2); rr(c, -R * .35, -R * .59, R * .7, R * .32, 2);
    }
    c.restore();
    if (!flash && ty !== 'speck') { c.fillStyle = 'rgba(255,255,255,.13)'; circ(c, -R * .32, -R * .4, R * .26); }
    if (e.elite) drawElite(c, e, R, time);
    if (big) {
      eyes(c, R * (ty === 'king' ? .8 : 1), ty === 'flood' ? Math.PI / 2 : e.a, t, 3, .42);
      c.fillStyle = '#c58a12'; rr(c, -R * .42, -R * 1.06, R * .84, R * .2, 2);
      c.fillStyle = '#f2b632'; c.beginPath(); c.moveTo(-R * .42, -R * .9); c.lineTo(-R * .46, -R * 1.42); c.lineTo(-R * .2, -R * 1.12); c.lineTo(0, -R * 1.5); c.lineTo(R * .2, -R * 1.12); c.lineTo(R * .46, -R * 1.42); c.lineTo(R * .42, -R * .9); c.closePath(); c.fill();
      c.fillStyle = '#e9564c'; circ(c, 0, -R * 1.08, R * .07);
    } else if (ty === 'speck') { c.fillStyle = '#fff'; circ(c, Math.cos(e.a) * R * .3, Math.sin(e.a) * R * .3 - 1, R * .38); }
    else if (ty === 'wasp') { c.fillStyle = '#fff'; circ(c, Math.cos(e.a) * R * .6, Math.sin(e.a) * R * .6 - 1, R * .34); c.fillStyle = '#17132e'; circ(c, Math.cos(e.a) * R * .7, Math.sin(e.a) * R * .7 - 1, R * .16); }
    else if (ty === 'stamp') { for (const sd of [-1, 1]) { c.fillStyle = '#fff'; circ(c, sd * R * .38, -R * .05, R * .2); c.fillStyle = '#17132e'; circ(c, sd * R * .38 + Math.cos(e.a) * 2, -R * .02, R * .1); } c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(-R * .6, -R * .35); c.lineTo(-R * .15, -R * .22); c.moveTo(R * .6, -R * .35); c.lineTo(R * .15, -R * .22); c.stroke(); }
    else if (ty === 'balloon') eyes(c, R * .8, Math.PI / 2, t, 2, .34);
    else if (ty === 'splat') { for (const s of [-1, 1]) { c.fillStyle = '#ffb347'; circ(c, s * R * .26, -R * .08, R * .2); c.fillStyle = '#17132e'; circ(c, s * R * .26, -R * .04, R * .09); } }
    else if (ty === 'slick') eyes(c, R * .9, e.a, t, 2, .3);
    else if (ty !== 'shell') eyes(c, R, e.a, t, 2, ty === 'drip' ? .36 : .34);
    else { const fx = Math.cos(e.a), fy = Math.sin(e.a); for (const s of [-1, 1]) { c.fillStyle = '#fff'; circ(c, fx * R * .74 - fy * R * .34 * s, fy * R * .74 + fx * R * .34 * s, R * .2); c.fillStyle = '#17132e'; circ(c, fx * R * .8 - fy * R * .34 * s, fy * R * .8 + fx * R * .34 * s, R * .1); } }
    if (e.stun > 0) { c.fillStyle = '#ffe36e'; for (let i = 0; i < 3; i++) { const a = time * 7 + i * 2.094; circ(c, Math.cos(a) * R * .8, -R - 5 + Math.sin(a) * 3, 2.6); } }
    c.restore();
  }
  function drawElite(c, e, R, time) {
    const k = e.elite;
    if (k === 'armored') {
      c.strokeStyle = '#c8cddb'; c.lineWidth = 3.6; c.beginPath(); c.arc(0, 0, R * 1.05, 0, TAU); c.stroke();
      c.fillStyle = '#8d93a8'; for (let i = 0; i < 6; i++) circ(c, Math.cos(i * 1.047) * R * 1.05, Math.sin(i * 1.047) * R * 1.05, 2.3);
    } else if (k === 'swift') {
      const bx = -Math.cos(e.a), by = -Math.sin(e.a), nx = -by, ny = bx, j = (time * 40) % 7;
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2.4; c.lineCap = 'round';
      for (let i = -1; i <= 1; i++) { const o = i * R * .45, s = R * (1.2 + (i ? 0 : .25)); c.beginPath(); c.moveTo(bx * s + nx * o, by * s + ny * o); c.lineTo(bx * (s + R * .8 + j) + nx * o, by * (s + R * .8 + j) + ny * o); c.stroke(); }
      c.lineCap = 'butt';
    } else if (k === 'shield' && e.shield > 0) {
      const f = e.shield / e.shieldMax;
      c.fillStyle = 'rgba(127,214,255,' + (.1 + .14 * f) + ')'; circ(c, 0, 0, R * 1.42);
      c.strokeStyle = 'rgba(127,214,255,' + (.45 + .5 * f) + ')'; c.lineWidth = 2.4; c.beginPath(); c.arc(0, 0, R * 1.42, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-R * .6, -R * .85, R * .32, R * .13, -.6, 0, TAU); c.fill();
    } else if (k === 'regen') {
      const p = .5 + .5 * Math.sin(time * 5 + e.seed), x = R * .9, y = -R * .95, s = 3.4 + p;
      c.fillStyle = 'rgba(26,22,58,.5)'; circ(c, x, y, s + 2.5);
      c.fillStyle = 'rgba(111,208,140,' + (.6 + .4 * p) + ')'; rr(c, x - s / 2.6, y - s, s / 1.3, s * 2, 1); rr(c, x - s, y - s / 2.6, s * 2, s / 1.3, 1);
    }
  }
  function drawHp(c, e) {
    if ((e.hp >= e.max && !(e.shield > 0)) || e.E.boss || e.hid) return;
    const R = e.r * U, w = Math.max(20, R * 1.9), x = e.x * U - w / 2, y = e.y * U - R - 11 - (e.fly ? 12 : 0), f = clamp(e.hp / e.max, 0, 1);
    c.fillStyle = INK; rr(c, x - 1.5, y - 1.5, w + 3, 7, 3.5);
    c.fillStyle = f > .5 ? '#6fd08c' : f > .25 ? '#f2b632' : '#e9564c'; rr(c, x, y, Math.max(3, w * f), 4, 2);
    if (e.shield > 0) { c.fillStyle = '#7fd6ff'; rr(c, x, y - 3.5, Math.max(3, w * e.shield / e.shieldMax), 3, 1.5); }
    if (e.elite) { c.fillStyle = '#f2b632'; circ(c, x - 6, y + 2, 3.4); }
  }
  function drawCastle(c, x, y, time, hit, dmg) {
    dmg = dmg || 0;
    c.save(); c.translate(x + (hit > 0 ? Math.sin(hit * 30) * 4 * hit : 0), y - 4); c.scale(1.08, 1.08);
    c.fillStyle = SH; c.beginPath(); c.ellipse(6, 24, 38, 13, 0, 0, TAU); c.fill();
    for (const s of [-1, 1]) {
      c.fillStyle = '#d3c6a9'; rr(c, s * 22 - 9, -12, 18, 36, 3);
      c.fillStyle = '#f1e8d3'; rr(c, s * 22 - 9, -14, 18, 35, 3);
      c.fillStyle = '#b93a33'; tri(c, s * 22 - 13, -12, s * 22, -35, s * 22 + 13, -12);
      c.fillStyle = '#e9564c'; tri(c, s * 22 - 13, -14, s * 22, -37, s * 22 + 13, -14);
      c.fillStyle = '#3a3460'; rr(c, s * 22 - 2.5, -6, 5, 9, 2.5);
    }
    c.fillStyle = '#d3c6a9'; rr(c, -17, -20, 34, 44, 3);
    c.fillStyle = PAPER; rr(c, -17, -22, 34, 44, 3);
    for (let i = 0; i < 3; i++) c.fillRect(-17 + i * 13, -29, 8, 8);
    c.fillStyle = '#3a3460'; c.beginPath(); c.moveTo(-8, 22); c.lineTo(-8, 9); c.arc(0, 9, 8, Math.PI, 0); c.lineTo(8, 22); c.fill();
    c.fillStyle = '#5a528e'; c.fillRect(-1, 2, 2, 20);
    c.strokeStyle = '#4a4466'; c.lineWidth = 1.8; c.lineJoin = 'round'; c.lineCap = 'round';
    if (dmg > .15) { c.beginPath(); c.moveTo(-17, -12); c.lineTo(-10, -8); c.lineTo(-12, -1); c.lineTo(-6, 4); c.stroke(); }
    if (dmg > .4) { c.beginPath(); c.moveTo(17, -18); c.lineTo(11, -12); c.lineTo(13, -5); c.moveTo(-26, -2); c.lineTo(-21, 4); c.lineTo(-24, 10); c.stroke(); c.fillStyle = '#d3c6a9'; c.fillRect(9, -29, 8, 5); }
    if (dmg > .65) { c.beginPath(); c.moveTo(4, -22); c.lineTo(2, -15); c.lineTo(7, -9); c.lineTo(4, -3); c.moveTo(25, 0); c.lineTo(20, 6); c.lineTo(24, 13); c.stroke(); c.fillStyle = '#3a3460'; tri(c, -13, -22, -9, -22, -11, -17); }
    c.lineCap = 'butt';
    c.fillStyle = '#5b5670'; c.fillRect(-1, -50, 2, 22);
    const w = Math.sin(time * 5) * 2.5, fl = dmg > .65 ? .55 : dmg > .4 ? .8 : 1;
    c.fillStyle = '#f2b632'; c.beginPath(); c.moveTo(1, -50); c.quadraticCurveTo(9 * fl, -53 + w, 18 * fl, -46 + w); c.quadraticCurveTo(9 * fl, -42 + w, 1, -41); c.fill();
    c.restore();
  }

  /* ---------- state ---------- */
  const cv = $('cv'), ctx = cv.getContext('2d'), terr = document.createElement('canvas'), tctx = terr.getContext('2d');
  const stage = $('stage'), hintEl = $('hint');
  let game = null, selMap = clamp(store.d.map | 0, 0, MAPS.length - 1), selDiff = clamp(store.d.diff | 0, 0, 2);
  let sel = null, buildKind = null, ghost = null, hover = null, aimMode = null, lastTouch = false;
  let speed = 1, paused = false, inMenu = true, acc = 0, last = 0, vt = 0, view = { s: 1, tile: 40 }, endT = 0, hintLock = 0;
  let parts = [], decals = [], rings = [], bolts = [], floats = [], banner = null, shake = 0, hurtFlash = 0, castleHit = 0, gustT = 0, weightFx = null;
  let slowmo = 0, whiteFlash = 0, lowPulse = 0, beatT = 0, smokeT = 0, lastMulti = 0, drops = [], dropT = 8, dailyMode = null;

  function wantPortrait() { const r = stage.getBoundingClientRect(); return r.width < r.height * .92; }
  function layout() {
    if (!game) return;
    const r = stage.getBoundingClientRect(), pad = 12;
    const tile = Math.max(14, Math.floor(Math.min((r.width - pad) / game.W, (r.height - pad - 6) / game.H)));
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    cv.style.width = game.W * tile + 'px'; cv.style.height = game.H * tile + 'px';
    cv.width = Math.round(game.W * tile * dpr); cv.height = Math.round(game.H * tile * dpr);
    view.s = cv.width / (game.W * U); view.tile = tile;
    terr.width = cv.width; terr.height = cv.height;
    tctx.setTransform(view.s, 0, 0, view.s, 0, 0); drawTerrain(tctx, game, false);
  }
  function newGame(preview) {
    if (!preview && dailyMode) game = new Game(dailyMode.map, 1, wantPortrait(), dailyMode.seed, { daily: dailyMode });
    else game = new Game(selMap, selDiff, wantPortrait(), (Math.random() * 1e9) | 0, { perks: store.d.perks });
    game.runId = Math.random().toString(36).slice(2, 12); drops = []; dropT = 8;
    sel = null; buildKind = null; ghost = null; aimMode = null; paused = false; acc = 0; endT = 0;
    parts = []; decals = []; rings = []; bolts = []; floats = []; banner = null; shake = 0; hurtFlash = 0; weightFx = null; gustT = 0;
    slowmo = 0; whiteFlash = 0; lowPulse = 0; beatT = 0;
    hud.reset(); layout();
    if (!preview) hintLock = 0;
  }

  /* ---------- effects ---------- */
  function burst(x, y, n, colors, spd, kind, life) {
    if (parts.length > 700) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = spd * (.35 + Math.random() * .75);
      parts.push({ x: x * U, y: y * U, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (kind === 'bit' ? spd * .4 : 0), life: 0, max: (life || .6) * (.6 + Math.random() * .7),
        s: kind === 'bit' ? 4 + Math.random() * 5 : 2.5 + Math.random() * 4, col: colors[(Math.random() * colors.length) | 0], rot: Math.random() * TAU, vr: rand(-9, 9), k: kind });
    }
  }
  function float(x, y, text, col, size) { floats.push({ x: x * U, y: y * U, text, col, size: size || 15, life: 0 }); if (floats.length > 40) floats.shift(); }
  function takeFx() {
    const F = game.fx; if (!F.length) return;
    for (const f of F) {
      switch (f.k) {
        case 'dart': Snd.play('dart'); break;
        case 'lob': Snd.play('lob'); break;
        case 'hit':
          burst(f.x, f.y, f.crit ? 8 : 2, f.crit ? ['#fff', '#ffd166', '#e9564c'] : ['#ffd166', '#f3dcb3'], f.crit ? 190 : 110, 'bit', .3);
          if (f.crit) { float(f.x, f.y - .3, 'CRIT ' + Math.round(f.dmg), '#ffd166', 16); shake = Math.max(shake, 2); }
          break;
        case 'boom':
          burst(f.x, f.y, f.big ? 26 : 14, ['#f0a92e', '#ffd27a', '#fff', '#e9564c'], f.big ? 300 : 220, 'bit', .65);
          rings.push({ x: f.x, y: f.y, r0: .15, r1: f.r, life: 0, max: .32, col: '255,210,122', w: 7, fill: true });
          shake = Math.max(shake, f.big ? 5 : 2.5); Snd.play('boom'); break;
        case 'zap':
          bolts.push({ pts: f.pts, life: 0 });
          for (let i = 1; i < f.pts.length; i++) burst(f.pts[i].x, f.pts[i].y, 2, ['#fff', '#ffe36e', '#c9b0f7'], 150, 'spark', .25);
          Snd.play('zap'); break;
        case 'glue':
          rings.push({ x: f.x, y: f.y, r0: .3, r1: f.r, life: 0, max: .45, col: f.root ? '255,255,255' : '90,215,200', w: f.root ? 6 : 4 });
          Snd.play('glue'); break;
        case 'die': {
          const col = EC[f.type] || INK;
          if (!f.fly) { decals.push({ x: f.x * U, y: f.y * U, r: f.r * U, col, life: 0, seed: Math.random() * 9 }); if (decals.length > 70) decals.shift(); }
          const bossy = ENEMIES[f.type].boss;
          burst(f.x, f.y, bossy ? 40 : f.type === 'speck' ? 3 : 7, [col, '#3d3190', '#1c1838'], bossy ? 330 : 170, 'ink', .5);
          if (f.gold >= 8) float(f.x, f.y - f.r, '+' + f.gold, '#ffd166', bossy ? 22 : 14);
          if (bossy) {
            shake = 14; slowmo = 1.2; whiteFlash = 1; Snd.play('bosskill');
            burst(f.x, f.y, 60, ['#f2b632', '#fff', '#e9564c', '#2fb5a6', '#8a63d2'], 420, 'bit', 1.6);
            rings.push({ x: f.x, y: f.y, r0: .4, r1: 4, life: 0, max: .8, col: '255,255,255', w: 14 });
            banner = { text: 'Wiped out!', sub: ENEMIES[f.type].name + ' is gone', boss: false, gold: true, life: 0, long: 2.4 };
          }
          Snd.play('die'); break;
        }
        case 'leak': hurtFlash = 1; castleHit = 1; shake = Math.max(shake, 5); Snd.play('leak'); hud.hurt();
          float(game.base[0] + .5, game.base[1] - .2, '-' + f.n, '#ff8d84', 20); break;
        case 'heal': rings.push({ x: f.x, y: f.y, r0: .2, r1: 1.8, life: 0, max: .5, col: '95,224,184', w: 3 }); Snd.play('heal'); break;
        case 'brood': burst(f.x, f.y, 8, ['#1c1838', '#3d3190'], 150, 'ink', .4); break;
        case 'build': burst(f.x, f.y, 12, [TC[f.kind][0], TC[f.kind][2], '#fff'], 190, 'bit', .5); rings.push({ x: f.x, y: f.y, r0: .2, r1: .9, life: 0, max: .3, col: '255,255,255', w: 5 }); Snd.play('build'); break;
        case 'upgrade': burst(f.x, f.y, 18, ['#f2b632', '#fff', TC[f.kind][2]], 220, 'bit', .7); rings.push({ x: f.x, y: f.y, r0: .2, r1: 1.2, life: 0, max: .4, col: '242,182,50', w: 6 }); Snd.play('upgrade'); break;
        case 'sell': burst(f.x, f.y, 10, ['#f2b632', '#c58a12'], 170, 'bit', .5); Snd.play('sell'); break;
        case 'weight': weightFx = { x: f.x, y: f.y, life: 0 }; shake = 12; Snd.play('weight');
          burst(f.x, f.y, 34, ['#fff', '#7fc4e8', '#f2b632', '#e9564c'], 360, 'bit', .9);
          rings.push({ x: f.x, y: f.y, r0: .3, r1: f.r, life: 0, max: .4, col: '255,255,255', w: 10, fill: true }); break;
        case 'gust': gustT = .8; Snd.play('gust'); break;
        case 'shieldpop': burst(f.x, f.y, 12, ['#7fd6ff', '#fff', '#bfe9ff'], 220, 'bit', .45); rings.push({ x: f.x, y: f.y, r0: .3, r1: .8, life: 0, max: .25, col: '127,214,255', w: 4 }); Snd.play('shield'); break;
        case 'elite': hint('<b>Elites</b> wear a gold ring. Each is armored, swift, shielded or regenerating.'); break;
        case 'tack': Snd.play('tack'); if (parts.length < 400) burst(f.x, f.y, 1, ['#eef2f8', '#8f9bb3'], 90, 'spark', .2); break;
        case 'spring': rings.push({ x: f.x, y: f.y, r0: .2, r1: 1.1, life: 0, max: .35, col: '242,182,50', w: 6 }); float(f.x, f.y - .3, 'boing', '#ffd166', 14); Snd.play('spring'); break;
        case 'print': float(f.x, f.y - .35, '+' + f.inc, '#ffd166', 16); if (f.life) float(f.x, f.y - .75, '+1 life', '#ff8d84', 15);
          burst(f.x, f.y, 6, ['#f2b632', '#c58a12', '#fff'], 150, 'bit', .6); Snd.play('print'); hud.bump(); break;
        case 'fan':
          if (!f.soft || Math.random() < .25) rings.push({ x: f.x, y: f.y, r0: .3, r1: f.r, life: 0, max: .38, col: '196,239,255', w: f.soft ? 3 : 6 });
          if (!f.soft) burst(f.x, f.y, 6, ['#ffffff', '#c4efff'], 200, 'spark', .3);
          Snd.play('fan'); break;
        case 'launch': Snd.play('launch'); break;
        case 'punch': burst(f.x, f.y, 4, ['#fffaf0', '#f7f0e1', '#d8f09a'], 140, 'bit', .4); Snd.play('punch'); break;
        case 'snip': float(f.x, f.y - .3, 'snip!', '#d8f09a', 15); burst(f.x, f.y, 10, ['#fffaf0', '#dfe5f0', '#9cc43c'], 220, 'bit', .5); Snd.play('snip'); break;
        case 'stomp':
          rings.push({ x: f.x, y: f.y, r0: .3, r1: 1.25, life: 0, max: .35, col: '138,58,92', w: 7, fill: true }); shake = Math.max(shake, 3); Snd.play('stomp');
          if (f.any) { Snd.play('jam'); if (!game.toldStomp) { game.toldStomp = 1; hint('A <b>Stamper</b> stomped and jammed the towers beside it. Kill it fast, or keep towers a step back.'); } } break;
        case 'jam': burst(f.x, f.y, 22, ['#5e1b50', '#a23a8c', '#1c1838'], 260, 'ink', .6);
          rings.push({ x: f.x, y: f.y, r0: .2, r1: 1.26, life: 0, max: .4, col: '162,58,140', w: 6, fill: true });
          if (f.any) { Snd.play('jam'); if (!game.toldJam) { game.toldJam = 1; hint('A <b>Splatter</b> burst and jammed the towers beside it.'); } } break;
        case 'wave': {
          const nw = f.news && f.news.filter(x => x !== 'blot')[0], E = nw && ENEMIES[nw];
          banner = { text: 'Wave ' + f.n, sub: E ? 'New: ' + E.name + '. ' + E.tip : f.boss ? 'A boss is back' : f.bonus ? 'Early call +' + f.bonus : '', boss: f.boss, life: 0, long: E ? 3.2 : 2.2 };
          Snd.play(f.boss ? 'boss' : 'wave'); if (f.bonus) hud.bump(); break;
        }
        case 'clear': float(game.base[0] + .5, game.base[1] - .5, '+' + f.bonus, '#ffd166', 18); Snd.play('clear'); hud.bump(); break;
        case 'win': case 'lose': endT = .0001; break;
        case 'rank': {
          const R = ['', 'Rank 1', 'Rank 2', 'Rank 3 · Veteran'];
          float(f.x, f.y - .55, R[f.rank], '#ffd166', f.rank === 3 ? 20 : 17);
          rings.push({ x: f.x, y: f.y, r0: .2, r1: 1.4, life: 0, max: .5, col: '242,182,50', w: 7 });
          burst(f.x, f.y, 16 + f.rank * 6, ['#f2b632', '#fff', '#ffe36e'], 240, 'bit', .8); Snd.play('rank'); break;
        }
        case 'multi': {
          if (vt - lastMulti < .12) break; lastMulti = vt;
          const L = { 3: 'Triple wipe!', 4: 'Quad wipe!', 5: 'Penta wipe!' }, txt = L[f.n] || 'Mega wipe ×' + f.n + '!';
          floats.push({ x: f.x * U, y: f.y * U - 20, text: txt, col: f.n >= 6 ? '#ff8d84' : '#ffd166', size: Math.min(34, 20 + f.n * 2), life: 0, big: true });
          shake = Math.max(shake, 3 + Math.min(6, f.n)); Snd.play('multi'); break;
        }
      }
    }
    F.length = 0;
  }
  function stepFx(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.life += dt;
      if (p.life >= p.max) { parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.k === 'bit') { p.vy += 520 * dt; p.vx *= .985; } else if (p.k === 'smoke') { p.vx *= .98; } else if (p.k === 'ink') { p.vx *= .9; p.vy *= .9; } else { p.vx *= .92; p.vy *= .92; }
    }
    for (let i = decals.length - 1; i >= 0; i--) if ((decals[i].life += dt) > 9) decals.splice(i, 1);
    for (let i = rings.length - 1; i >= 0; i--) if ((rings[i].life += dt) > rings[i].max) rings.splice(i, 1);
    for (let i = bolts.length - 1; i >= 0; i--) if ((bolts[i].life += dt) > .16) bolts.splice(i, 1);
    for (let i = floats.length - 1; i >= 0; i--) if ((floats[i].life += dt) > (floats[i].big ? 1.3 : .9)) floats.splice(i, 1);
    if (banner && (banner.life += dt) > banner.long) banner = null;
    if (weightFx && (weightFx.life += dt) > .7) weightFx = null;
    if (gustT > 0) gustT -= dt;
  }

  /* ---------- gold scraps to tap ---------- */
  function stepDrops(dt) {
    const g = game; if (!g || inMenu || g.over) return;
    if (g.wave > 0 && (g.enemies.length || g.spawns.length) && (dropT -= dt * g.dropRate) <= 0) {
      dropT = rand(11, 18);
      const fromLeft = Math.random() < .5, y = rand(1, g.H - 1);
      drops.push({ x: fromLeft ? -.2 : g.W + .2, y, vx: (fromLeft ? 1 : -1) * rand(.45, .7), vy: rand(-.12, .12), life: 0, max: 9, seed: Math.random() * 9, val: Math.round((6 + 2.2 * g.wave) * g.dropMul) });
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i]; d.life += dt; d.x += d.vx * dt; d.y += (d.vy + Math.sin(d.life * 2 + d.seed) * .25) * dt;
      if (d.life > d.max || d.x < -.6 || d.x > g.W + .6) drops.splice(i, 1);
    }
  }
  function dropAt(x, y) { for (const d of drops) if ((d.x - x) ** 2 + (d.y - y + .28) ** 2 < .5) return d; return null; }
  function grabDrop(d) {
    drops.splice(drops.indexOf(d), 1); game.collect(d.val);
    float(d.x, d.y - .2, '+' + d.val, '#ffd166', 19); burst(d.x, d.y, 14, ['#f2b632', '#fff', '#ffe36e'], 220, 'bit', .6);
    rings.push({ x: d.x, y: d.y, r0: .1, r1: .8, life: 0, max: .3, col: '242,182,50', w: 5 }); Snd.play('print'); hud.bump();
  }
  function drawDrops(c) {
    for (const d of drops) {
      const fade = d.max - d.life < 1.6 ? (Math.sin(d.life * 18) > 0 ? 1 : .35) : 1, x = d.x * U, y = d.y * U - 18, rot = Math.sin(d.life * 2.4 + d.seed) * .5;
      c.globalAlpha = fade;
      c.fillStyle = 'rgba(26,22,58,.16)'; c.beginPath(); c.ellipse(x + 6, y + 26, 12, 5, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,214,102,' + (.22 + .12 * Math.sin(d.life * 6)) + ')'; circ(c, x, y, 27);
      c.save(); c.translate(x, y); c.rotate(rot); c.scale(1.35, 1.35);
      c.fillStyle = '#c58a12'; c.beginPath(); c.moveTo(-12, -9); c.lineTo(12, -11); c.lineTo(13, 10); c.lineTo(-11, 12); c.closePath(); c.fill();
      c.fillStyle = '#f2b632'; c.beginPath(); c.moveTo(-12, -11); c.lineTo(12, -12); c.lineTo(12, 8); c.lineTo(-11, 10); c.closePath(); c.fill();
      c.fillStyle = '#ffd97a'; tri(c, 12, -12, 12, -2, 3, -12);
      c.strokeStyle = '#c58a12'; c.lineWidth = 2; c.beginPath(); c.arc(0, -1, 5, 0, TAU); c.stroke();
      c.restore();
      c.fillStyle = '#fff'; const sp = (d.life * 3 + d.seed) % 2; if (sp < 1) { const a = sp * Math.PI; circ(c, x + Math.cos(a * 3) * 16, y - 14 + Math.sin(a) * 4, 2.2 * Math.sin(a)); }
    }
    c.globalAlpha = 1;
  }

  /* ---------- render ---------- */
  function ringShape(x, y, r) {
    ctx.fillStyle = 'rgba(255,255,255,.13)'; circ(ctx, x * U, y * U, r * U);
    ctx.strokeStyle = 'rgba(34,29,70,.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x * U, y * U, r * U, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.setLineDash([9, 7]); ctx.lineDashOffset = -vt * 14; ctx.beginPath(); ctx.arc(x * U, y * U, r * U, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  }
  function render(rdt) {
    const g = game, s = view.s, T = g.time, c = ctx;
    if (shake > .1) shake *= Math.pow(.0009, rdt); else shake = 0;
    const sx = shake ? (Math.random() - .5) * shake * 2 : 0, sy = shake ? (Math.random() - .5) * shake * 2 : 0;
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(terr, Math.round(sx * s), Math.round(sy * s));
    c.setTransform(s, 0, 0, s, sx * s, sy * s);

    for (const d of decals) {
      const a = d.life > 6 ? (9 - d.life) / 3 : 1, k = Math.min(1, d.life / .18);
      c.globalAlpha = .42 * a; c.fillStyle = d.col; blob(c, d.x, d.y, d.r * (.5 + .7 * k), d.seed, 0, .22, 9);
      for (let i = 0; i < 4; i++) { const an = d.seed + i * 1.7; circ(c, d.x + Math.cos(an) * d.r * 1.5 * k, d.y + Math.sin(an) * d.r * 1.3 * k, d.r * (.14 + (i % 2) * .1)); }
    }
    c.globalAlpha = 1;
    // flight lines when moths are about
    if (flyHint) {
      c.strokeStyle = 'rgba(58,54,118,.34)'; c.lineWidth = 3; c.setLineDash([4, 12]); c.lineCap = 'round'; c.lineDashOffset = -vt * 22;
      for (const p of g.flyPaths) { c.beginPath(); c.moveTo(p.P[0].x * U, p.P[0].y * U); c.lineTo(p.P[1].x * U, p.P[1].y * U); c.stroke(); }
      c.setLineDash([]); c.lineCap = 'butt';
    }
    // buildable dots while placing
    if (buildKind && !inMenu) {
      c.fillStyle = 'rgba(255,255,255,.5)';
      const road = TOWERS[buildKind].road; c.fillStyle = road ? 'rgba(34,29,70,.4)' : 'rgba(255,255,255,.5)';
      for (let r = 0; r < g.H; r++) for (let x = 0; x < g.W; x++) if (g.canBuild(x, r, buildKind)) circ(c, (x + .5) * U, (r + .5) * U, road ? 5 : 4);
    }
    for (const r of rings) {
      const k = r.life / r.max, rad = (r.r0 + (r.r1 - r.r0) * (1 - (1 - k) * (1 - k))) * U;
      if (r.fill) { c.fillStyle = 'rgba(' + r.col + ',' + (.3 * (1 - k)) + ')'; circ(c, r.x * U, r.y * U, rad); }
      c.strokeStyle = 'rgba(' + r.col + ',' + (1 - k) + ')'; c.lineWidth = r.w * (1 - k * .6); c.beginPath(); c.arc(r.x * U, r.y * U, rad, 0, TAU); c.stroke();
    }
    if (sel && g.rangeOf(sel) > 0) ringShape(sel.x, sel.y, g.rangeOf(sel));
    for (const t of g.towers) if (t.kind === 'banner') {
      const k = (vt * .8 + t.id * .37) % 1, R = g.stats(t).range * U;
      c.strokeStyle = 'rgba(221,90,150,' + (.4 * (1 - k)) + ')'; c.lineWidth = 3; c.beginPath(); c.arc(t.x * U, t.y * U, 14 + (R - 14) * k, 0, TAU); c.stroke();
    }

    // towers
    for (const t of g.towers) {
      const kick = clamp(1 - (T - t.fireT) / (t.kind === 'lens' ? .12 : .2), 0, 1);
      const pop = t.upT != null && T - t.upT < .25 ? 1 + .22 * Math.sin((T - t.upT) / .25 * Math.PI) : T - t.builtT < .2 ? .6 + .4 * (T - t.builtT) / .2 : 1;
      c.save(); c.translate(t.x * U, t.y * U); c.scale(pop, pop);
      drawTower(c, t.kind, t.lvl, t.spec, t.angle, kick, T); c.restore();
      if (t.bd > 0) {
        const bx = t.x * U + 19, by = t.y * U - 21;
        c.fillStyle = '#ad3b73'; circ(c, bx, by + 1, 7); c.fillStyle = '#dd5a96'; circ(c, bx, by, 7);
        c.strokeStyle = '#fff'; c.lineWidth = 2.2; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(bx - 3, by + 1.5); c.lineTo(bx, by - 2); c.lineTo(bx + 3, by + 1.5); c.stroke(); c.lineCap = 'butt';
      }
      if (t.jamT > 0) {
        c.globalAlpha = .86; c.fillStyle = '#3a1436'; blob(c, t.x * U, t.y * U - 3, 20, t.id, T * 1.5, .18, 10);
        c.fillStyle = '#5e1b50'; blob(c, t.x * U - 2, t.y * U - 6, 12, t.id + 3, T * 1.5, .2, 8); c.globalAlpha = 1;
        c.fillStyle = '#3a1436'; circ(c, t.x * U - 17, t.y * U + 14, 4); circ(c, t.x * U + 19, t.y * U + 8, 3);
      }
      if (t.rank > 0) {
        const bx = t.x * U - 20, by = t.y * U - 22, glow = t.rankT != null && T - t.rankT < .6 ? 1 - (T - t.rankT) / .6 : 0;
        c.fillStyle = INK; rr(c, bx - 6, by - 6, 13, 6 + t.rank * 5.5, 4);
        c.strokeStyle = glow ? '#fff' : '#f2b632'; c.lineWidth = 2.4; c.lineCap = 'round'; c.lineJoin = 'round';
        for (let i = 0; i < t.rank; i++) { const y = by - 2 + i * 5.5; c.beginPath(); c.moveTo(bx - 3.5, y); c.lineTo(bx + .5, y + 3); c.lineTo(bx + 4.5, y); c.stroke(); }
        c.lineCap = 'butt';
      }
      if (t === sel) { c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); if (c.roundRect) c.roundRect(t.x * U - 27, t.y * U - 27, 54, 54, 14); else c.rect(t.x * U - 27, t.y * U - 27, 54, 54); c.stroke(); }
    }
    // ghost
    const gh = ghost || (buildKind && hover && !lastTouch ? hover : null);
    if (buildKind && gh && !inMenu && gh.c >= 0 && gh.r >= 0 && gh.c < g.W && gh.r < g.H) {
      const ok = g.canBuild(gh.c, gh.r, buildKind), x = gh.c + .5, y = gh.r + .5;
      if (ok) {
        if (TOWERS[buildKind].lv[0].range > 0) ringShape(x, y, TOWERS[buildKind].lv[0].range);
        c.save(); c.translate(x * U, y * U); c.globalAlpha = g.gold >= g.costOf(buildKind) ? .85 : .4; drawTower(c, buildKind, 0, -1, -Math.PI / 2, 0, T); c.restore(); c.globalAlpha = 1;
      } else if (g.getG(gh.c, gh.r) < 4) {
        c.strokeStyle = 'rgba(233,86,76,.9)'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath();
        c.moveTo(x * U - 13, y * U - 13); c.lineTo(x * U + 13, y * U + 13); c.moveTo(x * U + 13, y * U - 13); c.lineTo(x * U - 13, y * U + 13); c.stroke(); c.lineCap = 'butt';
      }
    }
    // ground enemies, back to front
    const EN = g.enemies; EN.sort((a, b) => a.y - b.y);
    for (const e of EN) if (!e.fly) drawEnemy(c, e, T);
    const dmgF = 1 - g.lives / g.maxLives;
    drawCastle(c, (g.base[0] + .5) * U, (g.base[1] + .5) * U, vt, castleHit, inMenu ? 0 : dmgF);
    if (!inMenu && dmgF > .6 && (smokeT -= rdt) <= 0) {
      smokeT = .18 - (dmgF - .6) * .2;
      parts.push({ x: (g.base[0] + .5) * U + rand(-14, 10), y: (g.base[1] + .5) * U - 34, vx: rand(-6, 10), vy: rand(-40, -24), life: 0, max: 1.6, s: rand(4, 7), col: dmgF > .8 ? '#3a3450' : '#8d8a9c', rot: 0, vr: 0, k: 'smoke' });
    }
    if (castleHit > 0) castleHit = Math.max(0, castleHit - rdt * 2.5);

    // beams
    for (const t of g.towers) if (t.kind === 'lens') {
      const st = g.stats(t), ox = t.x * U + Math.cos(t.angle) * 3, oy = t.y * U - 5 + Math.sin(t.angle) * 3;
      t.beams.forEach((b, i) => {
        const e = b.e; if (!e || e.dead) return;
        const k = Math.min(1, b.ramp / 3), ex = e.x * U, ey = e.y * U - (e.fly ? 10 : 0), j = Math.sin(vt * 40 + i) * .8;
        const col = st.beams ? ['255,209,102', '127,224,208', '255,143,176'][i] : '255,214,110';
        c.lineCap = 'round';
        c.strokeStyle = 'rgba(' + col + ',' + (.28 + k * .22) + ')'; c.lineWidth = 7 + k * 9 + j; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ex, ey); c.stroke();
        c.strokeStyle = '#fffbe4'; c.lineWidth = 2 + k * 2.5; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ex, ey); c.stroke();
        c.fillStyle = 'rgba(' + col + ',.55)'; circ(c, ex, ey, 6 + k * 7 + j); c.fillStyle = '#fff'; circ(c, ex, ey, 3 + k * 3);
        c.lineCap = 'butt';
        if (!paused && Math.random() < .35) parts.push({ x: ex, y: ey, vx: rand(-40, 40), vy: rand(-90, -30), life: 0, max: .4, s: 3 + k * 3, col: '#fff3c2', rot: 0, vr: 0, k: 'spark' });
      });
    }
    // shots
    for (const p of g.shots) {
      if (p.k === 'plane') {
        c.save(); c.translate(p.x * U, p.y * U - 14); c.rotate(p.a);
        c.fillStyle = 'rgba(26,22,58,.18)'; tri(c, 12, 18, -9, 10, -9, 26);
        c.fillStyle = '#fffaf0'; tri(c, 12, 0, -9, -8, -4, 0); c.fillStyle = '#e3d8c2'; tri(c, 12, 0, -9, 8, -4, 0);
        if (p.rad) { c.fillStyle = '#e9564c'; circ(c, -3, 3, 2.6); }
        c.restore();
        continue;
      }
      if (p.k === 'dart') {
        c.save(); c.translate(p.x * U, p.y * U); c.rotate(p.a);
        c.strokeStyle = p.crit ? 'rgba(255,255,255,.7)' : 'rgba(255,209,102,.5)'; c.lineWidth = p.crit ? 4 : 2.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(-22, 0); c.lineTo(-8, 0); c.stroke(); c.lineCap = 'butt';
        c.fillStyle = '#ffd166'; c.fillRect(-8, -2.5, 9, 5); c.fillStyle = '#f3dcb3'; tri(c, 1, -2.5, 6, 0, 1, 2.5); c.fillStyle = INK; tri(c, 4, -1, 7.5, 0, 4, 1);
        c.restore();
      } else {
        const u = Math.min(1, p.age / p.T), h = Math.sin(u * Math.PI), x = p.x * U, y = p.y * U;
        c.fillStyle = 'rgba(26,22,58,' + (.25 - h * .1) + ')'; c.beginPath(); c.ellipse(x, y + 4, 7 + h * 3, 4 + h * 1.5, 0, 0, TAU); c.fill();
        const R = (p.big ? 8 : 6) + h * 4;
        c.fillStyle = '#2b2650'; circ(c, x, y - h * 62, R); c.fillStyle = '#f0a92e'; circ(c, x - R * .15, y - h * 62 - R * .15, R * .55); c.fillStyle = '#fff3c2'; circ(c, x - R * .3, y - h * 62 - R * .3, R * .22);
      }
    }
    for (const b of bolts) {
      const a = 1 - b.life / .16; c.lineJoin = 'round'; c.lineCap = 'round';
      for (let pass = 0; pass < 2; pass++) {
        c.strokeStyle = pass ? 'rgba(255,255,255,' + a + ')' : 'rgba(170,130,255,' + a * .7 + ')'; c.lineWidth = pass ? 2.4 : 8; c.beginPath();
        for (let i = 0; i < b.pts.length - 1; i++) {
          const p = b.pts[i], q = b.pts[i + 1], n = 4;
          if (!i) c.moveTo(p.x * U, p.y * U - 4);
          for (let k = 1; k <= n; k++) {
            const u = k / n, jx = k < n ? Math.sin(i * 7 + k * 3.3 + b.life * 90) * 9 : 0, jy = k < n ? Math.cos(i * 5 + k * 2.1 + b.life * 70) * 9 : 0;
            c.lineTo((p.x + (q.x - p.x) * u) * U + jx, (p.y + (q.y - p.y) * u) * U + jy);
          }
        }
        c.stroke();
      }
    }
    for (const e of EN) if (e.fly) drawEnemy(c, e, T);
    drawDrops(c);
    for (const e of EN) drawHp(c, e);

    for (const p of parts) {
      const k = p.life / p.max; c.globalAlpha = k > .7 ? (1 - k) / .3 : 1; c.fillStyle = p.col;
      if (p.k === 'bit') { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.scale(1, Math.cos(p.rot * 2.3)); c.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .66); c.restore(); }
      else if (p.k === 'smoke') { c.globalAlpha = .45 * (1 - k); circ(c, p.x, p.y, p.s * (1 + k * 1.6)); }
      else circ(c, p.x, p.y, p.s * (1 - k * .7));
    }
    c.globalAlpha = 1;
    if (weightFx) {
      const k = weightFx.life / .7, x = weightFx.x * U, y = weightFx.y * U, sc = k < .12 ? 2.6 - 1.6 * k / .12 : 1;
      c.globalAlpha = k < .5 ? 1 : (1 - k) * 2; c.save(); c.translate(x, y); c.scale(sc, sc);
      c.fillStyle = SH; c.beginPath(); c.ellipse(6, 14, 52, 26, 0, 0, TAU); c.fill();
      c.fillStyle = '#d3c6a9'; c.beginPath(); c.ellipse(0, 8, 52, 20, 0, 0, TAU); c.fill();
      c.fillStyle = '#7fc4e8'; c.beginPath(); c.arc(0, 4, 48, Math.PI, 0); c.ellipse(0, 4, 48, 16, 0, 0, Math.PI); c.fill();
      c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(-18, -22, 14, 7, -.6, 0, TAU); c.fill();
      c.fillStyle = '#e9564c'; circ(c, 6, -8, 9); c.fillStyle = '#f2b632'; circ(c, -10, -4, 6);
      c.restore(); c.globalAlpha = 1;
    }
    if (gustT > 0) {
      const k = 1 - gustT / .8; c.strokeStyle = 'rgba(255,255,255,' + (.75 * Math.sin(k * Math.PI)) + ')'; c.lineWidth = 4; c.lineCap = 'round';
      for (let i = 0; i < 9; i++) {
        const y = (i + .5) / 9 * g.H * U + Math.sin(i * 3.1) * 14, x = g.W * U * (1.15 - k * 1.5) + Math.sin(i * 1.7) * 160;
        c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x - 60, y - 16, x - 110, y + 16, x - 170, y); c.stroke();
      }
      c.lineCap = 'butt';
    }
    // aiming reticle for the paperweight
    if (aimMode && hover && hover.x != null) {
      const x = hover.x * U, y = hover.y * U, R = 1.6 * U;
      c.fillStyle = 'rgba(233,86,76,.18)'; circ(c, x, y, R);
      c.strokeStyle = '#e9564c'; c.lineWidth = 4; c.setLineDash([12, 9]); c.lineDashOffset = vt * 30; c.beginPath(); c.arc(x, y, R, 0, TAU); c.stroke(); c.setLineDash([]);
    }
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    for (const f of floats) {
      const k = f.life / .9; c.globalAlpha = k > .6 ? (1 - k) / .4 : 1;
      const y = f.y - (f.big ? 34 : 26) * (1 - (1 - k) * (1 - k)), pop = f.big ? (k < .12 ? .5 + 4.2 * k : 1) : 1;
      c.save(); c.translate(f.x, y); c.scale(pop, pop); if (f.big) c.rotate(-.06);
      c.font = (f.big ? "400 " + f.size + "px 'Bagel Fat One', 'Arial Rounded MT Bold', sans-serif" : '800 ' + f.size + 'px Figtree, system-ui, sans-serif'); c.lineWidth = f.big ? 6 : 4; c.strokeStyle = INK;
      c.strokeText(f.text, 0, 0); c.fillStyle = f.col; c.fillText(f.text, 0, 0); c.restore();
    }
    c.globalAlpha = 1;
    // boss bar
    let bh = 0, bm = 0, bn = ''; for (const e of EN) if (e.E.boss) { bh += e.hp; bm += e.max; if (bn.indexOf(e.E.name) < 0) bn += (bn ? ' + ' : '') + e.E.name; }
    if (bm > 0) {
      const w = Math.min(g.W * U - 60, 380), x = g.W * U / 2 - w / 2, y = 16;
      c.fillStyle = SH; rr(c, x - 6 + 3, y - 6 + 4, w + 12, 30, 10); c.fillStyle = PAPER; rr(c, x - 6, y - 6, w + 12, 30, 10);
      c.fillStyle = '#d3c6a9'; rr(c, x, y + 9, w, 9, 4.5); c.fillStyle = '#e9564c'; rr(c, x, y + 9, Math.max(9, w * bh / bm), 9, 4.5);
      c.font = '800 11px Figtree, system-ui, sans-serif'; c.fillStyle = INK; c.fillText(bn.toUpperCase(), g.W * U / 2, y + 2);
    }
    if (banner && !inMenu) {
      const k = banner.life / banner.long, e = k < .12 ? k / .12 : k > .85 ? (1 - k) / .15 : 1, ease = 1 - (1 - e) * (1 - e);
      const cx = g.W * U / 2, cy = g.H * U * .3 + (bm > 0 ? 30 : 0);
      c.globalAlpha = ease; c.save(); c.translate(cx + (1 - ease) * (k < .5 ? -70 : 70), cy); c.rotate(-.035);
      c.font = "400 50px 'Bagel Fat One', 'Arial Rounded MT Bold', 'Trebuchet MS', sans-serif";
      let w = c.measureText(banner.text).width, subSize = 17;
      if (banner.sub) { c.font = '800 17px Figtree, system-ui, sans-serif'; let sw = c.measureText(banner.sub).width; const max = g.W * U - 110; if (sw > max) { subSize = Math.max(11, 17 * max / sw); sw = max; } w = Math.max(w, sw); c.font = "400 50px 'Bagel Fat One', 'Arial Rounded MT Bold', 'Trebuchet MS', sans-serif"; }
      w += 56; const h = banner.sub ? 98 : 74;
      c.fillStyle = SH; rr(c, -w / 2 + 5, -h / 2 + 7, w, h, 16); c.fillStyle = banner.boss ? '#e9564c' : banner.gold ? '#f2b632' : PAPER; rr(c, -w / 2, -h / 2, w, h, 16);
      c.fillStyle = banner.boss ? '#fff' : INK; c.fillText(banner.text, 0, banner.sub ? -12 : 3);
      if (banner.sub) { c.font = '800 ' + subSize + 'px Figtree, system-ui, sans-serif'; c.fillStyle = banner.boss ? '#ffe3df' : '#b93a33'; c.fillText(banner.sub, 0, 28); }
      c.restore(); c.globalAlpha = 1;
    }
    if (lowPulse > 0) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      const gr = c.createRadialGradient(cv.width / 2, cv.height / 2, Math.min(cv.width, cv.height) * .35, cv.width / 2, cv.height / 2, Math.max(cv.width, cv.height) * .62);
      gr.addColorStop(0, 'rgba(233,86,76,0)'); gr.addColorStop(1, 'rgba(200,40,40,' + (.42 * lowPulse) + ')');
      c.fillStyle = gr; c.fillRect(0, 0, cv.width, cv.height); lowPulse = Math.max(0, lowPulse - rdt * 1.6);
    }
    if (whiteFlash > 0) { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = 'rgba(255,255,255,' + (.75 * whiteFlash) + ')'; c.fillRect(0, 0, cv.width, cv.height); whiteFlash = Math.max(0, whiteFlash - rdt * 2.2); }
    if (hurtFlash > 0) {
      c.setTransform(1, 0, 0, 1, 0, 0); c.strokeStyle = 'rgba(233,86,76,' + hurtFlash * .7 + ')'; c.lineWidth = 26 * s; c.strokeRect(0, 0, cv.width, cv.height);
      hurtFlash = Math.max(0, hurtFlash - rdt * 2.4);
    }
  }

  /* ---------- HUD ---------- */
  let flyHint = false;
  const icons = {};
  function enemyIcon(type) {
    if (icons[type]) return icons[type];
    const k = document.createElement('canvas'); k.width = k.height = 64; const c = k.getContext('2d'), E = ENEMIES[type];
    const SC = { king: .55, wasp: .66, streak: .66, stamp: .72, sponge: .8, boss: .62, flood: .4, moth: .6, drip: .72, slick: .62, balloon: .68, splat: .74, skip: .72, fader: .8 }, OY = { king: 40, stamp: 38, wasp: 34, boss: 40, flood: 38, moth: 38, balloon: 26, skip: 37 };
    const r = Math.min(E.r, .4), sc = 24 / (r * U) * (SC[type] || .95);
    c.translate(32, OY[type] || 32); c.scale(sc, sc);
    drawEnemy(c, { type, E, r: E.r, x: 0, y: 0, a: type === 'moth' ? -Math.PI / 2 : .5, seed: 2, born: -9, hitT: -9, hopAt: -9, slowT: 0, stun: 0, vuln: 0, fly: false, spd: 1, hp: 1, max: 1 }, 1.3);
    return icons[type] = k.toDataURL();
  }
  function towerIcon(k, kind, lvl, spec) {
    const c = k.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, k.width, k.height);
    const s = k.width / 60; c.setTransform(s, 0, 0, s, k.width / 2 - 1.5 * s, k.height / 2);
    drawTower(c, kind, lvl, spec, -Math.PI / 4, 0, 0);
  }
  const hud = {
    c: {}, btns: {},
    reset() { this.c = {}; },
    set(id, v) { if (this.c[id] !== v) { this.c[id] = v; $(id).textContent = v; return true; } return false; },
    bump() { const e = $('sGold'); e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); },
    hurt() { const e = $('sLives'); e.classList.remove('hurt'); void e.offsetWidth; e.classList.add('hurt'); },
    build() {
      const box = $('towers');
      ORDER.forEach((kind, i) => {
        const T = TOWERS[kind], b = document.createElement('button');
        b.className = 'tb'; b.id = 'tb_' + kind; b.title = T.name + ': ' + T.blurb + ' (' + KEYS[i] + ')';
        b.innerHTML = '<kbd>' + KEYS[i] + '</kbd><canvas width="104" height="104"></canvas><span class="nm">' + T.name + '</span><span class="cost">' + T.cost + '</span>';
        b.addEventListener('click', () => { Snd.init(); pickBuild(buildKind === kind ? null : kind); });
        box.appendChild(b); towerIcon(b.querySelector('canvas'), kind, 0, -1); this.btns[kind] = b;
      });
    },
    sync() {
      const g = game; if (!g) return;
      this.set('vLives', g.lives); this.set('vGold', Math.floor(g.gold)); this.set('vWave', g.wave);
      this.set('vWaveMax', g.endless ? '' : '/' + WAVES);
      for (const kind of ORDER) {
        const cost = g.costOf(kind), b = this.btns[kind], poor = g.gold < cost, s = buildKind === kind, ban = !!g.banned[kind];
        if (b._c !== cost) { b._c = cost; b.querySelector('.cost').textContent = cost; }
        if (b._b !== ban) { b._b = ban; b.classList.toggle('ban', ban); b.title = ban ? TOWERS[kind].name + ' is not allowed in today\'s Daily Ink' : TOWERS[kind].name + ': ' + TOWERS[kind].blurb; }
        if (b._p !== poor) { b._p = poor; b.classList.toggle('poor', poor); }
        if (b._s !== s) { b._s = s; b.classList.toggle('sel', s); }
      }
      // wave button
      const wb = $('bWave'), can = g.canCall(), bonus = g.callBonus();
      let title, sub, go = false;
      if (g.wave === 0) { title = 'Start'; sub = 'Send wave 1'; go = true; }
      else if (!can && g.wave >= WAVES && !g.endless) { title = 'Final wave'; sub = 'Hold the keep'; }
      else if (!can) { title = 'Wave ' + g.wave; sub = 'Incoming…'; }
      else if (g.enemies.length) { title = 'Call wave ' + (g.wave + 1); sub = 'Early bonus +' + bonus; }
      else { title = 'Wave ' + (g.wave + 1) + ' in ' + Math.max(0, Math.ceil(g.auto)); sub = bonus ? 'Send now +' + bonus : 'Send now'; }
      this.set('wTitle', title); this.set('wSub', sub);
      if (this.c.can !== can) { this.c.can = can; wb.disabled = !can; }
      if (this.c.go !== go) { this.c.go = go; wb.classList.toggle('go', go); }
      // next wave chips
      const nw = g.wave + 1;
      if (this.c.nw !== nw) {
        this.c.nw = nw; const box = $('chips'); box.textContent = '';
        const show = g.endless || nw <= WAVES, pv = show ? TD.wavePreview(nw) : [];
        $('nextLbl').textContent = show ? 'Wave ' + nw : 'Last wave';
        for (const [type, n] of pv.slice(0, 5)) {
          const d = document.createElement('div'); d.className = 'chip'; d.title = ENEMIES[type].name + ': ' + ENEMIES[type].tip;
          const im = document.createElement('img'); im.src = enemyIcon(type); im.alt = ENEMIES[type].name; d.appendChild(im);
          d.appendChild(document.createTextNode('\u00d7' + n)); box.appendChild(d);
        }
        this.c.nextFly = pv.some(x => ENEMIES[x[0]].fly);
        this.c.curFly = g.wave > 0 && TD.wavePreview(g.wave).some(x => ENEMIES[x[0]].fly);
      }
      let fl = this.c.nextFly || (this.c.curFly && g.spawns.length > 0);
      if (!fl) for (const e of g.enemies) if (e.fly) { fl = true; break; }
      flyHint = fl;
      // abilities
      for (const [id, n] of [['aWeight', 'weight'], ['aGust', 'gust']]) {
        const b = $(id), f = g.wave === 0 || g.noAbil ? 1 : clamp(g.cd[n] / g.cdMax[n], 0, 1), q = Math.round(f * 50) / 50;
        if (b._f !== q) { b._f = q; b.style.setProperty('--cd', q); b.disabled = q > 0; }
        const arm = aimMode === n; if (b._a !== arm) { b._a = arm; b.classList.toggle('arm', arm); }
      }
      this.panel();
    },
    panel() {
      const g = game, t = sel, P = $('panel'), TB = $('towers');
      if (this.c.pv !== !!t) { this.c.pv = !!t; P.hidden = !t; TB.hidden = !!t; }
      if (!t) return;
      const T = TOWERS[t.kind], st = g.stats(t), sig = t.id + ':' + t.lvl + ':' + t.spec;
      if (this.c.psig !== sig) {
        this.c.psig = sig; towerIcon($('pIcon'), t.kind, t.lvl, t.spec);
        $('pName').textContent = t.spec >= 0 ? T.sp[t.spec].name + ' ' + T.name : T.name;
        const A = $('pA'), B = $('pB'), set = (b, u, em, cost) => { b.children[0].textContent = u; b.children[1].textContent = em; b.children[2].textContent = cost; };
        A.hidden = t.spec >= 0; B.hidden = !(t.spec < 0 && t.lvl === 2);
        if (t.spec < 0 && t.lvl < 2) set(A, 'Upgrade', statLine(t.kind, T.lv[t.lvl + 1], true), g.upgradeCost(t, 0));
        else if (t.spec < 0) { set(A, T.sp[0].name, T.sp[0].tag, g.upgradeCost(t, 0)); set(B, T.sp[1].name, T.sp[1].tag, g.upgradeCost(t, 1)); }
        $('pAim').hidden = !canAim(t.kind);
      }
      const lv = t.spec >= 0 ? 'Mastered' : 'Level ' + (t.lvl + 1);
      this.set('pStat', t.spec < 0 && t.lvl === 2 ? 'Pick a path' : lv + ' · ' + statLine(t.kind, st));
      let note = t.kills ? t.kills + ' wiped' : '';
      if (t.kind === 'press') note = t.made ? 'Printed ' + t.made + ' gold' : 'Pays when a wave ends';
      else if (t.kind === 'banner') { let n = 0; for (const o of g.towers) if (o !== t && !TOWERS[o.kind].support && (o.x - t.x) ** 2 + (o.y - t.y) ** 2 <= st.range * st.range) n++; note = 'Boosting ' + n + (n === 1 ? ' tower' : ' towers'); }
      else if (t.jamT > 0) note = 'Jammed!';
      else if (t.bd > 0) note += (note ? ' · ' : '') + '+' + Math.round(t.bd * 100) + '% from banner';
      if (!TOWERS[t.kind].support) { const nx = TD.RANKS[t.rank]; note = (t.rank ? 'Rank ' + t.rank + ' · ' : '') + note + (nx ? ' · ' + (nx - t.kills) + ' to next rank' : t.rank === 3 ? ' · Veteran' : ''); }
      this.set('pKills', note);
      const ca = g.upgradeCost(t, 0), cb = g.upgradeCost(t, 1);
      const da = ca == null || g.gold < ca, db = cb == null || g.gold < cb;
      if (this.c.da !== da) { this.c.da = da; $('pA').disabled = da; }
      if (this.c.db !== db) { this.c.db = db; $('pB').disabled = db; }
      if (this.c.aim !== t.mode) { this.c.aim = t.mode; $('pAim').children[1].textContent = AIM[t.mode]; }
      const sv = g.sellValue(t); if (this.c.sv !== sv) { this.c.sv = sv; $('pSell').children[1].textContent = sv; }
    }
  };
  function canAim(kind) { return !TOWERS[kind].support && !TOWERS[kind].road && kind !== 'glue' && kind !== 'fan'; }
  function statLine(kind, st, short) {
    if (kind === 'tacks') return short ? st.dmg + ' dmg' : st.dmg + ' dmg per prick' + (st.shred ? ' · strips armor' : st.spring ? ' · flings one back' : '');
    if (kind === 'banner') return '+' + Math.round(st.bd * 100) + '% damage' + (short ? '' : (st.br ? ' · +' + Math.round(st.br * 100) + '% speed' : '') + (st.brg ? ' · +' + st.brg + ' range' : '') + ' nearby');
    if (kind === 'press') return '+' + st.inc + ' gold' + (short ? '' : ' per wave' + (st.life ? ' · +1 life every ' + st.life : ''));
    if (kind === 'fan') return short ? 'Push ' + st.push : 'Pushes back ' + st.push + ' · ' + st.dmg + ' dmg · range ' + st.range + (st.slow ? ' · slows' : '');
    if (kind === 'punch') return short ? st.dmg + ' dmg' : st.dmg + ' dmg · ' + (1 / st.cd).toFixed(1) + '/s · ignores armor' + (st.exec ? ' · snips weak ink' : '');
    if (kind === 'plane' && !short) return st.dmg + ' dmg · ' + (1 / st.cd).toFixed(1) + '/s · range ' + st.range + (st.multi ? ' · 3 planes' : st.rad ? ' · blast' : '');
    if (kind === 'glue') return short ? Math.round((1 - st.slow) * 100) + '% slow' : Math.round((1 - st.slow) * 100) + '% slow · range ' + st.range;
    if (kind === 'lens') return short ? st.dps + ' dmg/s' : st.dps + '–' + st.dps * st.ramp + ' dmg/s · range ' + st.range;
    if (kind === 'spark') return short ? st.dmg + ' dmg · ' + st.chain + ' jumps' : st.dmg + ' dmg · ' + st.chain + ' jumps · range ' + st.range;
    return short ? st.dmg + ' dmg' : st.dmg + ' dmg · ' + (1 / st.cd).toFixed(1) + '/s · range ' + st.range;
  }
  function hint(html, sticky) {
    if (!html) { hintEl.hidden = true; return; }
    hintEl.innerHTML = html; hintEl.hidden = false; hintLock = sticky ? 1e9 : 3.2;
  }
  function baseHint() {
    if (inMenu || !game) return hint(null);
    if (aimMode) return hint('Pick a spot for the <b>paperweight</b>', true);
    if (buildKind) { const T = TOWERS[buildKind]; return hint('<b>' + T.name + '</b> · ' + T.blurb + (ghost ? ' Tap again to build.' : ''), true); }
    if (game.wave === 0 && game.daily) { const M = TD.MODS[game.mod]; return hint('<b>Daily Ink: ' + M.name + '.</b> ' + M.tip + ' It never ends: see how far you get.', true); }
    if (game.wave === 0) return hint(game.towers.length ? 'Ready? Press <b>Start</b>.' : 'Pick a tower below, then tap a tile beside the road.', true);
    hint(null);
  }

  /* ---------- actions ---------- */
  function pickBuild(kind) { if (kind && game && game.banned[kind]) { Snd.play('no'); hint('<b>' + TOWERS[kind].name + '</b> is not allowed in today\'s Daily Ink.'); return; } buildKind = kind; ghost = null; aimMode = null; if (kind) sel = null; Snd.play('tick'); baseHint(); }
  function select(t) { sel = t; buildKind = null; ghost = null; aimMode = null; baseHint(); }
  function tryBuild(c, r) {
    const T = TOWERS[buildKind];
    if (game.gold < game.costOf(buildKind)) { Snd.play('no'); hint('Not enough gold for a <b>' + T.name + '</b>.'); hud.bump(); return; }
    const t = game.build(buildKind, c, r);
    if (t) { ghost = null; if (game.gold < game.costOf(t.kind)) buildKind = null; baseHint(); }
  }
  function tap(c, r, x, y, touch) {
    const g = game; if (!g || g.over) return;
    const dr = dropAt(x, y); if (dr) return grabDrop(dr);
    if (aimMode === 'weight') { if (g.ability('weight', x, y)) aimMode = null; baseHint(); return; }
    const t = g.towerAt(c, r);
    if (buildKind) {
      if (t) return select(t);
      if (!g.canBuild(c, r, buildKind)) { ghost = null; Snd.play('no'); hint(TOWERS[buildKind].road ? '<b>Tacks</b> go on the road itself.' : g.getG(c, r) === 1 || g.getG(c, r) === 5 ? 'Only <b>Tacks</b> go on the road. Build beside it.' : 'Towers go on open ground beside the road.'); return; }
      if (touch && !(ghost && ghost.c === c && ghost.r === r)) { ghost = { c, r }; Snd.play('tick'); baseHint(); return; }
      return tryBuild(c, r);
    }
    if (t) { select(t === sel ? null : t); Snd.play('tick'); } else select(null);
  }
  function doUpgrade(spec) { if (sel && game.upgrade(sel, spec)) hud.c.psig = null; else Snd.play('no'); }
  function doSell() { if (sel) { game.sell(sel); sel = null; baseHint(); } }
  function cycleAim() { if (sel && canAim(sel.kind)) { sel.mode = AIMS[(AIMS.indexOf(sel.mode) + 1) % 4]; sel.beams.length = 0; Snd.play('tick'); } }
  function callWave() { Snd.init(); if (game.callWave()) baseHint(); }
  function useAbility(n) {
    Snd.init(); const g = game;
    if (g.noAbil) { Snd.play('no'); hint('Weight and Gust are locked in today\'s Daily Ink.'); return; }
    if (g.wave === 0 || g.cd[n] > 0) { Snd.play('no'); return; }
    if (n === 'gust') { g.ability('gust'); return; }
    aimMode = aimMode === n ? null : n; buildKind = null; ghost = null; sel = null; baseHint();
  }
  function setSpeed(v) { speed = v; $('bSpeed').textContent = v + '×'; $('bSpeed').classList.toggle('on', v > 1); }
  function setPause(p) { if (inMenu || (game && game.over)) return; paused = p; $('pauseOv').hidden = !p; }
  function setSound(v, say) {
    store.d.snd = v; store.save();
    $('sndW1').toggleAttribute('hidden', v < 1); $('sndW2').toggleAttribute('hidden', v < 2); $('sndOff').toggleAttribute('hidden', v > 0);
    $('bSound').title = ['Sound off', 'Effects only', 'Music and effects'][v];
    if (say) hint(['Sound <b>off</b>', 'Effects on, <b>music off</b>', '<b>Music</b> and effects on'][v]);
  }

  /* ---------- input ---------- */
  function locate(ev) {
    const r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * game.W, y = (ev.clientY - r.top) / r.height * game.H;
    return { x, y, c: Math.floor(x), r: Math.floor(y) };
  }
  cv.addEventListener('pointermove', ev => { if (!game) return; lastTouch = ev.pointerType !== 'mouse'; hover = locate(ev);
    cv.style.cursor = dropAt(hover.x, hover.y) || (!buildKind && !aimMode && game.towerAt(hover.c, hover.r)) ? 'pointer' : buildKind || aimMode ? 'crosshair' : 'default'; });
  cv.addEventListener('pointerleave', () => { hover = null; });
  cv.addEventListener('pointerdown', ev => {
    if (!game || inMenu) return; ev.preventDefault(); Snd.init();
    if (ev.button === 2) { pickBuild(null); select(null); return; }
    const p = locate(ev); lastTouch = ev.pointerType !== 'mouse'; hover = p; tap(p.c, p.r, p.x, p.y, lastTouch);
  });
  cv.addEventListener('contextmenu', ev => ev.preventDefault());
  window.addEventListener('keydown', ev => {
    if (ev.repeat || ev.metaKey || ev.ctrlKey || ev.altKey || inMenu || !game) return;
    const k = ev.key.toLowerCase();
    if (KEYS.indexOf(k) >= 0 && ORDER[KEYS.indexOf(k)]) { Snd.init(); const kind = ORDER[KEYS.indexOf(k)]; pickBuild(buildKind === kind ? null : kind); }
    else if (k === ' ' || k === 'enter') { if (ev.target && ev.target.tagName === 'BUTTON') return; ev.preventDefault(); if (!paused) callWave(); }
    else if (k === 'p') setPause(!paused);
    else if (k === 'f') setSpeed(speed % 3 + 1);
    else if (k === 'escape') { if (paused) setPause(false); else { pickBuild(null); select(null); } }
    else if (k === 'q') useAbility('weight');
    else if (k === 'e') useAbility('gust');
    else if (k === 'u') doUpgrade(0);
    else if (k === 'i') doUpgrade(1);
    else if (k === 't') cycleAim();
    else if (k === 'x') doSell();
  });
  $('bWave').addEventListener('click', callWave);
  $('aWeight').addEventListener('click', () => useAbility('weight'));
  $('aGust').addEventListener('click', () => useAbility('gust'));
  $('bSpeed').addEventListener('click', () => setSpeed(speed % 3 + 1));
  $('bPause').addEventListener('click', () => setPause(true));
  $('bResume').addEventListener('click', () => setPause(false));
  $('bRestart').addEventListener('click', () => { $('pauseOv').hidden = true; start(!!game.daily); });
  $('bMaps').addEventListener('click', () => { $('pauseOv').hidden = true; openMenu(); });
  $('bSound').addEventListener('click', () => { Snd.init(); setSound((store.d.snd + 2) % 3, true); });
  $('pA').addEventListener('click', () => doUpgrade(0));
  $('pB').addEventListener('click', () => doUpgrade(1));
  $('pAim').addEventListener('click', cycleAim);
  $('pSell').addEventListener('click', doSell);
  $('pClose').addEventListener('click', () => select(null));
  $('rRetry').addEventListener('click', () => { $('result').hidden = true; start(!!game.daily); });
  $('rMaps').addEventListener('click', () => { $('result').hidden = true; openMenu(); });
  $('rEndless').addEventListener('click', () => { $('result').hidden = true; game.continueEndless(); endT = 0; hud.c.nw = null; });
  $('bPlay').addEventListener('click', () => { Snd.init(); start(false); });
  document.addEventListener('pointerup', () => { const a = document.activeElement; if (!inMenu && a && a.tagName === 'BUTTON') a.blur(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && game && !inMenu && !game.over && game.wave > 0) setPause(true); });

  /* ---------- workshop ---------- */
  const PERKS = [
    { id: 'gold', name: 'Deep Pockets', desc: '+25 starting gold per level', costs: [3, 6, 10] },
    { id: 'lives', name: 'Thick Walls', desc: '+1 life per level', costs: [4, 8, 12] },
    { id: 'cd', name: 'Quick Hands', desc: 'Weight and Gust recharge 10% faster per level', costs: [3, 6, 10] },
    { id: 'frugal', name: 'Frugal', desc: 'Towers and upgrades cost 3% less per level', costs: [5, 10, 15] },
    { id: 'learn', name: 'Fast Learner', desc: 'Towers rank up 10% sooner per level', costs: [4, 9] },
    { id: 'luck', name: 'Lucky Finds', desc: 'Gold scraps pay 25% more per level', costs: [3, 7] }
  ];
  function perkLvl(id) { return (store.d.perks && store.d.perks[id]) | 0; }
  function renderShop() {
    $('shopSeals').textContent = store.d.seals | 0;
    $('perks').innerHTML = PERKS.map(p => {
      const lv = perkLvl(p.id), max = p.costs.length, cost = p.costs[lv], pips = p.costs.map((c, i) => '<i class="' + (i < lv ? 'on' : '') + '"></i>').join('');
      return '<div class="perk"><div class="ptx"><b>' + p.name + '</b><span>' + p.desc + '</span><div class="pips">' + pips + '</div></div>' +
        (lv >= max ? '<span class="maxed">Maxed</span>' : '<button class="act up buy" data-p="' + p.id + '"' + ((store.d.seals | 0) < cost ? ' disabled' : '') + '><u>Buy</u><span class="seal">' + cost + '</span></button>') + '</div>';
    }).join('');
    $('xSeals').textContent = store.d.seals | 0;
  }
  $('perks').addEventListener('click', ev => {
    const b = ev.target.closest('.buy'); if (!b) return;
    const p = PERKS.find(x => x.id === b.dataset.p), lv = perkLvl(p.id), cost = p.costs[lv];
    if (cost == null || (store.d.seals | 0) < cost) return;
    store.d.seals -= cost; store.d.perks = store.d.perks || {}; store.d.perks[p.id] = lv + 1; store.save(); Snd.init(); Snd.play('upgrade'); renderShop();
  });
  $('xShop').addEventListener('click', () => { Snd.init(); renderShop(); $('shopOv').hidden = false; });
  $('shopClose').addEventListener('click', () => { $('shopOv').hidden = true; newGame(true); });
  function syncDaily() {
    const D = TD.daily(todayStr()), M = TD.MODS[D.mod], best = store.d.daily && store.d.daily.date === D.date ? store.d.daily.wave : 0;
    const dt = new Date(); $('dDate').textContent = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    $('dName').textContent = MAPS[D.map].name + ' · ' + M.name; $('dTip').textContent = M.tip;
    $('dBest').textContent = best ? 'Your best today: wave ' + best : 'Endless. Same map and twist for everyone today.';
  }
  $('xDaily').addEventListener('click', () => { Snd.init(); start(true); });

  /* ---------- online leaderboard ---------- */
  const LB_HOME = 'https://paper-bastion.netlify.app';
  const LB = {
    ok: null,
    async check() {
      if (this.ok !== null) return this.ok;
      try {
        const r = await fetch('/api/scores?map=meadow&difficulty=standard', { cache: 'no-store' });
        const ct = r.headers.get('content-type') || '', t = await r.text();
        this.ok = r.ok && !/<html/i.test(t.slice(0, 200)) && (ct.indexOf('json') >= 0 || t.trim().charAt(0) === '{');
      } catch (e) { this.ok = false; }
      return this.ok;
    },
    async call(url, body) {
      const r = await fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { cache: 'no-store' });
      let j = null; try { j = JSON.parse(await r.text()); } catch (e) { }
      const v = j && (j.json !== undefined ? j.json : j);
      if (!r.ok) throw new Error((v && v.error) || 'The scoreboard did not answer. Try again in a moment.');
      return v;
    },
    top(map, diff) { return this.call('/api/scores?map=' + encodeURIComponent(map) + '&difficulty=' + encodeURIComponent(diff)); },
    submit(b) { return this.call('/api/scores', b); }
  };
  let lbMap = 0, lbDiff = 1, posted = false;
  function esc(s) { return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
  function lbOffline() {
    return LB_HOME.indexOf('http') === 0 ? 'The online leaderboard lives at <a href="' + LB_HOME + '" target="_blank" rel="noopener">' + LB_HOME.replace('https://', '') + '</a>. Play there to post your scores.' : 'The online leaderboard is not reachable from this copy of the game.';
  }
  function buildBoard() {
    const mb = $('lbMaps'), db = $('lbDiffs');
    const dbn = document.createElement('button'); dbn.textContent = 'Daily Ink'; dbn.id = 'lbm_daily'; dbn.className = 'daily'; dbn.addEventListener('click', () => { lbMap = 'daily'; loadBoard(); }); mb.appendChild(dbn);
    MAPS.forEach((m, i) => { const b = document.createElement('button'); b.textContent = m.name; b.id = 'lbm_' + i; b.addEventListener('click', () => { lbMap = i; loadBoard(); }); mb.appendChild(b); });
    DIFFS.forEach((d, i) => { const b = document.createElement('button'); b.textContent = d.name; b.id = 'lbd_' + i; b.addEventListener('click', () => { lbDiff = i; loadBoard(); }); db.appendChild(b); });
  }
  async function loadBoard(hi) {
    const isD = lbMap === 'daily', today = todayStr();
    MAPS.forEach((m, i) => $('lbm_' + i).classList.toggle('sel', i === lbMap));
    $('lbm_daily').classList.toggle('sel', isD); $('lbDiffs').hidden = isD;
    DIFFS.forEach((d, i) => $('lbd_' + i).classList.toggle('sel', i === lbDiff));
    const list = $('lbList'), note = $('lbNote'), key = lbMap + ':' + lbDiff; list.dataset.k = key;
    const bMap = isD ? 'daily' : MAPS[lbMap].id, bDiff = isD ? today : DIFFS[lbDiff].id, label = isD ? 'today\'s Daily Ink (' + TD.MODS[TD.daily(today).mod].name + ' on ' + MAPS[TD.daily(today).map].name + ')' : MAPS[lbMap].name + ' · ' + DIFFS[lbDiff].name;
    if (!(await LB.check())) { list.innerHTML = ''; note.innerHTML = lbOffline(); return; }
    note.textContent = ''; list.innerHTML = '<div class="lbrow sk"></div><div class="lbrow sk"></div><div class="lbrow sk"></div>';
    try {
      const res = await LB.top(bMap, bDiff);
      if (list.dataset.k !== key) return;
      const rows = res.rows || [];
      if (!rows.length) { list.innerHTML = ''; note.textContent = 'No scores on ' + label + ' yet. Be the first.'; return; }
      const me = (store.d.name || '').toLowerCase();
      list.innerHTML = rows.map((r, i) => '<div class="lbrow' + (r.name.toLowerCase() === me ? ' me' : '') + (hi && r.name.toLowerCase() === me ? ' new' : '') + '"><span class="lbpos">' + (i + 1) + '</span><span class="lbname">' + esc(r.name) + '</span><span class="lbwave"><b>' + r.wave + '</b>' + (r.won ? '<i title="Held all 30 waves">★</i>' : '') + '</span><span class="lblives">' + r.lives + ' ♥</span></div>').join('');
      note.textContent = (isD ? 'Today\'s board resets at midnight. ' : '') + 'Best run per player. Ranked by wave reached, then lives left.';
    } catch (e) { if (list.dataset.k === key) { list.innerHTML = ''; note.textContent = e.message; } }
  }
  function openBoard(m, d, hi) { lbMap = m; lbDiff = d; $('lbOv').hidden = false; loadBoard(hi); }
  async function prepPost() {
    posted = false; $('rPostMsg').textContent = ''; $('rPostBtn').disabled = false; $('rName').value = store.d.name || '';
    const ok = await LB.check();
    $('rPost').hidden = !ok; $('rBoard').hidden = !ok;
    if (!ok && LB_HOME.indexOf('http') === 0) $('rPostMsg').innerHTML = lbOffline();
  }
  async function postScore() {
    const g = game, name = $('rName').value.trim().replace(/\s+/g, ' ');
    if (!name) { $('rPostMsg').textContent = 'Type a name first.'; $('rName').focus(); return; }
    if (posted) return;
    store.d.name = name; store.save(); $('rPostBtn').disabled = true; $('rPostMsg').textContent = 'Posting…';
    try {
      const r = await LB.submit({ name, map: g.daily ? 'daily' : MAPS[g.mapIdx].id, difficulty: g.daily ? g.daily.date : DIFFS[g.diffIdx].id, wave: g.wave, won: g.wave >= WAVES && (g.over === 'win' || g.endless), lives: g.lives, kills: g.kills, runId: g.runId });
      posted = true; $('rPostMsg').textContent = r.best ? 'Posted. You are #' + r.rank + (g.daily ? ' in today\'s Daily Ink.' : ' on ' + MAPS[g.mapIdx].name + ' · ' + DIFFS[g.diffIdx].name + '.') : 'Posted. Your best here is still higher, at #' + r.rank + '.';
    } catch (e) { $('rPostBtn').disabled = false; $('rPostMsg').textContent = e.message; }
  }
  $('rPostBtn').addEventListener('click', postScore);
  $('rName').addEventListener('keydown', ev => { if (ev.key === 'Enter') postScore(); ev.stopPropagation(); });
  $('rBoard').addEventListener('click', () => openBoard(game.daily ? 'daily' : game.mapIdx, game.diffIdx, posted));
  $('bBoard').addEventListener('click', () => openBoard(selMap, selDiff));
  $('lbClose').addEventListener('click', () => { $('lbOv').hidden = true; });

  /* ---------- menu + results ---------- */
  function stars(n) { let s = ''; for (let i = 0; i < 3; i++) s += i < n ? '<s>★</s>' : '★'; return s; }
  function bestOf(m, d) { const b = store.d.best[MAPS[m].id]; return b && b[DIFFS[d].id]; }
  function buildMenu() {
    const box = $('maps'), dbox = $('diffs');
    MAPS.forEach((m, i) => {
      const b = document.createElement('button'); b.className = 'map'; b.id = 'map_' + i;
      b.innerHTML = '<canvas width="420" height="270"></canvas><div class="mtxt"><b>' + m.name + '</b><div class="stars" id="ms_' + i + '"></div></div>';
      b.addEventListener('click', () => { selMap = i; syncMenu(); newGame(true); });
      box.appendChild(b);
      const k = b.querySelector('canvas'), c = k.getContext('2d'), g = new Game(i, 1, false, 1);
      c.setTransform(k.width / (g.W * U), 0, 0, k.height / (g.H * U), 0, 0); drawTerrain(c, g, true);
    });
    DIFFS.forEach((d, i) => {
      const b = document.createElement('button'); b.textContent = d.name; b.id = 'df_' + i;
      b.addEventListener('click', () => { selDiff = i; syncMenu(); });
      dbox.appendChild(b);
    });
  }
  function syncMenu() {
    MAPS.forEach((m, i) => { $('map_' + i).classList.toggle('sel', i === selMap); const b = bestOf(i, selDiff); $('ms_' + i).innerHTML = b && b.win ? stars(b.stars) : b ? 'Best: wave ' + b.wave : stars(0); });
    DIFFS.forEach((d, i) => $('df_' + i).classList.toggle('sel', i === selDiff));
    $('mapTag').textContent = MAPS[selMap].tag;
    syncDaily(); $('xSeals').textContent = store.d.seals | 0;
    $('diffTag').textContent = DIFFS[selDiff].name + ': ' + DIFFS[selDiff].tag;
    store.d.map = selMap; store.d.diff = selDiff; store.save();
  }
  function openMenu() { inMenu = true; paused = false; $('menu').hidden = false; syncMenu(); newGame(true); baseHint(); }
  function start(daily) { dailyMode = daily ? TD.daily(todayStr()) : null; inMenu = false; $('menu').hidden = true; $('result').hidden = true; newGame(false); setSpeed(1); baseHint(); }
  function todayStr() { const d = new Date(), p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
  function showResult() {
    const g = game, win = g.over === 'win', st = win ? g.stars() : 0;
    if (!g.sealsPaid) {
      const earned = Math.floor(g.wave / 5) + (win ? st * 2 : 0); g.sealsPaid = earned;
      store.d.seals = (store.d.seals | 0) + earned;
    }
    if (g.daily) {
      const cur = store.d.daily || {}; if (cur.date !== g.daily.date || g.wave > (cur.wave | 0)) store.d.daily = { date: g.daily.date, wave: g.wave };
    } else {
      const id = MAPS[g.mapIdx].id, did = DIFFS[g.diffIdx].id, best = store.d.best[id] || (store.d.best[id] = {}), prev = best[did];
      if (!prev || (win && (!prev.win || st > prev.stars)) || (!win && !prev.win && g.wave > prev.wave)) best[did] = { win, stars: st, wave: g.wave };
    }
    store.save();
    $('rSeals').textContent = g.sealsPaid ? '+' + g.sealsPaid + (g.sealsPaid === 1 ? ' seal' : ' seals') + ' for the Workshop (' + (store.d.seals | 0) + ' total)' : 'Reach wave 5 to earn Workshop seals.';
    $('rTitle').textContent = win ? 'The keep stands!' : g.daily ? 'Daily Ink done' : 'The page is soaked';
    $('rStars').innerHTML = stars(st); $('rStars').hidden = !win;
    $('rText').textContent = win ? (st === 3 ? 'Barely a drop got through. Try a harder setting, or keep going for as long as you can.' : 'All 30 waves wiped clean. Lose fewer lives to earn more stars.')
      : g.daily ? 'You reached wave ' + g.wave + ' in today\'s Daily Ink (' + TD.MODS[g.mod].name + ' on ' + MAPS[g.mapIdx].name + ').'
      : (g.endless ? 'You held on to wave ' + g.wave + ' of the endless flood.' : 'The ink broke through on wave ' + g.wave + ' of ' + WAVES + '. ' + (g.wave < 7 ? 'Crowd your towers around the bends, where they get the longest look at the road.' : 'Mix your towers, upgrade the best-placed ones, and keep something that hits flyers.'));
    $('rWave').textContent = g.wave; $('rKills').textContent = g.kills; $('rLives').textContent = g.lives;
    $('rEndless').hidden = !win; $('result').hidden = false; Snd.play(win ? 'win' : 'lose');
    prepPost();
  }

  /* ---------- loop ---------- */
  function frame(ts) {
    const rdt = Math.min(.1, (ts - last) / 1000 || 0); last = ts; vt += rdt;
    if (game) {
      let n = 0;
      if (!paused && !inMenu && !game.over) {
        acc += rdt * speed * (slowmo > 0 ? .25 : 1); if (slowmo > 0) slowmo -= rdt;
        while (acc >= DT && n < 14) { game.step(); acc -= DT; n++; takeFx(); if (game.over) break; }
        if (n >= 14) acc = 0;
      }
      if (!paused) { stepFx(game.over ? rdt : n * DT); stepDrops(n * DT); }
      if (!paused && !game.over) {
        let boss = false; if (!inMenu) for (const e of game.enemies) if (e.E.boss) { boss = true; break; }
        const MM = [['A', 0], ['B', 2], ['C', -3], ['A', 5], ['B', -2], ['C', 3], ['B', 4], ['A', -4], ['C', 1]][game.mapIdx] || ['A', 0];
        let prog = 0; for (const e of game.enemies) { const p = e.d / e.path.total; if (p > prog) prog = p; }
        const ne = game.enemies.length, lvl = ne === 0 ? 0 : (prog > .72 || ne > 28) ? 3 : (prog > .45 || ne > 12) ? 2 : 1;
        Snd.music(inMenu ? 'calm' : boss ? 'boss' : (ne || game.spawns.length) ? 'battle' : 'calm', { lead: MM[0], tr: MM[1], lvl });
      }
      if (!inMenu && !paused && !game.over && game.wave > 0 && game.lives <= Math.ceil(game.maxLives * .25)) {
        if (!game.toldLow) { game.toldLow = 1; hint('<b>Last stand!</b> Use Weight and Gust, and patch the leaks.'); Snd.play('sting'); lowPulse = 1; }
        if ((beatT -= rdt) <= 0 && game.enemies.length) { beatT = game.lives <= 2 ? .75 : 1.1; lowPulse = 1; Snd.play('beat'); }
      }
      if (endT > 0 && (endT += rdt) > 1.1) { endT = -1; sel = null; buildKind = null; aimMode = null; showResult(); }
      if (hintLock < 1e8 && hintLock > 0 && (hintLock -= rdt) <= 0) baseHint();
      render(rdt); hud.sync();
    }
    requestAnimationFrame(frame);
  }

  hud.build(); buildMenu(); buildBoard(); setSound(clamp(store.d.snd | 0, 0, 2));
  let rz = 0;
  new ResizeObserver(() => { cancelAnimationFrame(rz); rz = requestAnimationFrame(layout); }).observe(stage);
  openMenu();
  requestAnimationFrame(frame);
  window.__pb = { drops: () => drops, forceDrop: () => { dropT = 0; stepDrops(.001); }, get game() { return game; }, start, tap, pickBuild, callWave, setSpeed, select, Music, Snd };
})();
