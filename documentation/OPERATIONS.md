# Operations

Day-to-day administration of a self-hosted MicroRealEstate instance: running the stack, HTTPS, updates and backups.

## Supported systems

Tested on **Ubuntu** and **Debian**. Expected to work on **AlmaLinux**, **Rocky Linux** and **Fedora**; those are best-effort.

Prerequisites, if your image does not already have them:

| Family | Install |
|---|---|
| Debian, Ubuntu | `apt install curl openssl sudo iproute2` |
| AlmaLinux, Rocky, Fedora | `dnf install curl openssl sudo iproute` |

**Container engine.** Docker Engine with the Compose v2 plugin is the tested path. Podman 4.0 or newer also works: the installer enables `podman.socket` and drives it through podman's Docker-compatible API at `/run/podman/podman.sock`, using the real Compose v2 binary (`dnf install docker-compose`). `podman compose` is deliberately not used — it delegates to podman-compose, which does not honour the healthcheck-gated service dependencies this stack relies on. The installer also enables `podman-restart.service`, without which containers do not come back after a reboot. The podman path is **rootful**: rootless podman is not supported, and cannot bind ports 80/443 without lowering `net.ipv4.ip_unprivileged_port_start`.

**SELinux.** Enforcing mode on the RHEL family is handled: every bind mount is labelled `:z`. That relabelling is *recursive*, so starting the stack re-labels everything under `backup/`, including archives you put there yourself — contents and ownership untouched, only the label.

**firewalld.** Published container ports stay reachable with firewalld active: they traverse DNAT and FORWARD, where the container engine installs its own rules, while firewalld's zone rules apply to INPUT. Still confirm 80 and 443 are reachable from outside before relying on Let's Encrypt.

## Running the application

`install.sh` installs and updates. Everything after that belongs to `mre.sh`, which it drops next to `.env` and refreshes on every `./install.sh update`. An installation older than `mre.sh` has no copy yet; the next `update` fetches one.

Run it **from the install directory** — the one holding `.env` and `docker/` — or point it there with `--dir /path/to/microrealestate`. `./mre.sh --help` lists every command and option. If `install.sh` ran under `sudo`, run `mre.sh` as the account that invoked it, or under `sudo` as well.

```shell
./mre.sh start           # bring the application up
./mre.sh stop            # stop it
./mre.sh restart         # restart the running containers
./mre.sh status          # every container, running or not
./mre.sh logs gateway    # follow one service, or all of them with no argument
```

`stop` does not remove the containers, so `start` brings them straight back. `status` lists the stopped ones too, which is why `init` shows as `Exited (0)` on a healthy stack.

**A container's environment is fixed when it is created.** `restart` restarts the containers as they are, so an edited `.env` does not reach them. `start` does: it reconciles the stack against the compose file and recreates whatever changed. So does `./install.sh update`.

## HTTPS with Let's Encrypt

The domain, the HTTPS switch and the ACME email are **set in the application, not in a file**: they are stored on the organization record in the database. So the application has to be running and reachable before HTTPS can be turned on.

1. Start the application and open it over plain HTTP, at the address the installer printed — an IP address is fine.
2. Sign up. The domain step comes right after you create the organization, and can be skipped: an installation is allowed to stay on its IP address.
3. Fill in the domain, turn **HTTPS** on, and give an email address for Let's Encrypt. To do it later, or to change it, go to *Settings > Web server*.

On save the browser is sent to the new address, `https://` included — the address bar changing is the point, not a glitch.

For the certificate to be issued, DNS must already point at this server and ports 80 and 443 must be reachable from the internet; that is how Let's Encrypt validates the domain. Caddy then requests and renews it.

Editing `docker/Caddyfile` changes none of this. It is only the bootstrap the proxy serves before a domain has been configured.

## Fronting with another reverse proxy or CDN

`TRUST_PROXY` (default `uniquelocal`) controls how the gateway and authenticator derive the real client IP for rate limiting. The default trusts any number of private-network hops automatically — the Docker network, the bundled Caddy `reverse-proxy` container — so the stock deployment needs no configuration here.

Adding your own reverse proxy, load balancer, or CDN in front of the bundled Caddy:

- **Private address** (same internal network, e.g. an internal load balancer) — nothing to change, it's covered by the default.
- **Public address** (a cloud load balancer, or a CDN edge like Cloudflare) — real client IP resolution breaks unless that address is trusted too, since it's outside the private-network default. Add it in `.env`:
  ```
  TRUST_PROXY=uniquelocal,<ip-or-cidr>
  ```
  Comma-separated, multiple ranges allowed. Example for Cloudflare (full/current ranges at cloudflare.com/ips — they rotate occasionally, so a stale list can quietly break resolution again):
  ```
  TRUST_PROXY=uniquelocal,173.245.48.0/20,103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,141.101.64.0/18,108.162.192.0/18,190.93.240.0/20,188.114.96.0/20,197.234.240.0/22,198.41.128.0/17,162.158.0.0/15,104.16.0.0/13,104.24.0.0/14,172.64.0.0/13,131.0.72.0/22
  ```

