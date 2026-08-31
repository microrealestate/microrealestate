# MicroRealEstate

| Applications and Services                  | Description                                                                    | Development Status |
| :----------------------------------------- | :----------------------------------------------------------------------------- | :----------------: |
| [Landlord UI](../webapps/landlord)         | Landlord web application                                                       |     Available      |
| [Tenant UI](../webapps/tenant)             | Tenant web application                                                         |     Available      |
| [Gateway](../services/gateway)             | Exposes UI and services, handles CORS and reverse proxies                      |     Available      |
| [Authenticator](../services/authenticator) | Handles login/logout and tokens management                                     |     Available      |
| [API](../services/api)                     | Landlord REST API                                                              |     Available      |
| [tenantApi](../services/tenantapi)         | Tenant REST API                                                                |     Available      |
| [EMailer](../services/emailer)             | Generates and sends emails over SMTP           |     Available      |
| [PDFGenerator](../services/pdfgenerator)   | Generates PDF documents (letters, contracts, invoices...)                      |     Available      |
| [ResetService](../services/resetservice)   | Used to erase all data, only active in DEV and CI environments                 |     Available      |
| [smtp4dev](https://github.com/rnwood/smtp4dev) | Local SMTP server which catches all emails, only active in DEV environment |     Available      |

## Run the application from source code

### Prerequisite

- [Docker and Compose installed](https://docs.docker.com/compose/install/)
- [Run the Docker daemon as a non-root user](https://docs.docker.com/engine/security/rootless)
- [Node.js version 25.x installed](https://nodejs.org/en/download/package-manager)
- [git installed](https://git-scm.com/downloads)

### Clone the GitHub repository

```shell
git clone https://github.com/microrealestate/microrealestate.git
cd microrealestate
```

### Install the application dependencies

```shell
yarn
```

### Start in DEV mode

```shell
yarn dev
```

It runs in the foreground and every service logs to the console, so `Ctrl-C`
stops the application. `yarn stop` clears anything left running.

### Seed the data

With the application running, in another terminal:

```shell
yarn seeddev
```

This creates the demo data — organization, contract, document templates,
properties, tenants, lease documents, rent payments — and points the
organization at smtp4dev, so emails work straight away. It empties the database
first, unless `--keep` is passed.

### Emails

Every email, including the landlord password reset and the tenant sign in code,
is sent through the organization email service. In DEV mode that service is a
local [smtp4dev](https://github.com/rnwood/smtp4dev) server: no message leaves
your machine and no SMTP credentials are needed in the `.env` file.

Read the emails at [http://localhost:5080](http://localhost:5080).

`yarn seeddev` configures this for you. To do it by hand instead, go to
`Settings` > `Email service` and set:

| Field          | Value           |
| :------------- | :-------------- |
| Server         | `smtp4dev`      |
| Port           | `25`            |
| Encryption     | `No encryption` |
| Authentication | off             |

Then click `Test connection` to check the configuration.
