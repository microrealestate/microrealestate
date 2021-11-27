# Microrealestate

The application which helps the landlords to manage their property rents.

## Features

The main functionalities are:

- Store information of the properties and the tenants in one place
- Create rent leases from templates
- Follow the rent payments and manage the rent overdues
- Create custom documents to communicate with tenants
- Manage the real estate business with several collaborators and in different organizations

## Screenshots

|                           |                                 |                        |
|:-------------------------:|:-------------------------------:|:----------------------:|
| **Rents page**                | **Send notices, receipt by email**  | **Pay a rent**             |
| [<img src="./documentation/pictures/rents.png" alt="drawing" width="350"/>](./documentation/pictures/rents.png) | [<img src="./documentation/pictures/sendmassemails.png" alt="drawing" width="350"/>](./documentation/pictures/sendmassemails.png) | [<img src="./documentation/pictures/payment.png" alt="drawing" width="350"/>](./documentation/pictures/payment.png) |
| **Tenants page**              | **Tenant details**                 | |
| [<img src="./documentation/pictures/tenants.png" alt="drawing" width="350"/>](./documentation/pictures/tenants.png) | [<img src="./documentation/pictures/tenantcontract.png" alt="drawing" width="350"/>](./documentation/pictures/tenantcontract.png) | |
| **Properties page**           | **Property details**               | |
| [<img src="./documentation/pictures/properties.png" alt="drawing" width="350"/>](./documentation/pictures/properties.png) | [<img src="./documentation/pictures/property.png" alt="drawing" width="350"/>](./documentation/pictures/property.png)| |
| **Landlord page**             | **Template leases**                | **Author a contract**          |
| [<img src="./documentation/pictures/landlord.png" alt="drawing" width="350"/>](./documentation/pictures/landlord.png) | [<img src="./documentation/pictures/leases.png" alt="drawing" width="350"/>](./documentation/pictures/leases.png) | [<img src="./documentation/pictures/contracttemplate.png" alt="drawing" width="350"/>](./documentation/pictures/contracttemplate.png) |
| **Members**                        | |
| [<img src="./documentation/pictures/members.png" alt="drawing" width="350"/>](./documentation/pictures/members.png) | |

## Getting started

### Prerequisite
- [Docker and docker-compose installed](https://docs.docker.com/compose/install/)

> The `mre` bash script is uses for building, running the application. If running on Windows use `mre.exe` on Mac `mre-macos`.

### Clone the GitHub repository
```shell
$ git clone --recursive https://github.com/microrealestate/microrealestate.git
```

### Go to the microrealestate
```shell
$ cd microrealestate
```

### Build the application
```shell
$ ./mre build
```

### Start the application
```shell
$ ./mre start
```

Once the application is ready, the message bellow is displayed:

```shell
Front-end                 http://localhost:8080/app
```

### Run the user interface

Take your favorite internet navigator and go to this link: http://localhost:8080/app

## Community

* Contribute on [Issues](https://github.com/microrealestate/microrealestate/issues)
* [Run and debug the application](./documentation/DEVELOPER.md)

## Donation

Support me to work on this project and to enjoy one coffee or two :raised_hands:

[![Donate](https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub)](https://github.com/sponsors/camelaissani)

## Contact

* LinkedIn: [www.linkedin.com/in/caissani](https://www.linkedin.com/in/caissani/)
* twitter: [@camelaissani](https://twitter.com/camelaissani)
* website: https://www.nuageprive.fr/

## License

MIT License
