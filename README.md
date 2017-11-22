# Microrealestate

Microrealestate is a set of microservices which work together to offer an open source application for property management.

This application draws its fundamentals from a monolithic application: [Loca](https://github.com/camelaissani/loca)

The first objective is to combine the monolith application and the microservices to provide new functionalities.

![overview](./picture/overview.png)

| Service       | Description                                                                                                      | Status          |
| :------------ | :--------------------------------------------------------------------------------------------------------------- | :-------------: |
| Alert         | Sends alert messages based on business rules (contract deadlines, unpaid rents...)                               | Not available   |
| cAdvisor      | [Container Advisor](https://github.com/google/cadvisor)                                                          | Available       |
| Elastic Stack | [Elasticsearch Logstash Kibana](https://www.elastic.co//products) handles logs and monitors containers and hosts | Available       |
| API Gateway   | To define                                                                                                        | Dev in progress |
| Loca          | The monolith application [Loca](https://github.com/camelaissani/loca)                                            | Dev in progress |
| Mail          | Generates and sends email                                                                                        | Not available   |
| Messages      | [Kafka](https://kafka.apache.org/) message brokers                                                               | Available       |
| PDF           | Generates PDF documents (letters, contracts, invoices...)                                                        | Not available   |
| Text          | Generates and texts (cash balance, alerts...)                                                                    | Not available   |


In a second stage, the monolith application will be broken in microservices.

## Getting started

### Prerequisite
- Docker and docker-compose installed

### Start the application
```shell
$ ./mre start
```
> `mre` is a bash script. It doesn't work on windows.

