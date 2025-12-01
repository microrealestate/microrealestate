# Implementation Plan

- [x] 1. Set up OpenAPI infrastructure in gateway service
  - Add swagger-ui-express and axios dependencies to gateway package.json
  - Create OpenAPI aggregation module with spec fetching and merging logic
  - Implement environment variable control for ENABLE_API_DOCS
  - Add /api-docs endpoint that serves Swagger UI with aggregated specifications
  - _Requirements: 1.1, 4.1, 4.4, 5.1, 5.2, 5.3, 5.5_

- [x] 1.1 Write property test for service endpoint aggregation completeness
  - **Property 1: Service endpoint aggregation completeness**
  - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 4.2**

- [ ] 2. Add OpenAPI generation to Authenticator service
  - Add swagger-jsdoc dependency to authenticator package.json
  - Create OpenAPI configuration with service info and security schemes
  - Add JSDoc annotations for signin endpoint with request/response schemas
  - Add JSDoc annotations for refresh token endpoint
  - Add JSDoc annotations for logout endpoint
  - Document SignInRequest and SignInResponse schemas
  - Add /openapi.json endpoint to serve generated specification
  - _Requirements: 1.4, 3.1, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 2.1 Write property test for authentication requirements documentation
  - **Property 2: Authentication requirements documentation**
  - **Validates: Requirements 1.6**

- [ ] 3. Add OpenAPI generation to API service
  - Add swagger-jsdoc dependency to api package.json
  - Create OpenAPI configuration with service info and bearerAuth security scheme
  - Document /realms endpoints (GET all, GET one, POST, PATCH) with JSDoc
  - Document /dashboard endpoint with JSDoc
  - Document /leases endpoints (GET all, GET one, POST, PATCH, DELETE) with JSDoc
  - Document /tenants endpoints (GET all, GET one, POST, PATCH, DELETE) with JSDoc
  - Document /rents endpoints (GET by month, GET by tenant, PATCH payment) with JSDoc
  - Document /properties endpoints (GET all, GET one, POST, PATCH, DELETE) with JSDoc
  - Document /accounting endpoints (GET by year, CSV exports) with JSDoc
  - Document /emails endpoint (POST) with JSDoc
  - Add /openapi.json endpoint to serve generated specification
  - _Requirements: 1.2, 3.1, 6.5_

- [ ] 3.1 Write property test for response status code completeness
  - **Property 3: Response status code completeness**
  - **Validates: Requirements 1.8, 9.1**

- [ ] 4. Document core data model schemas for API service
  - Document Tenant schema with all properties (name, email, phone, properties, lease dates)
  - Document Property schema with all properties (name, type, surface, price, expense)
  - Document Lease schema with all properties (name, description, terms, timeRange, active)
  - Document Rent schema with all properties (term, month, year, amounts, payment, status)
  - Document Realm schema with organization properties
  - Document common error response schemas (ErrorResponse, UnauthorizedError, InternalServerError)
  - Add reusable response definitions for 401, 403, 404, 500 errors
  - _Requirements: 6.1, 6.3, 6.5, 9.2, 9.3_

- [ ] 4.1 Write property test for schema completeness
  - **Property 5: Schema completeness**
  - **Validates: Requirements 6.1, 6.3**

- [ ] 4.2 Write property test for error response documentation
  - **Property 6: Error response documentation**
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

- [ ] 5. Add OpenAPI generation to TenantAPI service
  - Add swagger-jsdoc dependency to tenantapi package.json
  - Create OpenAPI configuration with service info and bearerAuth security scheme
  - Add JSDoc annotations for tenant information endpoints
  - Add JSDoc annotations for tenant payment endpoints
  - Add JSDoc annotations for tenant document access endpoints
  - Document tenant-specific schemas and responses
  - Add /openapi.json endpoint to serve generated specification
  - _Requirements: 1.3, 3.1_

- [ ] 6. Add OpenAPI generation to PDFGenerator service
  - Add swagger-jsdoc dependency to pdfgenerator package.json
  - Create OpenAPI configuration with service info and bearerAuth security scheme
  - Add JSDoc annotations for /documents endpoints (generate PDF documents)
  - Add JSDoc annotations for /templates endpoints (manage document templates)
  - Document PDF generation request/response schemas
  - Document template schemas
  - Add /openapi.json endpoint to serve generated specification
  - _Requirements: 3.1_

- [ ] 7. Add OpenAPI generation to Emailer service
  - Add swagger-jsdoc dependency to emailer package.json
  - Create OpenAPI configuration with service info and bearerAuth security scheme
  - Add JSDoc annotations for email sending endpoints
  - Document email request schemas (recipients, subject, body, attachments)
  - Document email response schemas (success, failure)
  - Add /openapi.json endpoint to serve generated specification
  - _Requirements: 3.1_

- [ ] 8. Add OpenAPI generation to ResetService
  - Add swagger-jsdoc dependency to resetservice package.json
  - Create OpenAPI configuration with service info
  - Add JSDoc annotations for database reset endpoints
  - Document reset request/response schemas
  - Add /openapi.json endpoint to serve generated specification
  - Add note in documentation that this service is DEV/CI only
  - _Requirements: 1.5, 3.1_

- [ ] 9. Implement spec validation and error handling in gateway
  - Add validation function to check OpenAPI spec structure before aggregation
  - Implement graceful handling of unavailable services (log warning, continue with available specs)
  - Add timeout handling for spec fetching (5 second timeout)
  - Implement 404 response when ENABLE_API_DOCS is false
  - Add logging for spec fetching failures and validation errors
  - _Requirements: 5.2_

- [ ] 9.1 Write unit tests for spec validation and error handling
  - Test validation function with valid and invalid specs
  - Test aggregation with null/undefined specs
  - Test timeout handling
  - Test ENABLE_API_DOCS environment variable behavior
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 10. Add version information to all OpenAPI specifications
  - Set version to 1.0.0 in all service OpenAPI configurations
  - Ensure version follows semantic versioning format (MAJOR.MINOR.PATCH)
  - Add version to aggregated spec info
  - _Requirements: 8.1, 8.3, 8.4_

- [ ] 10.1 Write property test for semantic version format
  - **Property 7: Semantic version format**
  - **Validates: Requirements 8.4**

- [ ] 11. Configure Swagger UI customization in gateway
  - Enable explorer mode for better navigation
  - Set custom site title to "MicroRealEstate API Documentation"
  - Hide Swagger UI topbar with custom CSS
  - Configure Swagger UI to use aggregated spec
  - Add description about authentication in Swagger UI
  - _Requirements: 1.1, 7.4_

- [ ] 12. Update environment configuration and documentation
  - Add ENABLE_API_DOCS to base.env with default value
  - Add ENABLE_API_DOCS to .env with development default (true)
  - Update docker-compose files to pass ENABLE_API_DOCS to gateway
  - Document the new /api-docs endpoint in README
  - Add instructions for accessing and using API documentation
  - _Requirements: 5.4, 5.5_

- [ ] 12.1 Write integration tests for end-to-end documentation access
  - Test accessing /api-docs returns Swagger UI
  - Test aggregated spec includes endpoints from all services
  - Test "Try it out" functionality with authenticated request
  - Test documentation disabled behavior (404 response)
  - Test service failure handling (partial documentation)
  - _Requirements: 1.1, 2.2, 2.5, 4.2, 4.5, 5.2_

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
