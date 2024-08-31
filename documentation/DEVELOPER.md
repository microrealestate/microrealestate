# Microrealestate

Here is a diagram showcasing the microservices on the backend and the two frontend applications:

[<img src="./pictures/overview.png" alt="drawing" width="770"/>](./pictures/overview.png)

| Applications and Services                  | Description                                                                    | Development Status |
| :----------------------------------------- | :----------------------------------------------------------------------------- | :----------------: |
| [Landlord UI](../webapps/landlord)         | Landlord web application                                                       |     Available      |
| [Tenant UI](../webapps/tenant)             | Tenant web application                                                         |     Available      |
| [Gateway](../services/gateway)             | Exposes UI and services, handles CORS and reverse proxies                      |     Available      |
| [Authenticator](../services/authenticator) | Handles login/logout and tokens management                                     |     Available      |
| [API](../services/api)                     | Landlord REST API                                                              |     Available      |
| [tenantApi](../services/tenantapi)         | Tenant REST API                                                                |     Available      |
| [EMailer](../services/emailer)             | Generates and sends emails with [Gmail] or [mailgun](https://www.mailgun.com/) |     Available      |
| [PDFGenerator](../services/pdfgenerator)   | Generates PDF documents (letters, contracts, invoices...)                      |     Available      |
| [ResetService](../services/resetservice)   | Uses to erase all data, only active in DEV and CI environments                 |     Available      |

## Run the application from source code

### Prerequisite

- [Docker and Compose installed](https://docs.docker.com/compose/install/)
- [Run the Docker daemon as a non-root user](https://docs.docker.com/engine/security/rootless)
- [Node.js version 20.x installed](https://nodejs.org/en/download/package-manager)
- [VS Code installed](https://code.visualstudio.com/)
- [git installed](https://git-scm.com/downloads)

#### Clone the GitHub repository

```shell
git clone https://github.com/microrealestate/microrealestate.git
cd microrealestate
```

#### Install de application dependencies

```shell
yarn
```

<details>
<summary>Run the application in DEV mode and debug</summary>

**Start in DEV mode**

```shell
yarn dev
```

The logs of the different services will be visible in the console during the exection of the application.

Also, end to end tests (Cypress tests) can be executed while the application runs in DEV mode. See the next section to knwow how to run the e2e command.

**Debug**
To access the debug functionality in VS Code, navigate to the debug bar located within the IDE.

![Activity Bar](./pictures/vscode-debugbar.png)

Next, attach the debugger to the service you wish to debug. This will enable you to step through the code and inspect variables, making it easier to identify and resolve any issues.

- Docker: Attach to Gateway
- Docker: Attach to Authenticator
- Docker: Attach to API
- Docker: Attach to Emailer
- Docker: Attach to PdfGenerator
- Docker: Attach to ResetService

[For more information about VS Code debugging](https://code.visualstudio.com/Docs/editor/debugging#_debug-actions)
</details>

<details>
<summary>Run the application in CI mode and run the end to end tests</summary>

**Build**

```shell
yarn build
```

**Start in CI mode**

```shell
yarn ci
```

No logs will be shown in the terminal during the execution. You can use the [docker logs](https://docs.docker.com/reference/cli/docker/container/logs) command to get the container logs.
Any changes in the source code requires to rebuild the application.

**Execute the end to end tests (Cypress tests)**

- Like in the CI/CD workflow

```shell
yarn e2e:ci
```

- With the browser visible during the tests

```shell
yarn e2e:run
```

- With the Cypress UI

```shell
yarn e2e:open
```

**Stop the application**

```shell
yarn stop
```
</details>

<details>
<summary>Run the application in PROD mode</summary>

**Build**

```shell
yarn build
```

**Start in PROD mode**

```shell
yarn start
```

You can use the [docker logs](https://docs.docker.com/reference/cli/docker/container/logs) command to get the container logs.
Any changes in the source code requires to rebuild the application.

**Stop the application**

```shell
yarn stop
```
</details>