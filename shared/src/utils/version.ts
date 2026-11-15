const VERSION_PATTERN = /^v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/;

export type ParsedVersion = {
  version: string;
  numbers: number[];
  prerelease: string[] | null;
};

// Accepts `1.2.3`, `v1.2.3` or `1.2.3-rc1`; anything else (`latest`, a sha) is null
export function parseVersion(value?: string | null): ParsedVersion | null {
  const match = value?.trim().match(VERSION_PATTERN);
  if (!match) {
    return null;
  }
  const version = match[1] ?? '';
  const dash = version.indexOf('-');
  const core = dash === -1 ? version : version.slice(0, dash);
  const prerelease = dash === -1 ? null : version.slice(dash + 1).split('.');
  return { version, numbers: core.split('.').map(Number), prerelease };
}

function comparePrerelease(a: string[] | null, b: string[] | null) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const partA = a[i] ?? '';
    const partB = b[i] ?? '';
    if (partA === partB) continue;
    const numericA = /^\d+$/.test(partA);
    const numericB = /^\d+$/.test(partB);
    if (numericA && numericB) return Number(partA) - Number(partB);
    if (numericA !== numericB) return numericA ? -1 : 1;
    return partA < partB ? -1 : 1;
  }
  return a.length - b.length;
}

// Semver precedence: negative when a < b, 0 when equal, positive when a > b
export function compareVersions(a: ParsedVersion, b: ParsedVersion) {
  for (let i = 0; i < 3; i++) {
    const diff = (a.numbers[i] ?? 0) - (b.numbers[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return comparePrerelease(a.prerelease, b.prerelease);
}

// False when either side is not a version
export function isNewerVersion(
  candidate?: string | null,
  current?: string | null
) {
  const a = parseVersion(candidate);
  const b = parseVersion(current);
  return !!a && !!b && compareVersions(a, b) > 0;
}
