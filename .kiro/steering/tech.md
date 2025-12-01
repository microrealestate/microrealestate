# Technology Stack

## Build System & Package Management

- **Package Manager**: Yarn 3.3.0 (Yarn Berry with workspaces)
- **Node.js**: v20.x required
- **Monorepo**: Yarn workspaces for managing multiple packages

## Frontend Stack

- **Framework**: Next.js 14.2.x (React 18.2.0)
- **UI Libraries**: 
  - Material-UI v4 (legacy components)
  - Radix UI (modern components)
  - Tailwind CSS 3.4.x with animations
- **State Management**: MobX 6.x with mobx-react-lite
- **Forms**: Formik with Yup validation
- **Data Fetching**: TanStack Query (React Query) 5.x, Axios
- **Rich Text**: Tiptap 2.x
- **PDF Viewing**: react-pdf-viewer 3.x
- **Internationalization**: next-translate 2.x
- **Date Handling**: moment 2.x, date-fns 3.x

## Backend Stack

- **Runtime**: Node.js 20.x with ES modules (`"type": "module"`)
- **Language**: Mixed - some services use TypeScript, others use JavaScript
- **Framework**: Express.js
- **Database**: MongoDB 7 with Mongoose 6.x
- **Cache/Sessions**: Redis 7.4
- **Authentication**: JWT (jsonwebtoken)
- **Email**: Nodemailer with Gmail/Mailgun/SMTP support
- **PDF Generation**: Custom service using Canvas
- **Testing**: Jest 29.x, Supertest

### TypeScript vs JavaScript by Service

**TypeScript Services** (compiled with `tsc`):
- `gateway` - Full TypeScript (entry: `src/index.ts`)
- `tenantapi` - Full TypeScript (entry: `src/index.ts`)
- `resetservice` - Full TypeScript (entry: `src/index.ts`)
- `common` - Full TypeScript (shared utilities)
- `types` - TypeScript type definitions only

**JavaScript Services** (no compilation, direct execution):
- `api` - JavaScript (entry: `src/index.js`)
- `authenticator` - JavaScript (entry: `src/index.js`)
- `emailer` - JavaScript (entry: `src/index.js`)
- `pdfgenerator` - JavaScript (entry: `src/index.js`)

**Note**: All services depend on the `types` and `common` packages which are TypeScript-based and must be compiled before service development.

## Infrastructure

- **Containerization**: Docker with Docker Compose
- **Reverse Proxy**: Caddy (in production)
- **Monitoring**: Optional ELK stack (Elasticsearch, Logstash, Kibana)

## Development Tools

- **Linting**: ESLint 8.x with Prettier 3.x
- **Git Hooks**: Husky 9.x with lint-staged
- **E2E Testing**: Cypress 14.x
- **Debugging**: VS Code debug configurations included

## Common Commands

### Development
```bash
# Install dependencies
yarn

# Run in development mode (with hot reload and debugging)
yarn dev

# Run specific workspace
yarn workspace @microrealestate/landlord dev
```

### Building
```bash
# Build all services and frontends
yarn build

# Build specific workspace
yarn workspace @microrealestate/api build
```

### Testing
```bash
# Run unit tests for services with test suites
yarn workspace @microrealestate/api test      # API service (Jest)
yarn workspace @microrealestate/common test   # Common utilities (Jest)

# Run E2E tests (requires app running in CI mode)
yarn e2e:ci          # Headless
yarn e2e:run         # With browser
yarn e2e:open        # Cypress UI
```

**Services with Unit Tests:**
- `api` - Has Jest test suite
- `common` - Has Jest test suite

**Services without Unit Tests:**
- `authenticator` - No unit tests configured
- `tenantapi` - No unit tests configured
- `gateway` - No unit tests configured
- `emailer` - No unit tests configured
- `pdfgenerator` - No unit tests configured
- `resetservice` - No unit tests configured (dev/CI utility only)

**Frontends:**
- `landlord` - No unit tests configured (relies on E2E tests)
- `tenant` - No unit tests configured (relies on E2E tests)
- `commonui` - No unit tests configured

### Production
```bash
# Start in production mode
yarn start

# Stop all services
yarn stop

# Start in CI mode (for testing)
yarn ci
```

### Code Quality
```bash
# Lint all workspaces
yarn lint

# Format all code
yarn format
```

### CLI Tool
```bash
# Use the MRE CLI
yarn mre [command]
```

## Environment Variables

Key environment variables are defined in `.env` file:
- Database: `MONGO_URL`, `REDIS_PASSWORD`
- Secrets: `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `CIPHER_KEY`, `CIPHER_IV_KEY`
- Email: `GMAIL_EMAIL`, `MAILGUN_API_KEY`, or `SMTP_*` variables
- App: `APP_DOMAIN`, `APP_PORT`, `APP_PROTOCOL`
