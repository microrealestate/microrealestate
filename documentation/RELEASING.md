# Releasing

How a release is cut. The model is **build once, promote later**: CI builds and publishes images tagged with the commit sha on every merge to `main`, and a release simply *promotes* an already-published set of images to a version tag. Nothing is rebuilt at release time, so the shipped images are byte-for-byte the artifacts CI produced.

There are no end-to-end (Cypress) tests in either workflow — releases go straight from a green `main` to published images.

## Prerequisites

The following repository secrets must be configured (*Settings* → *Secrets and variables* → *Actions*):

| Secret | Description |
|---|---|
| `GHCR_USERNAME` | GitHub username with write access to the `microrealestate` org packages |
| `GHCR_TOKEN` | Classic PAT with the `write:packages` scope for that account |

Both workflows push to `ghcr.io/microrealestate/microrealestate/*`. A PAT is used so publishing keeps working regardless of how the existing packages are linked to the repository; the built-in `GITHUB_TOKEN` with `packages: write` may be enough once every package is repo-linked.

## What happens on every merge to `main`

The [CI workflow](../.github/workflows/ci.yml) runs:

1. `lint` (Biome, generated Dockerfiles, compose files) → `tsc` gates
2. `build-images`: builds all 8 service/webapp Dockerfiles and pushes them as
   `ghcr.io/microrealestate/microrealestate/<svc>:sha-<short-sha>` (immutable build identifiers)

Images: gateway, authenticator, api, tenantapi, pdfgenerator, emailer, landlord-frontend, tenant-frontend.

The `latest` tag **only** moves when you cut a release — installs pinned to `latest` never see untested code.

## What happens on a pull request

The same three jobs run: `lint`, `tsc`, `build-images`.

The difference is that `build-images` builds every image but publishes none — it skips the registry login, and the push is turned off. Only a merge to `main` produces `sha-*` tags, so a pull request can never add an image to the registry.

The point of building anyway is that a Dockerfile which no longer builds fails the pull request, instead of failing `main` after the merge.

## Cutting a release

### 1. Prepare

