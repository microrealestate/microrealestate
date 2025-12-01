# Requirements Document

## Introduction

This feature adds comprehensive OpenAPI/Swagger documentation for all MicroRealEstate backend services and exposes an interactive API documentation interface through the gateway. This will enable developers to explore, understand, and test API endpoints without requiring the frontend applications.

## Glossary

- **OpenAPI Specification**: A standard, language-agnostic interface description for HTTP APIs, formerly known as Swagger
- **Swagger UI**: An interactive web interface for exploring and testing APIs documented with OpenAPI
- **Gateway Service**: The API gateway that routes requests to backend microservices
- **API Service**: The main landlord REST API service
- **TenantAPI Service**: The tenant-facing REST API service
- **Authenticator Service**: The authentication service handling login/logout and JWT tokens
- **Emailer Service**: The email generation and sending service
- **PDFGenerator Service**: The PDF document generation service
- **ResetService**: The database reset utility service for development and CI environments

## Requirements

### Requirement 1

**User Story:** As a developer, I want to view comprehensive API documentation for all services, so that I can understand available endpoints, request/response formats, and authentication requirements without reading source code.

#### Acceptance Criteria

1. WHEN a developer accesses the documentation endpoint THEN the system SHALL display an interactive Swagger UI interface
2. WHEN viewing the documentation THEN the system SHALL include all endpoints from the API service with complete request/response schemas
3. WHEN viewing the documentation THEN the system SHALL include all endpoints from the TenantAPI service with complete request/response schemas
4. WHEN viewing the documentation THEN the system SHALL include all endpoints from the Authenticator service with complete request/response schemas
5. WHEN viewing the documentation THEN the system SHALL include all endpoints from the ResetService with complete request/response schemas
6. WHEN viewing the documentation THEN the system SHALL include authentication and authorization requirements for each endpoint
7. WHEN viewing endpoint details THEN the system SHALL display example request payloads and response bodies
8. WHEN viewing endpoint details THEN the system SHALL show all possible HTTP status codes and their meanings

### Requirement 2

**User Story:** As a developer, I want to test API endpoints directly from the documentation interface, so that I can verify functionality and debug issues without writing custom scripts.

#### Acceptance Criteria

1. WHEN a developer clicks "Try it out" on an endpoint THEN the system SHALL provide an interactive form to input request parameters
2. WHEN a developer submits a test request THEN the system SHALL execute the request against the actual backend service
3. WHEN a test request completes THEN the system SHALL display the full HTTP response including status code, headers, and body
4. WHEN testing authenticated endpoints THEN the system SHALL allow developers to input JWT tokens for authorization
5. WHEN testing authenticated endpoints THEN the system SHALL include the authorization token in the request headers

### Requirement 3

**User Story:** As a developer, I want the API documentation to be automatically generated from code annotations, so that documentation stays synchronized with implementation changes.

#### Acceptance Criteria

1. WHEN service code is modified THEN the system SHALL generate updated OpenAPI specifications from code annotations
2. WHEN a new endpoint is added THEN the system SHALL automatically include it in the documentation
3. WHEN an endpoint is removed THEN the system SHALL automatically remove it from the documentation
4. WHEN request/response schemas change THEN the system SHALL reflect the changes in the documentation
5. THE system SHALL use JSDoc comments or TypeScript decorators to annotate endpoints

### Requirement 4

**User Story:** As a developer, I want to access the API documentation through the gateway service, so that I have a single entry point for all API interactions.

#### Acceptance Criteria

1. WHEN a developer navigates to the gateway documentation URL THEN the system SHALL serve the Swagger UI interface
2. WHEN the Swagger UI loads THEN the system SHALL aggregate OpenAPI specifications from all backend services
3. WHEN selecting a service from the documentation THEN the system SHALL display endpoints specific to that service
4. THE gateway SHALL serve the documentation at a predictable URL path (e.g., `/api-docs` or `/swagger`)
5. THE gateway SHALL proxy API test requests from Swagger UI to the appropriate backend services

### Requirement 5

**User Story:** As a system administrator, I want to control access to the API documentation, so that I can restrict it to development and staging environments.

#### Acceptance Criteria

1. WHEN the application runs in production mode THEN the system SHALL allow disabling the documentation endpoint via environment variable
2. WHEN documentation is disabled THEN the system SHALL return HTTP 404 for documentation URLs
3. WHEN documentation is enabled THEN the system SHALL serve the full Swagger UI interface
4. THE system SHALL provide an environment variable `ENABLE_API_DOCS` to control documentation availability
5. THE system SHALL default to enabled in development mode and disabled in production mode

### Requirement 6

**User Story:** As a developer, I want the API documentation to include data models and schemas, so that I can understand the structure of complex request and response objects.

#### Acceptance Criteria

1. WHEN viewing the documentation THEN the system SHALL include a schemas section with all data models
2. WHEN a data model is referenced in an endpoint THEN the system SHALL provide a link to the full schema definition
3. WHEN viewing a schema THEN the system SHALL display all properties with their types, descriptions, and constraints
4. WHEN a schema includes nested objects THEN the system SHALL display the complete hierarchy
5. THE system SHALL include schemas for Lease, Property, Tenant, Payment, Document, and other core entities

### Requirement 7

**User Story:** As a developer, I want the documentation to include authentication flows, so that I can understand how to obtain and use access tokens.

#### Acceptance Criteria

1. WHEN viewing the documentation THEN the system SHALL include a section describing the authentication process
2. WHEN viewing authentication details THEN the system SHALL document the login endpoint and token response format
3. WHEN viewing authentication details THEN the system SHALL document token refresh mechanisms
4. WHEN viewing authentication details THEN the system SHALL explain how to include JWT tokens in API requests
5. THE system SHALL document the Bearer token authentication scheme in the OpenAPI specification

### Requirement 8

**User Story:** As a developer, I want the documentation to be versioned, so that I can reference documentation for specific API versions.

#### Acceptance Criteria

1. WHEN the API version changes THEN the system SHALL update the version number in the OpenAPI specification
2. WHEN viewing the documentation THEN the system SHALL display the current API version prominently
3. THE system SHALL include version information in the OpenAPI `info.version` field
4. THE system SHALL follow semantic versioning (e.g., 1.0.0, 1.1.0, 2.0.0)
5. WHEN breaking changes are introduced THEN the system SHALL increment the major version number

### Requirement 9

**User Story:** As a developer, I want the documentation to include error response formats, so that I can handle errors appropriately in client applications.

#### Acceptance Criteria

1. WHEN an endpoint can return errors THEN the system SHALL document all possible error status codes
2. WHEN viewing error responses THEN the system SHALL include example error payloads
3. WHEN viewing error responses THEN the system SHALL describe the error message format and structure
4. THE system SHALL document common error codes (400, 401, 403, 404, 500) across all endpoints
5. THE system SHALL document service-specific error codes and their meanings

### Requirement 10

**User Story:** As a developer, I want the documentation to be searchable, so that I can quickly find specific endpoints or data models.

#### Acceptance Criteria

1. WHEN a developer uses the Swagger UI search feature THEN the system SHALL filter endpoints by search terms
2. WHEN searching THEN the system SHALL match against endpoint paths, descriptions, and tags
3. WHEN searching THEN the system SHALL highlight matching results
4. WHEN searching THEN the system SHALL support partial matches
5. THE Swagger UI SHALL provide the built-in search functionality without custom implementation