Like any other `.env` change, this only reaches running containers via `./mre.sh start` (see "A container's environment is fixed when it is created" above), not `restart`.

## Updating

Run `./install.sh update` from the install directory. It takes an automatic backup, refreshes the stack files, pulls the images named in `docker/docker-compose.yml` and recreates the containers.

**Images.** Every image in the compose file is pulled — the MicroRealEstate services on the `MRE_VERSION` tag from `.env`, plus `caddy`, `mongo`, `redis` and `alpine`. `MRE_VERSION` is read from `.env` only. It is `latest` by default; if you pinned it to a commit sha, `update` re-pulls that same sha and no service moves forward. Edit `.env` to change the tag.

**Stack files.** `update` re-downloads `docker/docker-compose.yml`, `docker/Caddyfile`, the `.env.domain` template and `mre.sh` from `MRE_SRC_URL`, because new images otherwise run under the topology of the release you installed — a service, volume or route added since then would never arrive. A file is replaced only when its content changed, and the replaced copy is kept as `backup/<timestamp>-<filename>`. **Local edits to those four files are overwritten**; keep your own changes elsewhere, or recover them from `backup/`. In a git checkout the installer skips this and leaves the files to `git pull`.

**`.env` is never rewritten by `update`.** Secrets and settings stay as they are. If a release introduces a new key, it appears in the refreshed `.env.domain` template and you must copy it into `.env` yourself, then run `./mre.sh start` to recreate the containers with it. Compose substitutes an empty value for a key that `.env` lacks.

## Backing up and restoring

### What a backup set is

Everything one run writes shares a single UTC timestamp and lands flat in `backup/`:

| File | Holds |
|---|---|
| `<timestamp>-mredb.dump.gz` | the database, as a gzip `mongodump` archive |
| `<timestamp>-uploads.tar.gz` | the uploaded documents (`data/uploads`, created for you on the first start) |
| `<timestamp>-env` | a copy of `.env`, mode 600 |

The timestamp is the name of the set: `./mre.sh restore 20260827T033000Z` puts all three back. Every member is optional — the automatic backups described below carry no `<timestamp>-env`, and restore fine without one.

**Why the secrets travel with the data.** Some database fields are encrypted with `CIPHER_KEY` and `CIPHER_IV_KEY` from `.env`, and sessions are signed with the token secrets. A database restored next to different secrets gives unreadable third-party credentials and no working login, so each set carries its own copy and `restore` compares it with the live `.env` before it touches anything. The flip side: **every set holds every secret of the installation**. Keep `backup/` as private as `.env` itself, and pass `--no-env` when the archives leave this machine.

### Taking a backup

```shell
./mre.sh backup
```

It works whether the application is running or stopped: a stopped stack has its mongo service started for the dump and stopped again afterwards.

Nothing is ever deleted: sets accumulate in `backup/` and pruning them is yours to do. Archives you put there yourself are left alone.

**From cron.** `--quiet` prints nothing on success and holds the container output back until something fails, which is what makes the mail worth reading. Run it as the account that owns the installation:

```shell
30 3 * * * cd /path/to/microrealestate && ./mre.sh backup --quiet
```

A set is only as safe as the disk under it — copy `backup/` off the machine as well.

### Restoring

```shell
./mre.sh restore                          # list the sets and ask which one
./mre.sh restore 20260827T033000Z --yes   # restore that set, no questions asked
```

In order, a restore: saves the current data as a new set — that is the only undo, and the command to reverse the restore is printed at the end; stops the application while keeping the database up; drops and reloads the collections held in the archive; unpacks the uploaded documents; then starts again exactly the services that were running.

Only the collections **present in the archive** are dropped and reloaded. A collection created after the backup was taken survives the restore untouched.

Two things it refuses to do: guess which backup you meant when none is named and there is no terminal to ask on, and restore a set whose secrets differ from the live `.env` — that one needs `--restore-env`, or `--yes` to accept the consequences.

`./mre.sh --help` lists the rest: restoring one half of a set, keeping the current uploads aside, installing the archived `.env`, or naming a single archive.

### Automatic backups

`./install.sh update` writes a hot backup into `backup/` before it changes anything, and only when it has something to change: a stack file whose content moved, or an image the pull replaced. An `update` that finds everything already current writes no archive and says so; `MRE_SKIP_BACKUP=1` skips it. `./install.sh install` never writes one — it changes nothing on an installation that is already there, it only starts it. A stopped stack is briefly started first, so the dump runs against the existing data.

Beside the database and the uploads, such a run also keeps a copy of every stack file it replaced — `<timestamp>-docker-compose.yml`, `-Caddyfile`, `-env.domain`, `-mre.sh` — under that same timestamp.

These sets hold no `<timestamp>-env`, because `update` has no reason to copy your secrets; `./mre.sh restore <timestamp>` restores them all the same, warning once that it cannot check them against the live `.env`. They belong to the account that invoked the installer, even when it ran under `sudo`, and the installer never deletes them.
