#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { highest, parseVersion, VERSION_PATTERN } from './lib/semver.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function getVersion() {
  try {
    const output = execSync('git tag --points-at HEAD', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });

    const versions = output
      .split('\n')
      .map((tag) => tag.trim().match(VERSION_PATTERN))
      .filter(Boolean)
      .map((match) => parseVersion(match[1]));

    return highest(versions)?.version ?? null;
  } catch {
    // no git repository
  }
  return null;
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

const version = getVersion();
const sha = getShortSha();

writeFileSync(
  path.join(ROOT, 'version.json'),
  `${JSON.stringify({ version, sha }, null, 2)}\n`
);

console.log(
  `version.json written (sha: ${sha}${version ? `, version: ${version}` : ''})`
);
