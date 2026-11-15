import { useEnv } from '@microrealestate/commonui/providers/EnvProvider';
import {
  compareVersions,
  isNewerVersion,
  parseVersion,
  RELEASES_API_URL
} from '@microrealestate/shared';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

const APP_RELEASE =
  parseVersion(process.env.NEXT_PUBLIC_RELEASE_VERSION)?.version ?? null;

export type ReleaseNotes = { version: string; html: string };

type GitHubRelease = {
  tag_name?: string;
  body_html?: string;
  draft?: boolean;
  prerelease?: boolean;
};

const CACHE_KEY = 'mre-releases';
const CACHE_MS = 12 * 60 * 60 * 1000;

// Kept across reloads and tabs to spare GitHub's unauthenticated limit (60
// calls an hour per IP). It holds every stable release, so the comparison with
// the running one is redone on each read and stays right after an update.
function readCache(): ReleaseNotes[] | null {
  try {
    const cached = JSON.parse(window.localStorage.getItem(CACHE_KEY) || 'null');
    // anything but the shape written below is ignored and fetched again
    return cached &&
      Date.now() - cached.checkedAt < CACHE_MS &&
      Array.isArray(cached.releases) &&
      cached.releases.every(
        (release: unknown) =>
          typeof (release as ReleaseNotes)?.version === 'string' &&
          typeof (release as ReleaseNotes)?.html === 'string'
      )
      ? cached.releases
      : null;
  } catch {
    return null;
  }
}

function writeCache(releases: ReleaseNotes[]) {
  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ checkedAt: Date.now(), releases })
    );
  } catch {
    // storage blocked: GitHub is asked again on the next load
  }
}

// Stable releases, newest first. Their notes are the repository's
// changelog/<version>.md, which the release workflow publishes as the body;
// GitHub renders it (`body_html`), so no markdown parser ships to the browser.
async function fetchReleases(): Promise<ReleaseNotes[]> {
  const cached = readCache();
  if (cached) {
    return cached;
  }
  const response = await fetch(RELEASES_API_URL, {
    headers: { Accept: 'application/vnd.github.html+json' },
    credentials: 'omit',
    referrerPolicy: 'no-referrer'
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const payload: GitHubRelease[] = await response.json();
  const releases = payload
    .flatMap((release) => {
      const parsed = parseVersion(release.tag_name);
      return parsed && !release.draft && !release.prerelease
        ? [{ parsed, html: release.body_html ?? '' }]
        : [];
    })
    .sort((a, b) => compareVersions(b.parsed, a.parsed))
    .map(({ parsed, html }) => ({ version: parsed.version, html }));
  writeCache(releases);
  return releases;
}

// The stable releases newer than the running one, newest first
export default function useNewReleases(): ReleaseNotes[] {
  const demoMode = useEnv('DEMO_MODE') === 'true';
  const { data } = useQuery({
    queryKey: ['releases'],
    queryFn: fetchReleases,
    enabled: !!APP_RELEASE && !demoMode,
    staleTime: CACHE_MS,
    retry: false,
    refetchOnWindowFocus: false
  });
  return useMemo(
    () =>
      (data ?? []).filter((release) =>
        isNewerVersion(release.version, APP_RELEASE)
      ),
    [data]
  );
}
