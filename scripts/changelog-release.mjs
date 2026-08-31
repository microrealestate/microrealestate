#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import {
  compareVersions,
  highest,
  parseVersion,
  VERSION_PATTERN
} from './lib/semver.mjs';

const [mode, requested] = process.argv.slice(2);

if (mode !== '--resolve' || !requested) {
  console.error(
    'usage: changelog-release.mjs --resolve <version>   (candidate paths on stdin)'
  );
  process.exit(2);
}

const match = requested.match(VERSION_PATTERN);
if (!match) {
  console.error(`Invalid version '${requested}'`);
  process.exit(2);
}

const version = parseVersion(match[1]);

const entries = readFileSync(0, 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((file) => ({
    file,
    match: file
      .replace(/^changelog\//, '')
      .replace(/\.md$/, '')
      .match(VERSION_PATTERN)
  }))
  .filter(({ match: found }) => found)
  .map(({ file, match: found }) => ({ file, ...parseVersion(found[1]) }));

if (!entries.length) {
  console.error(
    `No changelog release entries at this commit, so ${version.version} was never prepared.`
  );
  process.exit(1);
}

let resolved = entries.find((entry) => entry.version === version.version);

// A commit prepared as a release candidate may be promoted to the matching
// stable version. One candidate never borrows another candidate's entry.
if (!resolved && version.prerelease === null) {
  resolved = highest(
    entries.filter(
      (entry) =>
        entry.prerelease !== null &&
        entry.numbers.every((number, i) => number === version.numbers[i])
    )
  );
}

if (!resolved) {
  console.error(
    `No changelog entry for ${version.version}. Run the Prepare release workflow, merge its pull request, wait for CI, then promote that merge commit.`
  );
  process.exit(1);
}

// Entries accumulate in the repository, so existing is not enough: the entry
// must be the newest one at this commit, or an old version could be promoted
// against a much later commit.
const newest = highest(entries);
if (compareVersions(resolved, newest) !== 0) {
  console.error(
    `${resolved.file} is not the newest entry at this commit (${newest.version} is). Promote the commit that prepared ${version.version}.`
  );
  process.exit(1);
}

console.log(resolved.file);
