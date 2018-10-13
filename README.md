[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/microrealestate)

# Microrealestate

Microrealestate is a set of microservices which work together to offer an open source application for property management.

This application draws its fundamentals from a monolithic application: [Loca](https://github.com/camelaissani/loca)

The first objective is to combine the monolith application and the microservices to provide new functionalities.

![overview](./picture/overview.png)

| µService                                                        | Description                                                                                                      | Status          |
| :-------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- | :-------------: |
| Alert                                                           | Sends alert messages based on business rules (contract deadlines, unpaid rents...)                               | Not available   |
| API Gateway                                                     | To define                                                                                                        | Dev in progress |
| cAdvisor                                                        | [Container Advisor](https://github.com/google/cadvisor)                                                          | Available       |
| Elastic Stack                                                   | [Elasticsearch Logstash Kibana](https://www.elastic.co//products) handles logs and monitors containers and hosts | Available       |
| [EMailer](https://github.com/microrealestate/emailer)           | Generates and sends emails                                                                                       | Available       |
| [Loca](https://github.com/camelaissani/loca)                    | The web application                                                                                              | Available       |
| Messages                                                        | message broker                                                                                                   | Dev in progress |
| [PDFGenerator](https://github.com/microrealestate/pdfgenerator) | Generates PDF documents (letters, contracts, invoices...)                                                        | Available       |
| Text                                                            | Generates and texts (cash balance, alerts...)                                                                    | Not available   |


In a second stage, the monolith application will be broken in microservices.

## Getting started

### Prerequisite
- Docker and docker-compose installed

> The `mre` bash script is uses for building, running the application.
> It doesn't work on windows.

### Clone the GitHub repository
```shell
$ git clone --recursive https://github.com/microrealestate/microrealestate.git
```

### Build the application
```shell
$ ./mre build
```

### Start the application
```shell
$ ./mre start
```

At the end, it displays the application links:

```shell
Front-end             http://localhost:8080
kibana                http://localhost:9000
cadvisor              http://localhost:9100
rabbitmq Management   http://localhost:8100
```

### Start the application in development mode

```shell
$ ./mre dev
```

### Debugging the application

You would need to have the latest version of [VS Code](https://code.visualstudio.com/) installed.

Then bring up the Debug view, click on the Debug icon in the **Activity Bar** on the side of VS Code. You can also use the keyboard shortcut `Ctrl+Shift+D`.

![Activity Bar](https://code.visualstudio.com/assets/docs/editor/debugging/debugicon.png)

In a terminal launch the application in development mode:

```shell
$ ./mre dev
```

Next, go to the debug bar:

![Activity Bar](https://code.visualstudio.com/assets/docs/editor/debugging/launch-configuration.png)

Then select one of these values to attach the VS Code debugger to the application:

- `Docker: Attach to Loca` (The web application)
- `Docker: Attach to Emailer` (Generates and sends emails)
- `Docker: Attach to PdfGenerator` (Generates PDF documents)

For more information about VS Code debugging go [here](https://code.visualstudio.com/Docs/editor/debugging#_debug-actions)