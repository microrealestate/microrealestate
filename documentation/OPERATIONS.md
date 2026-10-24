# Operations

This guide explains how to administer a self-hosted MicroRealEstate installation: how to run the application, set up HTTPS, update it and back it up.

## Supported systems

We test the application on **Ubuntu** and **Debian**. It is expected to work on **AlmaLinux**, **Rocky Linux** and **Fedora**, but support for these systems is best-effort.

If your system does not have these packages yet, install them:

| Family | Install |
|---|---|
| Debian, Ubuntu | `apt install curl openssl sudo iproute2` |
| AlmaLinux, Rocky, Fedora | `dnf install curl openssl sudo iproute` |

**Container engine.** We test Docker Engine with the Compose v2 plugin. Podman 4.0 or newer also works:

- The installer enables `podman.socket` and drives podman through its Docker-compatible API at `/run/podman/podman.sock`, with the real Compose v2 binary (`dnf install docker-compose`).
- The installer does not use `podman compose`, because that command runs podman-compose, which ignores the healthchecks that the services wait for before they start.
- The installer also enables `podman-restart.service`. Without it, the containers do not come back after a reboot.
- Podman must run as root. Rootless podman is not supported, because it cannot bind ports 80 and 443 unless you lower `net.ipv4.ip_unprivileged_port_start`.

**SELinux.** The installation works with SELinux in enforcing mode on the RHEL family, because each bind mount has the `:z` label option. This relabeling is *recursive*, so each time the stack starts, it relabels every file under `backup/`, including archives that you put there yourself. Only the SELinux label changes, not the content or the owner of the files.

**firewalld.** The published container ports stay reachable when firewalld is active. Their traffic goes through DNAT and FORWARD, where the container engine adds its own rules, while the zone rules of firewalld apply only to INPUT. Before you rely on Let's Encrypt, make sure that ports 80 and 443 are reachable from outside.

## Running the application

Use `install.sh` to install and update, and `mre.sh` for everything else. The installer puts `mre.sh` next to `.env` and replaces it on each `./install.sh update`. If you installed MicroRealEstate before `mre.sh` existed, you do not have this script yet. Run `./install.sh update` once to get it.

Run `mre.sh` **from the install directory**, the one that contains `.env` and `docker/`, or point it there with `--dir /path/to/microrealestate`. To see all commands and options, run `./mre.sh --help`. If `install.sh` ran under `sudo`, run `mre.sh` as the user who started `sudo`, or under `sudo` as well.

```shell
./mre.sh start           # bring the application up
./mre.sh stop            # stop it
./mre.sh restart         # restart the running containers
./mre.sh status          # every container, running or not
./mre.sh logs gateway    # follow one service, or all of them with no argument
```

`stop` does not remove the containers, so `start` brings them back as they were. `status` also lists the stopped containers, which is why `init` shows `Exited (0)` on a healthy installation.

**After you edit `.env`, run `./mre.sh start`, not `restart`.** A container reads `.env` only when it is created. `restart` keeps the existing containers, so they still use the old values. `start` recreates the containers whose settings changed, so they get the new values. `./install.sh update` does the same.

## HTTPS with Let's Encrypt

You set the domain, the HTTPS switch and the ACME email **in the application, not in a file**, because the application stores them on the organization record in the database. So the application must be running and reachable before you can turn on HTTPS.

1. Start the application and open it over plain HTTP, at the address that the installer printed. An IP address is fine.
2. Sign up. The domain step comes right after you create the organization. You can skip it, because an installation can stay on its IP address.
3. Enter the domain, turn on **HTTPS**, and give an email address for Let's Encrypt. To do this later, or to change it, go to *Settings > Web server*.

When you save, the browser goes to the new address, with `https://`. The change in the address bar is expected, not an error.

To issue the certificate, Let's Encrypt must validate the domain, so the DNS must already point to this server and ports 80 and 443 must be reachable from the internet. Caddy then requests the certificate and renews it.

Editing `docker/Caddyfile` does not change any of this. The proxy uses that file only until a domain is configured.

## Using your own reverse proxy

MicroRealEstate comes with its own reverse proxy, Caddy. If your server already runs a reverse proxy for other websites (for example Apache, nginx, Caddy or Traefik), install MicroRealEstate without its own Caddy, and give the public URL that your proxy serves:

```shell
curl -sSL https://raw.githubusercontent.com/microrealestate/microrealestate/main/install.sh | bash -s -- install --reverse-proxy external --url https://mre.example.com
```

In this mode the `reverse-proxy` container does not start and nothing binds ports 80 and 443. Instead, the gateway is published on `127.0.0.1:8080`, and your proxy forwards requests to it. The installer adds `docker/docker-compose.external-proxy.yml` on top of the compose file and saves these settings in `.env`:

