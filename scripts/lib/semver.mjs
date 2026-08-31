export const VERSION_PATTERN = /^v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/;

export function parseVersion(version) {
  const dash = version.indexOf('-');
  const core = dash === -1 ? version : version.slice(0, dash);
  const prerelease = dash === -1 ? null : version.slice(dash + 1).split('.');
  return { version, numbers: core.split('.').map(Number), prerelease };
}

function comparePrerelease(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) continue;
    const numericA = /^\d+$/.test(a[i]);
    const numericB = /^\d+$/.test(b[i]);
    if (numericA && numericB) return Number(a[i]) - Number(b[i]);
    if (numericA !== numericB) return numericA ? -1 : 1;
    return a[i] < b[i] ? -1 : 1;
  }
  return a.length - b.length;
}

export function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a.numbers[i] !== b.numbers[i]) return a.numbers[i] - b.numbers[i];
  }
  return comparePrerelease(a.prerelease, b.prerelease);
}

export function highest(versions) {
  return versions.length
    ? versions.reduce((a, b) => (compareVersions(a, b) >= 0 ? a : b))
    : null;
}
