// The KOUP demo model (owner, 2026-11-25: "demo first, nothing replaced until I approve"):
// `node tours/koupup-v2/make-demo.cjs` copies the live model (tours/koupup/koupup.glb) and adds a node
// `TOUR_FEATURES` whose extras switch on what the demo shows (Part 2: `fitGrip`, hands fitted to what they hold).
// Upload the result (tours/koupup-v2/koupup-v2.glb) to a NEW test tour with a private link; KOUP's live tour keeps its
// own model and is not touched.
const fs = require('fs');
const path = require('path');
const FEATURES = { fitGrip: true };
const src = path.join(__dirname, '../koupup/koupup.glb');
const out = path.resolve(process.argv[2] ?? path.join(__dirname, 'koupup-v2.glb'));
const glb = fs.readFileSync(src);
if (glb.readUInt32LE(0) !== 0x46546c67) throw new Error('not a .glb');
const jsonLen = glb.readUInt32LE(12);
const json = JSON.parse(glb.subarray(20, 20 + jsonLen).toString('utf8'));
const rest = glb.subarray(20 + jsonLen); // the binary chunk, as it is
json.nodes = json.nodes ?? [];
const scene = json.scenes[json.scene ?? 0];
const existing = json.nodes.findIndex((n) => n.name === 'TOUR_FEATURES');
if (existing >= 0) json.nodes[existing].extras = FEATURES;
else {
  json.nodes.push({ name: 'TOUR_FEATURES', extras: FEATURES });
  scene.nodes.push(json.nodes.length - 1);
}
let text = Buffer.from(JSON.stringify(json), 'utf8');
const pad = (4 - (text.length % 4)) % 4;
text = Buffer.concat([text, Buffer.alloc(pad, 0x20)]);
const head = Buffer.alloc(20);
head.writeUInt32LE(0x46546c67, 0);
head.writeUInt32LE(2, 4);
head.writeUInt32LE(20 + text.length + rest.length, 8);
head.writeUInt32LE(text.length, 12);
head.writeUInt32LE(0x4e4f534a, 16);
fs.writeFileSync(out, Buffer.concat([head, text, rest]));
console.log(`${out}: ${(fs.statSync(out).size / 1048576).toFixed(1)} MB, features ${JSON.stringify(FEATURES)}`);
