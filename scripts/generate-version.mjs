#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { highest, parseVersion, VERSION_PATTERN } from './lib/semver.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function getRelease() {
  const dir = path.join(ROOT, 'changelog');
  if (!existsSync(dir)) {
    return null;
  }
  const versions = readdirSync(dir)
    .map((file) => file.replace(/\.md$/, '').match(VERSION_PATTERN))
    .filter(Boolean)
    .map((match) => parseVersion(match[1]));
  return highest(versions)?.version ?? null;
}

function getShortSha() {
  try {
    return execSync('git rev-parse --short=7 HEAD', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return 'dev';
  }
}

function getCommitDate() {
  try {
    return execSync('git show -s --format=%cI HEAD', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return null;
  }
}

const release = getRelease();
const sha = getShortSha();
const date = getCommitDate();

writeFileSync(
  path.join(ROOT, 'version.json'),
  `${JSON.stringify({ release, sha, date }, null, 2)}\n`
);

console.log(
  `version.json written (sha: ${sha}${release ? `, release: ${release}` : ''})`
);
