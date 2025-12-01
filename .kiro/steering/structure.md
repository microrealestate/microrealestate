# Project Structure

## Monorepo Organization

MicroRealEstate uses a Yarn workspaces monorepo with the following top-level structure:

```
microrealestate/
├── services/          # Backend microservices
├── webapps/          # Frontend applications
├── types/            # Shared TypeScript types
├── cli/              # CLI tool for managing the application
├── e2e/              # End-to-end Cypress tests
├── documentation/    # Project documentation
├── config/           # Configuration files (e.g., Logstash)
├── data/             # Local data directories (MongoDB, Redis)
├── backup/           # Database backup location
└── docker-compose*.yml  # Docker Compose configurations
```

## Services (`/services`)

Backend microservices, each in its own workspace:

- **`api/`** - Main landlord REST API (`@microrealestate/api`)
- **`tenantapi/`** - Tenant-facing REST API (`@microrealestate/tenantapi`)
- **`authenticator/`** - Authentication service (login/logout, JWT tokens)
- **`gateway/`** - API gateway and reverse proxy
- **`emailer/`** - Email generation and sending service
- **`pdfgenerator/`** - PDF document generation service
- **`resetservice/`** - Database reset utility (DEV/CI only)
- **`common/`** - Shared backend utilities and code

### Service Structure Pattern
```
services/<service-name>/
├── src/
│   ├── index.js           # Entry point
│   ├── routes/            # Express routes
│   ├── models/            # Database models
│   └── utils/             # Utilities
├── package.json
├── Dockerfile
└── .dockerignore
```

## Web Applications (`/webapps`)

Frontend Next.js applications:

- **`landlord/`** - Landlord portal (`@microrealestate/landlord`)
- **`tenant/`** - Tenant portal (`@microrealestate/tenant`)
- **`commonui/`** - Shared UI components and utilities (`@microrealestate/commonui`)

### Frontend Structure Pattern
```
webapps/<app-name>/
├── src/
│   ├── pages/             # Next.js pages (routing)
│   ├── components/        # React components
│   ├── store/             # MobX stores
│   ├── utils/             # Utilities
│   └── styles/            # CSS/Tailwind styles
├── public/                # Static assets
├── locales/               # i18n translations
├── package.json
├── next.config.js
└── Dockerfile
```

## Shared Packages

- **`types/`** - TypeScript type definitions shared across services (`@microrealestate/types`)
- **`commonui/`** - Shared React components, hooks, and utilities for frontends

## Development Tools

- **`cli/`** - Custom CLI tool for building, starting, and managing the application
- **`e2e/`** - Cypress end-to-end tests

## Configuration Files

### Root Level
- **`package.json`** - Root workspace configuration with scripts
- **`.yarnrc.yml`** - Yarn 3 configuration
- **`docker-compose.yml`** - Main production Docker Compose file
- **`docker-compose.microservices.*.yml`** - Environment-specific overrides (dev, prod, test)
- **`.env`** / **`base.env`** - Environment variables
- **`.eslintrc.json`** - Root ESLint configuration
- **`.prettierrc.json`** - Prettier configuration

### Service/App Level
- Each workspace has its own `package.json`, `.eslintrc.json`, `Dockerfile`
- Services use `tsconfig.json` for TypeScript compilation
- Frontends use `next.config.js` for Next.js configuration

## Key Conventions

### Workspace Naming
- Services: `@microrealestate/<service-name>`
- Webapps: `@microrealestate/<app-name>`
- All workspaces are private (`"private": true`)

### Module System
- Backend services use ES modules (`"type": "module"`)
- Import statements use `.js` extensions even for TypeScript files

### Docker
- Each service/webapp has its own `Dockerfile`
- Images are published to GitHub Container Registry: `ghcr.io/microrealestate/microrealestate/<service>:<version>`

### Build Process
- TypeScript types are compiled first (`types/`)
- Common backend code is compiled next (`services/common/`)
- Individual services/apps build after dependencies

### Port Assignments
- Gateway: 8080
- Authenticator: 8000
- API: 8200
- TenantAPI: 8250
- PDFGenerator: 8300
- Emailer: 8400
- Landlord Frontend: 8180
- Tenant Frontend: 8190
- MongoDB: 27017
- Redis: 6379

## Working with the Codebase

### Adding a New Service
1. Create directory in `services/`
2. Add to root `package.json` workspaces
3. Create `package.json` with `@microrealestate/<name>`
4. Add `Dockerfile` and `.dockerignore`
5. Update `docker-compose*.yml` files

### Adding a New Frontend Feature
1. Create components in `src/components/`
2. Add pages in `src/pages/` (Next.js routing)
3. Add translations in `locales/` directories
4. Update MobX stores in `src/store/` if needed

### Modifying Shared Types
1. Edit files in `types/src/`
2. Run `yarn workspace @microrealestate/types build`
3. Dependent services will pick up changes on their next build
