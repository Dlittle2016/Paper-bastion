// Builds public/index.html from core.js + ui.js + shell.html.  Run: node src/build.js
const fs = require('fs'), path = require('path'), D = __dirname;
const core = fs.readFileSync(path.join(D, 'core.js'), 'utf8').replace(/\nif \(typeof module[^\n]*\n?/, '\n');
const ui = fs.readFileSync(path.join(D, 'ui.js'), 'utf8');
const html = fs.readFileSync(path.join(D, 'shell.html'), 'utf8').replace('/*CORE*/', () => core).replace('/*UI*/', () => ui);
const TD = require(path.join(D, 'core.js'));
const words = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty','twenty-one','twenty-two','twenty-three','twenty-four','twenty-five'];
const w = n => words[n] || String(n), cap = s => s[0].toUpperCase() + s.slice(1);
const desc = `A papercraft tower defense game. ${cap(w(TD.ORDER.length))} towers, ${w(Object.keys(TD.ENEMIES).length)} enemies, ${w(TD.MAPS.length)} maps, thirty waves, a Daily Ink challenge and an online leaderboard.`;
const icon = '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect x=%2214%22 y=%2222%22 width=%2236%22 height=%2234%22 rx=%224%22 fill=%22%23f7f0e1%22/%3E%3Cpath d=%22M8 24L18 6l10 18z%22 fill=%22%23e9564c%22/%3E%3Cpath d=%22M36 24L46 6l10 18z%22 fill=%22%23e9564c%22/%3E%3Cpath d=%22M26 56V44a6 6 0 0112 0v12z%22 fill=%22%233a3460%22/%3E%3C/svg%3E">';
const skel = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui;background:#faf9f5}img{max-width:100%}[hidden]{display:none!important}</style></head><body>';
let out = skel + html + '</body></html>';
out = out.replace('<title>Paper Bastion</title>', '<title>Paper Bastion</title><meta name="description" content="' + desc + '">' + icon);
fs.writeFileSync(path.join(D, '..', 'public', 'index.html'), out);
fs.writeFileSync(path.join(D, '..', 'paper-bastion.html'), html);
console.log('built public/index.html', (out.length / 1024).toFixed(1) + 'KB');
