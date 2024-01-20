# MicroRealEstate

[![Continuous Integration](https://github.com/microrealestate/microrealestate/actions/workflows/ci.yml/badge.svg?event=push)](https://github.com/microrealestate/microrealestate/actions/workflows/ci.yml)

MicroRealEstate is an open-source application designed to assist landlords in managing their properties and rentals. With a user-friendly interface and a range of helpful features, MicroRealEstate (MRE) serves as a centralized platform for landlords to streamline their property management tasks.

MRE is designed to be customizable, allowing landlords to adapt the application to their unique property management needs. As an open-source project, MRE benefits from continuous improvement and community-driven enhancements.

## Key Features

- Centralized Property and Tenant Information: MRE allows landlords to store all property and tenant details in one convenient location. From property specifications to tenant records and contact information, everything is easily accessible whenever you need it.

- Rent Lease Creation: MRE simplifies the process of creating rent leases. It offers customizable templates that enable landlords to generate lease tailored to their specific requirements.

- Rent Payment Tracking: MRE provides a comprehensive system for tracking rent payments, helping landlords stay updated on transactions and promptly address any overdue payments.

- Custom Document Generation: MRE allows landlords to create custom documents for effective communication with tenants. Personalized letters, notices, and announcements can be generated to ensure clear and consistent correspondence.

- Collaboration: Whether you are an independent landlord or manage a real estate business with multiple collaborators, MRE supports collaboration and facilitates task coordination within teams.

## Screenshots

Explore the application through these screenshots:

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

## Getting started

Get started with the application by following these installation steps.

> Prerequisite
>
> - [Docker and docker-compose installed](https://docs.docker.com/compose/install/)

### 1. Install the application

Download the latest release from github. Copy paste and exectute this command in a terminal:

#### On Linux

``` shell
mkdir -p microrealestate; curl -L https://github.com/microrealestate/microrealestate/releases/latest/download/mre-linux-x64.tar.gz | tar -xz -C microrealestate
```

#### On Mac

``` shell
mkdir -p microrealestate; curl -L https://github.com/microrealestate/microrealestate/releases/latest/download/mre-macos-x64.tar.gz | tar -xz -C microrealestate
```

#### On Windows PowerShell

``` shell
wget https://github.com/microrealestate/microrealestate/releases/latest/download/mre-win-x64.zip -Outfile microrealestate.zip; Expand-Archive microrealestate.zip -DestinationPath microrealestate; Remove-Item microrealestate.zip
```

### 2. Start the application

Go in the microrealestate directory and launch the application:

```shell
$ cd microrealestate
$ ./mre start
```

The first time, you can expect a series of questions to configure the application. Answer the questions as prompted to tailor the application to your specific needs. Once you've completed this interactive configuration, a `.env` file will be generated, containing your settings.

```
? Do you want the database to be populated with? demonstration data
? Select your email delivery service? (required for password reset and tenant sign in) None
? Enter the URL to access the landlord front-end: http://localhost:8080/landlord
? Enter the URL to access the tenant front-end (it should share the same domain and port as the landlord front-end URL): http://localhost:8080/tenant
```

Once the application has started successfully, you will find several links displayed in the console to access the landlord and tenant applications.

Copy the link and paste into your preferred web browser to access the applications.

## Community

### How can you get involved?

- **Code Development**: Whether you're an experienced developer or a coding enthusiast, there's a place for you. Contribute your expertise in building robust features, fixing bugs, and optimizing performance.
- **User Interface (UI) and User Experience (UX) Design**: Join our efforts in creating an intuitive and visually appealing interface that enhances user experience. Your creative input will be invaluable in making MRE a joy to use.
- **Documentation and Localization**: Contribute to improving MRE's documentation, making it comprehensive and accessible to users worldwide. Additionally, assist in localizing the application to reach a broader audience.
- **Testing and Quality Assurance**: Ensure the reliability and stability of MRE by actively testing new features and providing valuable feedback. Help maintain a high standard of quality and user satisfaction.

To run the application in development mode, follow the steps outlined in the documentation available [here](./documentation/DEVELOPER.md)

## Donate

Your support means the world to me as I work on this project. If you'd like to show your appreciation and help fuel my efforts, you can buy me a coffee or two. Every contribution goes a long way in keeping me motivated and dedicated to delivering the best results. Thank you for your support! :raised_hands:

[![Donate](https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub)](https://github.com/sponsors/camelaissani)

## Contact

Connect with me on LinkedIn and Twitter to get in touch:

LinkedIn: [www.linkedin.com/in/caissani](https://www.linkedin.com/in/caissani/)
Twitter: [@camelaissani](https://twitter.com/camelaissani)

Feel free to reach out to me to connect, collaborate, and discuss anything related to our shared interests.

## License

The project is licensed under the MIT License. To view the license details, please follow the link below:

[MIT License](./LICENSE)

Feel free to review the license terms and conditions to understand the permissions and restrictions associated with the project.
