A full breaking change from `microrealestate/microrealestate`, not a continuation of it — for history before the fork, see the [upstream releases](https://github.com/microrealestate/microrealestate/releases).

> [!WARNING]
> **Upgrading from an upstream installation is not fully covered yet. Back up your data before you upgrade** — both the database and `data/uploads`, which the database dump does not include. See [documentation/OPERATIONS.md](https://github.com/microrealestate/microrealestate/blob/main/documentation/OPERATIONS.md).

The application is published under the Sustainable Use License v2.0 ([LICENSE.md](https://github.com/microrealestate/microrealestate/blob/main/LICENSE.md)): free for personal, private, non-commercial use of up to 5 rental units. The relicensing was discussed with the project's contributors in [microrealestate/microrealestate#264](https://github.com/microrealestate/microrealestate/issues/264).

Headline differences from the upstream project:

- No user roles — collaborator accounts are provisioned by the owner

- SMTP is the only email provider

- No S3 storage and no machine-to-machine API access
