// Run from the mobile app root:  node check-deps.mjs
// Finds problems that otherwise only show up when Metro (or a native build) fails:
//   1. packages your code imports that package.json does not declare
//   2. declared packages that are not installed in node_modules
//   3. which declared packages contain NATIVE code (these need a dev-client rebuild)
// Only files reachable from index.ts / App.tsx are scanned, so dead code
// (the old web prototype, archive/) does not produce false alarms.
import fs from 'node:fs';
import path from 'node:path';
import { builtinModules } from 'node:module';

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const declared = new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]);
const exts = ['', '.tsx', '.ts', '.js', '.jsx', '.native.tsx', '.native.ts', '.ios.tsx', '.android.tsx', '.json'];
const importRe = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)|import\(\s*['"]([^'"]+)['"]\s*\)/g;

const isFile = (p) => fs.existsSync(p) && fs.statSync(p).isFile();
function resolveRel(from, spec) {
  const base = path.resolve(path.dirname(from), spec);
  const out = [];
  for (const e of exts) if (isFile(base + e)) out.push(base + e);
  for (const e of exts.slice(1)) if (isFile(path.join(base, 'index' + e))) out.push(path.join(base, 'index' + e));
  const dir = path.dirname(base), name = path.basename(base);
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) {
    const m = f.match(/^(.+)\.(native|ios|android|web)\.(tsx?|jsx?)$/);
    if (m && m[1] === name) out.push(path.join(dir, f));
  }
  return [...new Set(out)];
}
const pkgName = (spec) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);

const entries = ['index.ts', 'index.js', 'App.tsx', 'App.js'].map((f) => path.join(root, f)).filter(isFile);
const seen = new Set();
const used = new Map(); // package -> [files]
const stack = [...entries];
while (stack.length) {
  const file = stack.pop();
  if (seen.has(file)) continue;
  seen.add(file);
  if (!/\.(tsx?|jsx?)$/.test(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(importRe)) {
    const spec = m[1] ?? m[2] ?? m[3] ?? m[4];
    if (!spec) continue;
    if (spec.startsWith('.')) { for (const r of resolveRel(file, spec)) if (!seen.has(r)) stack.push(r); continue; }
    if (spec.startsWith('node:') || builtinModules.includes(spec) || spec.startsWith('@/')) continue;
    const name = pkgName(spec);
    if (!used.has(name)) used.set(name, []);
    used.get(name).push(path.relative(root, file));
  }
}

let problems = 0;
console.log(`Scanned ${seen.size} files reachable from the app entry point.\n`);

const undeclared = [...used.keys()].filter((n) => !declared.has(n)).sort();
console.log('1) Imported but NOT in package.json:');
if (undeclared.length === 0) console.log('   none\n');
else { problems += undeclared.length; for (const n of undeclared) console.log(`   ✗ ${n}   (e.g. ${used.get(n)[0]})`); console.log(`\n   Fix: npx expo install ${undeclared.join(' ')}\n`); }

const notInstalled = [...declared].filter((n) => !fs.existsSync(path.join(root, 'node_modules', n, 'package.json'))).sort();
console.log('2) In package.json but NOT installed in node_modules:');
if (notInstalled.length === 0) console.log('   none\n');
else { problems += notInstalled.length; for (const n of notInstalled) console.log(`   ✗ ${n}`); console.log('\n   Fix: npm install (or npm ci)\n'); }

// Required peer dependencies of what you have installed. Native ones (e.g.
// react-native-screens for React Navigation, expo-font for @expo/vector-icons)
// must be installed directly or the app can crash outside Expo Go.
const missingPeers = new Map();
for (const dep of declared) {
  const pj = path.join(root, 'node_modules', dep, 'package.json');
  if (!fs.existsSync(pj)) continue;
  const meta = JSON.parse(fs.readFileSync(pj, 'utf8'));
  for (const peer of Object.keys(meta.peerDependencies ?? {})) {
    if (meta.peerDependenciesMeta?.[peer]?.optional) continue;
    if (declared.has(peer) || fs.existsSync(path.join(root, 'node_modules', peer, 'package.json'))) continue;
    if (!missingPeers.has(peer)) missingPeers.set(peer, []);
    missingPeers.get(peer).push(dep);
  }
}
console.log('2b) Required peer dependencies that are NOT installed:');
if (missingPeers.size === 0) console.log('   none\n');
else {
  problems += missingPeers.size;
  for (const [peer, by] of missingPeers) console.log(`   ✗ ${peer}   (required by ${by.join(', ')})`);
  console.log(`\n   Fix: npx expo install ${[...missingPeers.keys()].join(' ')}\n`);
}

const hasNative = (n) => {
  const d = path.join(root, 'node_modules', n);
  return ['expo-module.config.json', 'react-native.config.js', 'android', 'ios'].some((x) => fs.existsSync(path.join(d, x)));
};
const native = [...used.keys()].filter((n) => declared.has(n) && fs.existsSync(path.join(root, 'node_modules', n)) && hasNative(n)).sort();
console.log('3) Packages your app uses that contain NATIVE code (must be inside the dev-client build you installed):');
for (const n of native) console.log(`   • ${n}@${JSON.parse(fs.readFileSync(path.join(root, 'node_modules', n, 'package.json'), 'utf8')).version}`);
console.log('\n   If any of these were added since your last build, you need to rebuild the dev client.');
console.log('   Tip: `git log -p -- package.json` (or compare with the package.json from the build) shows what was added since.\n');

process.exit(problems ? 1 : 0);
