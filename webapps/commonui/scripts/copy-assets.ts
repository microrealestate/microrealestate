import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const PLACEHOLDER = "'mre-__ASSETS_HASH__'";

const source = path.resolve(import.meta.dirname, '../src/assets/public');
const appDir = path.resolve(process.argv[2] || '.');
const target = path.join(appDir, 'public');

fs.cpSync(source, target, { recursive: true, force: true });

// The service worker cache name changes whenever any copied file changes.
const hash = crypto.createHash('sha256');
const files = fs
  .readdirSync(source, { recursive: true, encoding: 'utf8' })
  .filter((file) => fs.statSync(path.join(source, file)).isFile())
  .map((file) => file.split(path.sep).join('/'))
  .sort();
for (const file of files) {
  hash.update(file);
  hash.update(fs.readFileSync(path.join(source, file)));
}
const assetsHash = hash.digest('hex').slice(0, 10);

const swFile = path.join(target, 'sw.js');
const sw = fs.readFileSync(swFile, 'utf8');
if (!sw.includes(PLACEHOLDER)) {
  throw new Error(`${PLACEHOLDER} not found in ${swFile}`);
}
fs.writeFileSync(swFile, sw.replace(PLACEHOLDER, `'mre-${assetsHash}'`));

console.log(
  `Asset files copied to ${path.relative(process.cwd(), target) || '.'} (cache mre-${assetsHash})`
);
