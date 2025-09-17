# MicroRealEstate Copilot Instructions

## Architecture Overview

MicroRealEstate is a microservices-based property management platform with:
- **Microservices**: Gateway, Authenticator, API, TenantAPI, Emailer, PDFGenerator, ResetService
- **Web Applications**: Landlord UI (`webapps/landlord`) and Tenant UI (`webapps/tenant`)
- **Shared Components**: Common utilities (`services/common`) and shared types (`types/`)
- **Infrastructure**: MongoDB for data, Redis for sessions/tokens, Docker for containerization

## Development Workflow

### Start Development Environment
```bash
yarn dev  # Starts all services in development mode with hot reload
```

### Build and Production
```bash
yarn build     # Build all services and frontends
yarn start     # Start in production mode
yarn stop      # Stop all services
yarn ci        # Start in CI/test mode
```

### Service-Specific Development
Each service has consistent build patterns:
- `yarn workspace @microrealestate/[service] run dev` - Development with watch mode
- Services depend on shared `types` and `common` packages that auto-rebuild

## Key Patterns and Conventions

### Service Structure
- All services extend `Service` class from `@microrealestate/common`
- Authentication via JWT tokens (access + refresh tokens)
- Middleware pattern: `needAccessToken()`, `checkOrganization()`, `notRoles()`
- Error handling with `ServiceError` class and `asyncWrapper` middleware

### Type System
- Shared TypeScript types in `types/src/` with `CollectionTypes` namespace
- MongoDB schemas mirror TypeScript interfaces
- API request/response types in `types/src/api/`

### Authentication Flow
- **Landlords**: Email/password + JWT tokens stored in HTTP-only cookies
- **Tenants**: Email + OTP → session tokens
- **Applications**: Client credentials (M2M) with JWT

### Database Patterns
- MongoDB collections: Account, Realm, Tenant, Property, Lease, Document, Template
- Multi-tenancy via `realmId` field on all collections
- Mongoose models in `services/common/src/collections/`

### Frontend Architecture
- Next.js applications with shared UI components (`webapps/commonui`)
- State management with MobX
- Internationalization with `next-translate`
- API communication through Gateway service

## Essential Debugging

### VS Code Debug Configurations
Attach debuggers to running Docker services via ports:
- Gateway: 9225, Authenticator: 9226, API: 9229, TenantAPI: 9240
- Emailer: 9228, PDFGenerator: 9227, ResetService: 9230

### Key Environment Variables
- `MRE_VERSION`: Controls Docker image tags (dev/local/latest)
- `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`: JWT signing
- `MONGO_URL`, `REDIS_URL`: Database connections
- `APP_DOMAIN`, `APP_PROTOCOL`: External service URLs

### Service Communication
- Gateway proxies all external requests to internal services
- Internal services communicate via direct HTTP calls (Axios)
- URL patterns: `/api/v2/*` → API service, `/tenantapi/*` → TenantAPI

## Testing and Quality

```bash
yarn e2e:ci      # Run Cypress end-to-end tests
yarn lint        # Lint all workspaces
yarn format      # Format all code
```

## File Locations for Common Tasks

- **Add new API endpoint**: `services/api/src/routes.js` + corresponding manager
- **Modify authentication**: `services/authenticator/src/routes/`
- **Update data models**: `services/common/src/collections/` + `types/src/common/collections.ts`
- **Frontend components**: `webapps/commonui/components/` (shared) or service-specific
- **Email templates**: `services/emailer/src/emailparts/`
- **PDF generation**: `services/pdfgenerator/src/`

## Database Management

```bash
# CLI commands for database operations
yarn mre dumpdb     # Backup database
yarn mre restoredb  # Restore from backup
yarn mre configure  # Setup environment variables
```

The CLI (`cli/src/`) manages Docker Compose orchestration and provides database utilities.