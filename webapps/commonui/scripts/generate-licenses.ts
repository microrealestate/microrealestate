// Runs with plain node (type stripping): keep the syntax erasable.
import fs from 'node:fs';
import path from 'node:path';

type PackageJson = {
  name?: string;
  license?: string | { type?: string };
  licenses?: Array<string | { type?: string }>;
  author?: string | { name?: string };
  homepage?: string;
  repository?: string | { url?: string };
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

type LicenseEntry = {
  name: string;
  license: string;
  author?: string;
  url?: string;
  text?: string;
};

const LICENSE_FILE = /^(licen[cs]e|copying|notice)(\.|-|$)/i;
const WORKSPACE_SCOPE = '@microrealestate/';

function readJson(file: string): PackageJson {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function findPackageDir(name: string, fromDir: string): string | undefined {
  let dir = fromDir;
  while (true) {
    const candidate = path.join(dir, 'node_modules', name);
    if (fs.existsSync(path.join(candidate, 'package.json'))) {
      return fs.realpathSync(candidate);
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return undefined;
    }
    dir = parent;
  }
}

function licenseOf(pkg: PackageJson): string {
  const licenseName = (value: string | { type?: string } | undefined) =>
    typeof value === 'string' ? value : value?.type;
  const license = licenseName(pkg.license);
  if (license) {
    return license;
  }
  const legacy = (pkg.licenses || []).map(licenseName).filter(Boolean);
  return legacy.length ? legacy.join(' OR ') : 'UNKNOWN';
}

function authorOf(pkg: PackageJson): string | undefined {
  return typeof pkg.author === 'string' ? pkg.author : pkg.author?.name;
}

function urlOf(pkg: PackageJson): string | undefined {
  const repository =
    typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
  const url = repository
    ?.replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/^ssh:\/\/git@/, 'https://')
    .replace(/\.git$/, '')
    .replace(/^github:/, 'https://github.com/');
  if (url && /^https?:\/\//.test(url)) {
    return url;
  }
  if (url && /^[\w.-]+\/[\w.-]+$/.test(url)) {
    return `https://github.com/${url}`;
  }
  return pkg.homepage;
}

function licenseTextOf(dir: string): string | undefined {
  const file = fs
    .readdirSync(dir)
    .filter((entry) => LICENSE_FILE.test(entry))
    .sort()
    .find((entry) => fs.statSync(path.join(dir, entry)).isFile());
  return file
    ? fs.readFileSync(path.join(dir, file), 'utf8').trim()
    : undefined;
}

function collect(appDir: string): LicenseEntry[] {
  const entries = new Map<string, LicenseEntry>();
  const visited = new Set<string>();

  const visit = (dir: string, includeSelf: boolean) => {
    if (visited.has(dir)) {
      return;
    }
    visited.add(dir);
    const pkg = readJson(path.join(dir, 'package.json'));
    if (includeSelf && pkg.name && !pkg.name.startsWith(WORKSPACE_SCOPE)) {
      // No version in the output: the file is public, and exact versions
      // would let anyone match the stack against known vulnerabilities.
      // Two versions with the same notice are one entry.
      const text = licenseTextOf(dir);
      const license = licenseOf(pkg);
      const key = `${pkg.name}\0${license}\0${text ?? ''}`;
      if (!entries.has(key)) {
        entries.set(key, {
          name: pkg.name,
          license,
          author: authorOf(pkg),
          url: urlOf(pkg),
          text
        });
      }
    }
    const required = Object.keys(pkg.dependencies || {});
    const optional = Object.keys(pkg.optionalDependencies || {});
    for (const name of [...required, ...optional]) {
      const depDir = findPackageDir(name, dir);
      if (depDir) {
        visit(depDir, true);
      } else if (!optional.includes(name)) {
        console.warn(`licenses: ${name} (required by ${pkg.name}) not found`);
      }
    }
  };

  visit(fs.realpathSync(appDir), false);
  return [...entries.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const appDir = path.resolve(process.argv[2] || '.');
const entries = collect(appDir);
const outFile = path.join(appDir, 'public', 'licenses.json');
fs.writeFileSync(outFile, `${JSON.stringify(entries)}\n`);

const unknown = entries.filter(({ license }) => license === 'UNKNOWN');
console.log(
  `licenses: ${entries.length} packages written to ${path.relative(process.cwd(), outFile)}`
);
if (unknown.length) {
  console.log(
    `licenses: no license declared by ${unknown.map(({ name }) => name).join(', ')}`
  );
}
