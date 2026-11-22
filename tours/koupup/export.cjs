// Builds the KOUPUP café tour model: `node tours/koupup/export.cjs [out.glb]` (default tours/koupup/out/koupup.glb).
// Runs build.html in the test browser (Playwright's Chromium), which assembles the café and exports it as a .glb.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const out = path.resolve(process.argv[2] ?? path.join(__dirname, 'out/koupup.glb'));
const FILES = {
  'serif.json': 'node_modules/three/examples/fonts/droid/droid_serif_regular.typeface.json',
  'arabic.woff2': 'themes/memory-museum/v2/fonts/noto-sans-arabic-arabic-wght-normal.woff2',
};
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage();
  p.on('pageerror', (e) => console.log('pageerror', e.message));
  p.on('console', (m) => /tris/.test(m.text()) && console.log(m.text()));
  await p.route('http://cafe.test/**', (r) => {
    const u = r.request().url().replace('http://cafe.test/', '').split('?')[0];
    const f = u.startsWith('three/') ? path.join(ROOT, 'node_modules', u) : FILES[u] ? path.join(ROOT, FILES[u]) : path.join(__dirname, u);
    if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    const type = f.endsWith('.js') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : f.endsWith('.json') ? 'application/json' : 'application/octet-stream';
    r.fulfill({ status: 200, body: fs.readFileSync(f), contentType: type });
  });
  await p.goto('http://cafe.test/build.html');
  await p.waitForFunction(() => window.result, null, { timeout: 180000 });
  const res = await p.evaluate(() => window.result);
  await b.close();
  if (res.error) {
    console.error(res.error);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(res.b64, 'base64'));
  console.log(`${out}: ${(fs.statSync(out).size / 1048576).toFixed(1)} MB, ${res.meshes} parts, ${res.tris} triangles`);
})();
