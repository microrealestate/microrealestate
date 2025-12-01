# Product Overview

MicroRealEstate (MRE) is an open-source property management application designed to help landlords manage their properties, tenants, and rental operations.

## Core Features

- **Property & Tenant Management**: Centralized storage of property details, tenant records, and contact information
- **Lease Management**: Create and manage rent leases with customizable templates
- **Payment Tracking**: Track rent payments and identify overdue payments
- **Document Generation**: Generate custom documents (letters, notices, contracts, invoices) as PDFs
- **Email Communication**: Send notices and receipts to tenants via email
- **Multi-user Collaboration**: Support for teams managing multiple properties

## User Roles

- **Landlord**: Primary user who manages properties, tenants, and leases
- **Tenant**: Can view their rental information and make payments

## Architecture

Microservices-based architecture with:
- Two frontend applications (landlord and tenant portals)
- Multiple backend services (API, authentication, PDF generation, email, etc.)
- MongoDB for data persistence
- Redis for session/cache management
- Docker-based deployment
