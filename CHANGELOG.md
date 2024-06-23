# Changelog

All notable changes to this project will be documented here.

## Unreleased

### Added

- Added new environment variable `MRE_VERSION` used by the `mre` command to run a specific version of the application.

- Added the `ci` option to the `mre` command to run it in the github CI workflow.

- Added `applications` in realms to store per-organisation application credentials (for M2M authentication).

- Added `authenticator/landlord/appcredz` API endpoint to generate new application credentials.

- Added application credentials management to landlord frontend (Settings > Members).

- Changed the cli to generate the key to sign application credentials.

- Added responsiveness to the Landlord application

### Changed

- Changed `authenticator/landlord/signin` API endpoint to support both user credentials (email/password) and application credentials (clientId/clientSecret).

- Updated the Docker images to run on Node.js version 20, now as the new minimum requirement for running the application.

### Deprecated

- ...

### Removed

- Omitted `mre`, `mre-macos`, and `mre.exe` from the repository, as they are now available for download in the release.

### Fixed

- Fixed issue #162 - Cannot save Backblaze settings  

### Security

- ...

## Contributors

- [@camelaissani](https://github.com/camelaissani)

- @zeronounours


## 1.0.0-alpha.1

### Added

- Completed implementation of tenant app phase 1 [#118](https://github.com/microrealestate/microrealestate/issues/118). Tenant contact emails set in the landlord app are now used to sign in into the tenant app.

- Added `configure` option to the cli to run prompts to generate the .env file even if it already exists. This will not overwrite the existing tokens and secrets already set in the .env file.

- Allowed the cli to configure a base email delivery service in .env file. Required to send forgot password emails and to sign in with a magic link into the tenant app.

- Added a validator in the cli to check if the .env is valid before starting the app.

- Continued to introduce typescript in the project (see folders: types, webapps/tenant, services/common, services/tenantapi, services/gateway).

### Changed

- Upgrade `redis` and `mongo` containers to newer versions. Old Mongo databases are not compatible with the new version. Before upgrade, do a backup with `mre dumpdb`, remove old database in `data/mongodb`. After upgrade, restore database with `mre restoredb`.

- `GATEWAY_URL` and `DOCKER_GATEWAY_URL` environment variables are not ending with `/api/v2` anymore. The .env file will be updated automatically by the cli when restarting the app.

- Forgot password email is now sent using the email delivery service configured in the .env file and not the one from the landlord app settings.

## Contributors

- [@zeronounours](https://github.com/zeronounours)

- [@camelaissani](https://github.com/camelaissani)