| Key | Default | Meaning |
|---|---|---|
| `MRE_REVERSE_PROXY` | `bundled` | `external` leaves Caddy out |
| `MRE_URL` | none, required | public URL your proxy serves, set with `--url`. `https://` turns HTTPS on, `http://` leaves it off |
| `MRE_HTTP_PORT` | `8080` | host port the gateway is published on |
| `MRE_GATEWAY_BIND` | `127.0.0.1` | IPv4 address it binds. If the proxy runs on another machine, set a LAN address |

Your proxy is then responsible for TLS and routing. Configure it as follows:

- Forward the whole site (`/`) to the gateway.
- Keep the original `Host` header.
- Send the `X-Forwarded-Proto` header. Sessions use secure cookies only when the gateway sees that the request came in over HTTPS.

Apache (`a2enmod proxy proxy_http headers ssl`):

```apache
<VirtualHost *:443>
  ServerName mre.example.com
  SSLEngine on
  SSLCertificateFile    /etc/letsencrypt/live/mre.example.com/fullchain.pem
  SSLCertificateKeyFile /etc/letsencrypt/live/mre.example.com/privkey.pem

  ProxyPreserveHost On
  RequestHeader set X-Forwarded-Proto "https"
  ProxyPass        / http://127.0.0.1:8080/
  ProxyPassReverse / http://127.0.0.1:8080/
</VirtualHost>
```

nginx:

