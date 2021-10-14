[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/microrealestate)

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
| [<img src="./picture/rents.png" alt="drawing" width="350"/>](./picture/rents.png) | [<img src="./picture/sendmassemails.png" alt="drawing" width="350"/>](./picture/sendmassemails.png) | [<img src="./picture/payment.png" alt="drawing" width="350"/>](./picture/payment.png) |
| **Tenants page**              | **Tenant details**                 | |
| [<img src="./picture/tenants.png" alt="drawing" width="350"/>](./picture/tenants.png) | [<img src="./picture/tenantcontract.png" alt="drawing" width="350"/>](./picture/tenantcontract.png) | |
| **Properties page**           | **Property details**               | |
| [<img src="./picture/properties.png" alt="drawing" width="350"/>](./picture/properties.png) | [<img src="./picture/property.png" alt="drawing" width="350"/>](./picture/property.png)| |
| **Landlord page**             | **Template leases**                | **Author a contract**          |
| [<img src="./picture/landlord.png" alt="drawing" width="350"/>](./picture/landlord.png) | [<img src="./picture/leases.png" alt="drawing" width="350"/>](./picture/leases.png) | [<img src="./picture/contracttemplate.png" alt="drawing" width="350"/>](./picture/contracttemplate.png) |
| **Members**                        | |
| [<img src="./picture/members.png" alt="drawing" width="350"/>](./picture/members.png) | |

## Getting started

### Prerequisite
- Docker and docker-compose installed

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
* [Run and debug the application](./DEVELOPER.md)

## Contact

* LinkedIn: [www.linkedin.com/in/caissani](https://www.linkedin.com/in/caissani/)
* twitter: [@camelaissani](https://twitter.com/camelaissani)
* website: https://www.nuageprive.fr/

## License

MIT License
