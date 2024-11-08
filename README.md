# MicroRealEstate

[![Continuous Integration](https://github.com/microrealestate/microrealestate/actions/workflows/ci.yml/badge.svg?event=push)](https://github.com/microrealestate/microrealestate/actions/workflows/ci.yml)

MicroRealEstate is an open-source application designed to assist landlords in managing their properties and rentals. MicroRealEstate (MRE) serves as a centralized platform for landlords to streamline their property management tasks.

## Key Features

- Centralized Property and Tenant Information: MRE allows landlords to store all property and tenant details in one convenient location. From property specifications to tenant records and contact information.

- Rent Lease Creation: MRE simplifies the process of creating rent leases. It offers customizable templates that enable landlords to generate lease.

- Rent Payment Tracking: MRE provides a comprehensive system for tracking rent payments, helping landlords stay updated on transactions and promptly address any overdue payments.

- Custom Document Generation: MRE allows landlords to create custom documents for effective communication with tenants. Personalized letters, notices, and announcements can be generated to ensure clear and consistent correspondence.

- Collaboration: Whether you are an independent landlord or manage a real estate business with multiple collaborators, MRE supports collaboration and facilitates task coordination within teams.

## Screenshots

|                                                                                                                           |                                                                                                                                   |                                                                                                                                       |
| :-----------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------: |
|                                                      **Rents page**                                                       |                                                **Send notices, receipt by email**                                                 |                                                            **Pay a rent**                                                             |
|      [<img src="./documentation/pictures/rents.png" alt="drawing" width="200"/>](./documentation/pictures/rents.png)      | [<img src="./documentation/pictures/sendmassemails.png" alt="drawing" width="200"/>](./documentation/pictures/sendmassemails.png) |          [<img src="./documentation/pictures/payment.png" alt="drawing" width="200"/>](./documentation/pictures/payment.png)          |
|                                                     **Tenants page**                                                      |                                                        **Tenant details**                                                         |                                                                                                                                       |
|    [<img src="./documentation/pictures/tenants.png" alt="drawing" width="200"/>](./documentation/pictures/tenants.png)    | [<img src="./documentation/pictures/tenantcontract.png" alt="drawing" width="200"/>](./documentation/pictures/tenantcontract.png) |                                                                                                                                       |
|                                                    **Properties page**                                                    |                                                       **Property details**                                                        |                                                                                                                                       |
| [<img src="./documentation/pictures/properties.png" alt="drawing" width="200"/>](./documentation/pictures/properties.png) |       [<img src="./documentation/pictures/property.png" alt="drawing" width="200"/>](./documentation/pictures/property.png)       |                                                                                                                                       |
|                                                     **Landlord page**                                                     |                                                        **Template leases**                                                        |                                                         **Author a contract**                                                         |
|   [<img src="./documentation/pictures/landlord.png" alt="drawing" width="200"/>](./documentation/pictures/landlord.png)   |         [<img src="./documentation/pictures/leases.png" alt="drawing" width="200"/>](./documentation/pictures/leases.png)         | [<img src="./documentation/pictures/contracttemplate.png" alt="drawing" width="200"/>](./documentation/pictures/contracttemplate.png) |
|                                                        **Members**                                                        |                                                                                                                                   |
|    [<img src="./documentation/pictures/members.png" alt="drawing" width="200"/>](./documentation/pictures/members.png)    |                                                                                                                                   |

## Self-host the application

> **Prerequisite**
>
> - [Install Docker and Compose](https://docs.docker.com/compose/install)

### Download the docker-compose.yml file

``` shell
mkdir mre
cd mre
curl https://raw.githubusercontent.com/microrealestate/microrealestate/master/docker-compose.yml > docker-compose.yml
curl https://raw.githubusercontent.com/microrealestate/microrealestate/master/.env.domain > .env
```

Update the secrets and tokens in the `.env` file (at the end of the file).

**🚨 IMPORTANT**

In case you previously ran the application, the secrets, the tokens and the MONGO_URL must be reported from previous .env file to the new one.
Otherwise, the application will not point to the correct database and will not be able to login with the previous credentials.

### Localhost setup

Start the application under localhost:

``` shell
APP_PORT=8080 docker compose --profile local up
```
The application will be available on http://localhost:8080/landlord and http://localhost:8080/tenant.


### Ip setup

Start the application under a custom ip:

``` shell
sudo APP_DOMAIN=x.x.x.x docker compose up
```
x.x.x.x is the ip address of the server.

The application will be available on http://x.x.x.x/landlord and http://x.x.x.x/tenant.

In case you need to use a port number do not pass it in the APP_DOMAIN. You can use the APP_PORT environment variable.


### Domain with https setup

Start the app under a custom domain over https:

``` shell
sudo APP_DOMAIN=app.example.com APP_PROTOCOL=https docker compose up
```

Make sure your DNS records are pointing to the private server. The application will automatically issue the ssl certificate.

The application will be available on https://app.example.com/landlord and https://app.example.com/tenant.


### Backup and restore the data

The backup and restore commands can be executed when the application is running to allow connecting to MongoDB.

#### Backup

In the mre directory run:

``` shell
docker compose run mongo /usr/bin/mongodump --uri=mongodb://mongo/mredb --gzip --archive=./backup/mredb-$(date +%F_%T).dump
```

Replace "mredb" with the name of your database (see .env file). By default, the database name is "mredb".

The archive file will be placed in the "backup" folder.

#### Restore

In the mre/backup directory, select an archive file you want to restore. 

Then run the restore command:

``` shell
docker compose run mongo /usr/bin/mongorestore --uri=mongodb://mongo/mredb --drop --gzip --archive=./backup/mredb-XXXX.dump 
```

Where mredb-XXXX.dump is the archive file you selected.

Again, replace "mredb" with the name of your database (see .env file). By default, the database name is "mredb".


## Developers

To run the application in development mode, follow the steps outlined in the documentation available [here](./documentation/DEVELOPER.md)

## Donate

Thank you for your interest in supporting MicroRealEstate.
Every contribution will help us pay our ongoing maintenance and development costs 🙏

[![Donate](https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub)](https://github.com/sponsors/camelaissani)

## Contact

LinkedIn: [www.linkedin.com/in/caissani](https://www.linkedin.com/in/caissani/)

X: [@camelaissani](https://x.com/camelaissani)

## License

The project is licensed under the MIT License. To view the license details, please follow the link below:

[MIT License](./LICENSE)

Feel free to review the license terms and conditions to understand the permissions and restrictions associated with the project.