```nginx
server {
  listen 443 ssl;
  server_name mre.example.com;
  # ssl_certificate / ssl_certificate_key ...

  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

The application takes its domain from `MRE_URL`, and uses it in the links of emails such as receipts and password resets. In *Settings > Web server* the domain is read-only, and there is no HTTPS, ACME email or IP access setting, because you configure certificates and the addresses that answer in your proxy. To change the URL, edit `MRE_URL` in `.env`, then run `./install.sh update`.

**To change the mode of an existing installation**, in either direction, set `MRE_REVERSE_PROXY` in `.env` (and `MRE_URL`, when you switch to `external`), then run `./install.sh update`. Switching to `external` removes the Caddy container. Check `MRE_HTTP_PORT` too: in `external` mode it is the gateway port, so a value of `80` publishes the gateway on port 80. Switching back to `bundled` starts Caddy on `MRE_HTTP_PORT`/`MRE_HTTPS_PORT` and serves the stored domain over plain HTTP. To turn HTTPS on again, give an ACME email in *Settings > Web server*. `install` never changes the mode of an existing installation.

`./mre.sh` reads `MRE_REVERSE_PROXY` from `.env` and adds the overlay file itself. If you run a compose command directly, add the overlay file yourself:

```shell
docker compose --env-file .env -f docker/docker-compose.yml -f docker/docker-compose.external-proxy.yml ps
```

## Fronting with another reverse proxy or CDN

The gateway and the authenticator limit the request rate per client IP, and `TRUST_PROXY` (default `uniquelocal`) tells them how to find the real client IP. The default trusts any number of proxies on private network addresses, such as:

- the Docker network
- the bundled Caddy `reverse-proxy` container
- a host proxy in [external mode](#using-your-own-reverse-proxy), which reaches the gateway from a Docker bridge address

So the standard installation needs no configuration here.

If you add your own reverse proxy, load balancer or CDN in front of the bundled Caddy (or in front of the gateway, in external mode):

- **Private address** (on the same internal network, for example an internal load balancer): nothing to change, the default already covers it.
- **Public address** (a cloud load balancer, or a CDN edge such as Cloudflare): the default does not trust this address, so the real client IP is lost unless you add it in `.env`:
  ```
  TRUST_PROXY=uniquelocal,<ip-or-cidr>
  ```
  Separate the values with commas. You can give several ranges. Example for Cloudflare (the full, current ranges are at cloudflare.com/ips). Cloudflare changes these ranges from time to time, and an outdated list silently breaks the client IP detection again.
  ```
  TRUST_PROXY=uniquelocal,173.245.48.0/20,103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,141.101.64.0/18,108.162.192.0/18,190.93.240.0/20,188.114.96.0/20,197.234.240.0/22,198.41.128.0/17,162.158.0.0/15,104.16.0.0/13,104.24.0.0/14,172.64.0.0/13,131.0.72.0/22
  ```

Like any change to `.env`, run `./mre.sh start` to apply it, not `restart` (see [Running the application](#running-the-application)).

## Updating

From the install directory, run `./install.sh update`. It makes an automatic backup, downloads the latest stack files, pulls the images named in `docker/docker-compose.yml` and recreates the containers.

**Images.** `update` pulls every image in the compose file: the MicroRealEstate services on the `MRE_VERSION` tag from `.env`, plus `caddy`, `mongo`, `redis` and `alpine`. `MRE_VERSION` is read only from `.env` and defaults to `latest`. If you pinned it to a commit sha, `update` pulls that same sha again and no service moves forward. To change the tag, edit `.env`.

**Stack files.** `update` downloads these files again from `MRE_SRC_URL`:

- `docker/docker-compose.yml`
- `docker/Caddyfile`
- the `.env.domain` template
- `mre.sh`
- `docker/docker-compose.external-proxy.yml`, if the installation uses it or already has it

Without this step, new images would run with the stack files of the release you first installed, and any service, volume or route added since then would never arrive.

`update` replaces a file only when its content changed, and keeps the old copy as `backup/<timestamp>-<filename>`. **Your local changes to these files are overwritten**, so keep them elsewhere, or recover them from `backup/`. In a git checkout, the installer skips this step and leaves the files to `git pull`.

**`update` never rewrites `.env`**, so your secrets and settings stay as they are. If a release adds a new key, the key appears in the refreshed `.env.domain` template. Copy it into `.env` yourself, then run `./mre.sh start` to recreate the containers with it. If a key is missing from `.env`, compose uses an empty value.

## Backing up and restoring

### What a backup set is

All files written by one backup run share the same UTC timestamp and sit directly in `backup/`:

| File | Holds |
|---|---|
| `<timestamp>-mredb.dump.gz` | the database, as a gzip `mongodump` archive |
| `<timestamp>-uploads.tar.gz` | the uploaded documents (`data/uploads`, created for you on the first start) |
| `<timestamp>-env` | a copy of `.env`, mode 600 |

The timestamp is the name of the set, so `./mre.sh restore 20260827T033000Z` restores all three files. Each file is optional. The automatic backups described below have no `<timestamp>-env`, and they restore fine without it.

**Why a set contains the secrets.** The application encrypts some database fields with `CIPHER_KEY` and `CIPHER_IV_KEY` from `.env`, and signs sessions with the token secrets. A database restored with different secrets gives unreadable third-party credentials and no working login. That is why each set keeps its own copy of `.env`, and `restore` compares it with the live `.env` before it changes anything.

> **WARNING:** Each set contains all secrets of the installation. Keep `backup/` as private as `.env`. If you copy the archives off this machine, use `--no-env`.

### Taking a backup

```shell
./mre.sh backup
```

This works whether the application is running or stopped. If the stack is stopped, the command starts the mongo service for the dump and stops it again afterwards.

The command never deletes anything, so sets pile up in `backup/` until you remove them yourself. It leaves archives that you put there yourself alone.

**From cron.** With `--quiet`, the command prints nothing on success and shows the container output only when something fails, so cron mails you only when there is a problem. Run it as the user who owns the installation:

```shell
30 3 * * * cd /path/to/microrealestate && ./mre.sh backup --quiet
```

A set is only as safe as the disk it is on, so also copy `backup/` to another machine.

### Restoring

```shell
./mre.sh restore                          # list the sets and ask which one
./mre.sh restore 20260827T033000Z --yes   # restore that set, no questions asked
```

A restore runs these steps, in this order:

1. It saves the current data as a new set. This is the only way to undo the restore, and the command to reverse it is printed at the end.
2. It stops the application but keeps the database running.
3. It drops and reloads the collections in the archive.
4. It extracts the uploaded documents.
5. It restarts exactly the services that were running before.

Only the collections **in the archive** are dropped and reloaded, so a collection created after the backup is left untouched.

The restore refuses to run in two cases:

- You do not name a set, and there is no terminal to ask you which one.
- The secrets of the set differ from the live `.env`. To go ahead, add `--restore-env`, or add `--yes` to accept the consequences.

`./mre.sh --help` lists the other options: restore only one half of a set, keep the current uploads aside, install the archived `.env`, or name a single archive.

### Automatic backups

Before `./install.sh update` changes anything, it writes a hot backup into `backup/`, but only when it has something to change: a stack file with new content, or an image replaced by the pull. If everything is already current, `update` writes no archive and says so. To skip the backup, set `MRE_SKIP_BACKUP=1`. If the stack is stopped, `update` starts it briefly, so that the dump reads the existing data.

`./install.sh install` never writes a backup, because on an existing installation it changes nothing and only starts it.

Next to the database and the uploads, these sets also keep a copy of each stack file that the run replaced, under the same timestamp: `<timestamp>-docker-compose.yml`, `-Caddyfile`, `-env.domain`, `-mre.sh`.

These sets have no `<timestamp>-env`, because `update` has no reason to copy your secrets. `./mre.sh restore <timestamp>` still restores them, with one warning that it cannot compare their secrets with the live `.env`. They belong to the user who started the installer, even when it ran under `sudo`, and the installer never deletes them.
