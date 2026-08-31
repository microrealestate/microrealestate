# Security Policy

## Reporting a vulnerability

**Do not open a public issue for a security vulnerability.**

Report it privately, either way:

- GitHub's private vulnerability reporting, from the **Security** tab of this repository
- Email [camel.aissani@gmail.com](mailto:camel.aissani@gmail.com?subject=MicroRealEstate%20security)

Please include:

1. What the issue is and what an attacker could do with it
2. Steps to reproduce, or a proof of concept
3. The commit or image tag you are running, and how you deployed (installer, docker compose, or development mode)
4. Any relevant service logs, with credentials and tenant data removed

You will get an acknowledgement as soon as the report is read. There is no bounty program: MicroRealEstate is a donation-funded project with a single maintainer.

## Supported versions

The project ships rolling Docker images from the default branch. Only the latest images are supported — fixes land there, and there are no backports to older tags.

## Disclosure

Please give the maintainer a reasonable window to ship a fix before disclosing publicly. Fixes are announced on the [releases page](https://github.com/microrealestate/microrealestate/releases).
