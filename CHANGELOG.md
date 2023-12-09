# Changelog

All notable changes to this project will be documented here.

## 2023-12-09

### Changed

- Upgrade `redis` and `mongo` containers to newer versions. Old Mongo databases are not compatible with the new version. Before upgrade, do a backup with `mre dumpdb`, remove old database in `data/mongodb`. After upgrade, restore database with `mre restoredb`.

### Contributors

- @zeronounours

## 2023-12-07

### Added

- Completed implementation of tenant app phase 1 [#118](https://github.com/microrealestate/microrealestate/issues/118). Tenant contact emails set in the landlord app are now used to sign in into the tenant app.

- Added `configure` option to the cli to run prompts to generate the .env file even if it already exists. This will not overwrite the existing tokens and secrets already set in the .env file.

- Allowed the cli to configure a base email delivery service in .env file. Required to send forgot password emails and to sign in with a magic link into the tenant app.

- Added a validator in the cli to check if the .env is valid before starting the app.

- Continued to introduce typescript in the project (see folders: types, webapps/tenant, services/typed-common, services/tenantapi, services/gateway).

### Changed

- `GATEWAY_URL` and `DOCKER_GATEWAY_URL` environment variables are not ending with `/api/v2` anymore. The .env file will be updated automatically by the cli when restarting the app.

- Forgot password email is now sent using the email delivery service configured in the .env file and not the one from the landlord app settings.

### Contributors

- @camelaissani
