# Microrealestate

Microrealestate is a set of microservices which work together to offer an open source application for property management.

This application draws its fundamentals from the monolithic application: [Loca](https://github.com/camelaissani/loca)

[<img src="./pictures/overview.png" alt="drawing" width="770"/>](./pictures/overview.png)

| µService                                   | Description                                                                        |     Status      |
| :----------------------------------------- | :--------------------------------------------------------------------------------- | :-------------: |
| [Landlord UI](../webapps/landlord)         | Landlord web application                                                           |    Available    |
| [Tenant UI](../webapps/tenant)             | Tenant web application                                                             | Dev in progress |
| [Gateway](../services/gateway)             | Exposes UI API, handles CORS and reverse proxies                                   |    Available    |
| [Authenticator](../services/authenticator) | Handles login/logout and tokens management                                         |    Available    |
| [EMailer](../services/emailer)             | Generates and sends emails with [Gmail] or [mailgun](https://www.mailgun.com/)     |    Available    |
| [API](../services/api)                     | Core engine                                                                        |    Available    |
| [PDFGenerator](../services/pdfgenerator)   | Generates PDF documents (letters, contracts, invoices...)                          |    Available    |
| Messages                                   | message broker                                                                     |  Not available  |
| Alert                                      | Sends alert messages based on business rules (contract deadlines, unpaid rents...) |  Not available  |
| Text                                       | Generates and texts (cash balance, alerts...)                                      |  Not available  |

## Debugging the application

### Prerequisite

- Docker and docker-compose installed
  > The `mre` bash script is uses for building, running the application. If running on Windows use `mre.ps1`.

You would need to have the latest version of [VS Code](https://code.visualstudio.com/) installed.

Then bring up the Debug view, click on the Debug icon in the **Activity Bar** on the side of VS Code. You can also use the keyboard shortcut `Ctrl+Shift+D`.

![Activity Bar](https://code.visualstudio.com/assets/docs/editor/debugging/debugicon.png)

### Clone the GitHub repository

```shell
$ git clone --recursive https://github.com/microrealestate/microrealestate.git
```

### Go to the microrealestate

```shell
$ cd microrealestate
```

### Launch the application in development mode:

```shell
$ ./mre dev
```

Next, go to the debug bar:

![Activity Bar](https://code.visualstudio.com/assets/docs/editor/debugging/launch-configuration.png)

Then select one of these values to attach the VS Code debugger to the application:

- `Docker: Attach to API` (Exposes the UI API and core engine)
- `Docker: Attach to Authenticator` (Handles the authentication)
- `Docker: Attach to Emailer` (Sends emails)
- `Docker: Attach to PdfGenerator` (Generates PDF documents)

For more information about VS Code debugging go [here](https://code.visualstudio.com/Docs/editor/debugging#_debug-actions)