Write entries in [`changelog/unreleased.md`](../changelog/unreleased.md) as you go — that file *is* the release notes, published verbatim as the GitHub Release body. Each released version keeps its own `changelog/<version>.md`; there is no aggregated changelog file, the [releases page](https://github.com/microrealestate/microrealestate/releases) is the history.

Actions → **Prepare release** → *Run workflow*, with the version (e.g. `1.4.0` or `v1.4.0`).

It renames `changelog/unreleased.md` to `changelog/<version>.md`, opens a fresh empty one, and raises a pull request. Review and merge it.

It refuses to run when there is nothing to release (`changelog/unreleased.md` is empty), when that version is already prepared (`changelog/<version>.md` exists), or when another release pull request is still open.

### 2. Wait for CI

The merge commit is the one you will promote. Wait for its CI run to publish all 8 `sha-*` images.

### 3. Dry run (recommended)

Actions → **Release** → *Run workflow*, fill in:

| Input | Value |
|---|---|
| `version` | the version you prepared |
| `sha` | sha of the **merge commit** from step 1 — short or full, both work |
| `dry_run` | ✅ |

A dry run validates the inputs, checks that the commit carries the changelog section, checks that all 8 source images exist in GHCR, prints the exact `crane tag` commands it would run, **and prints the release body it would publish** — while pushing nothing.

### 4. Promote

Re-run the workflow with `dry_run` unchecked. It will:

1. Re-tag every image: `<svc>:sha-<sha>` → `<svc>:<version>` **and** `<svc>:latest` (registry-side re-tag via [crane](https://github.com/google/go-containerregistry/tree/main/cmd/crane) — no layers are uploaded)
2. Create git tag `v<version>` **at the promoted commit**
3. Publish the GitHub Release, its body being `changelog/<version>.md` as of that commit, with the auto-generated commit list appended

### Prereleases

A version containing a hyphen (`1.4.0-rc.1`) is treated as a prerelease: the images get the
`1.4.0-rc.1` tag only, `latest` keeps pointing at the last stable release, and the GitHub
Release is flagged as a prerelease. Testers opt in with `MRE_VERSION=1.4.0-rc.1` in `.env`.

**A release candidate is promoted to its stable version on the very same commit.** Release
`1.4.0` against the commit you already released as `1.4.0-rc.1` — no second preparation, no
rebuild. The images tagged `1.4.0` are byte-for-byte the ones tested as the candidate, and the
release notes come from that commit's `## 1.4.0-rc.1` section.

One candidate can never reuse another's section: promoting `1.4.0-rc.2` against a commit prepared
as `1.4.0-rc.1` is refused. Reaching `-rc.2` means preparing again, which requires entries under
*Work in progress* — so it lands as its own section, on its own commit.

**A stable release is final for a commit.** Once the stable tag exists the workflow refuses to
promote that commit again. Cut the next release from a new commit. To correct a release that has
already gone out, delete the git tag and the published image tags first (see
[Troubleshooting](#troubleshooting)).

CLI equivalent:

```shell
gh workflow run prepare-release.yml -f version=v1.4.0
# merge the pull request, wait for CI, then:
gh workflow run release.yml -f version=v1.4.0 -f sha=abc1234 -f dry_run=true   # dry run first
gh workflow run release.yml -f version=v1.4.0 -f sha=abc1234
gh run watch   # follow progress
```

### 5. Verify

- Run summary lists the promoted image tags
- The [releases page](https://github.com/microrealestate/microrealestate/releases) shows the new release at the right commit, with the changelog section as its body
- Spot-check one package under the org's *Packages*: the new tags are listed

## Version shown in the app

The landlord app knows one version: `release` in `version.json`, the newest `changelog/<version>.md` at the commit being built (`scripts/generate-version.mjs`). It is set in official images too, although CI builds a commit *before* the release tags it: the release workflow promotes only the commit whose newest changelog entry is the version being released. The About dialog (user menu → About) shows it, else the git sha (`NEXT_PUBLIC_GIT_SHA`); the update button compares it with the published releases.

`MRE_VERSION` plays no part in the app: it only selects the image tag that `install.sh` and compose pull.

A commit after a release and before the next one carries the last release's `release`, so a dev build shows it too. A commit prepared as `1.4.0-rc.1` and promoted as `1.4.0` carries `release: "1.4.0-rc.1"`, so that install reads as the rc and offers `1.4.0` as an update: give the stable version its own changelog entry before promoting.

The sha is pinned to 7 characters, the same length CI uses for the `sha-<short-sha>` image tags — the shown value can be pasted straight into the release workflow's `sha` input.

`version.json` is gitignored and regenerated automatically by `yarn dev`, `yarn build`, `yarn start` and `yarn ci`. The About row also shows the commit date, `date` in `version.json`. It disappears only when neither `release` nor the sha is set. Regenerate manually anytime with:

```shell
yarn generate:version     # -> { "release": "<newest changelog entry>", "sha": "<HEAD>", "date": "<commit date>" }
```

`MRE_VERSION` has no effect on `version.json`.

## Upgrading an installed instance

```shell
# from the install directory; pulls :latest of everything and restarts
curl -sSL https://raw.githubusercontent.com/microrealestate/microrealestate/main/install.sh | bash -s -- update
```

To stay on a specific version, set it in `.env` before updating:

```env
MRE_VERSION=1.4.0
```

The pin only selects the image tag: the About dialog shows the version the image was built as, whatever `.env` says. Update the pin to move to another version, or set it back to `latest`.

## Troubleshooting

- **"Source image not found"** — CI hasn't finished (or failed) on that commit. Check the CI run for the sha; fix and re-merge if needed.
- **Login/push denied (403)** — `GHCR_TOKEN` lacks `write:packages`, expired, or the account isn't allowed on the org packages.
- **Tag/version already exists** — delete the stale git tag (`git push origin :refs/tags/v1.4.0`) and/or the package tags from the GHCR UI first; image tags cannot be safely re-pointed once published externally.
- **Do not re-run CI on a released commit** — the builds are not byte-reproducible, so a rebuild republishes `:sha-<sha>` at a new digest. The promoted `:1.4.0` and `:latest` tags keep serving the old digest, so nothing running is affected — but `:sha-<sha>` is no longer the artifact you shipped, and promoting that sha again would deliver different bytes.
- **"No changelog entry for &lt;version&gt;"** — the commit you are promoting predates the *Prepare release* pull request, or that pull request was never merged. Promote the merge commit instead.
- **"… is not the newest entry at this commit"** — you named a sha from after a later release was prepared. Entry files accumulate, so the workflow requires the version being released to be the newest one present; promote the commit that prepared it.
- **Partial release after a failed job** — re-run the failed job; `crane tag` operations are idempotent (same digest re-tagged).
