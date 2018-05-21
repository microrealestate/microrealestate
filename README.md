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

### Clone the GitHub repository
```shell
$ git clone https://github.com/microrealestate/microrealestate.git
```

### Start the application
```shell
$ ./mre start
```
> Startup takes time as a few docker images are built.

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

> `mre` is a bash script. It doesn't work on windows.
