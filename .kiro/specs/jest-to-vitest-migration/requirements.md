# Requirements Document

## Introduction

This document outlines the requirements for migrating the MicroRealEstate monorepo from Jest to Vitest as the testing framework. The migration aims to improve test performance, provide better ES modules support, and align with modern tooling while maintaining all existing test functionality.

## Glossary

- **Jest**: The current JavaScript testing framework used in the project
- **Vitest**: A modern, Vite-powered testing framework that will replace Jest
- **Workspace**: A package within the Yarn monorepo (e.g., `@microrealestate/api`)
- **Test Suite**: A collection of tests for a specific workspace
- **Property-Based Testing**: Testing approach using fast-check library to generate random test inputs
- **ES Modules**: ECMAScript module system used by the project (`"type": "module"`)
- **Coverage**: Code coverage metrics collected during test execution

## Requirements

### Requirement 1

**User Story:** As a developer, I want to migrate from Jest to Vitest, so that I can benefit from faster test execution and better ES modules support.

#### Acceptance Criteria

1. WHEN Vitest is installed THEN the system SHALL include Vitest as a dev dependency in all workspaces that currently use Jest
2. WHEN Jest is removed THEN the system SHALL remove all Jest dependencies from package.json files
3. WHEN the migration is complete THEN the system SHALL maintain backward compatibility with all existing test files
4. WHEN running tests THEN the system SHALL execute all tests successfully without requiring test file modifications
5. WHEN checking dependencies THEN the system SHALL ensure no Jest references remain in the codebase

### Requirement 2

**User Story:** As a developer, I want Vitest configuration files in each workspace, so that tests run with the correct settings for each service.

#### Acceptance Criteria

1. WHEN a workspace has tests THEN the system SHALL provide a vitest.config.ts or vitest.config.js file
2. WHEN configuring Vitest THEN the system SHALL preserve existing Jest coverage settings
3. WHEN using ES modules THEN the system SHALL configure Vitest to handle ES module imports correctly
4. WHEN running TypeScript tests THEN the system SHALL configure Vitest to handle TypeScript without compilation
5. WHEN testing the gateway service THEN the system SHALL configure Vitest to support fast-check property-based testing

### Requirement 3

**User Story:** As a developer, I want updated npm scripts, so that I can run tests using the same commands as before.

#### Acceptance Criteria

1. WHEN running `yarn test` THEN the system SHALL execute Vitest instead of Jest
2. WHEN running tests in the api workspace THEN the system SHALL no longer require the `--experimental-vm-modules` flag
3. WHEN running tests with coverage THEN the system SHALL generate coverage reports in the same format as Jest
4. WHEN running tests in watch mode THEN the system SHALL support interactive test watching
5. WHEN running tests in CI THEN the system SHALL support non-interactive test execution

### Requirement 4

**User Story:** As a developer, I want all existing tests to pass, so that I can verify the migration was successful.

#### Acceptance Criteria

1. WHEN running tests in services/api THEN the system SHALL pass all contract manager tests
2. WHEN running tests in services/common THEN the system SHALL pass all URL utility tests
3. WHEN running tests in services/gateway THEN the system SHALL pass all OpenAPI aggregation property tests
4. WHEN running tests in cli THEN the system SHALL handle the passWithNoTests configuration
5. WHEN all tests complete THEN the system SHALL report the same test results as with Jest

### Requirement 5

**User Story:** As a developer, I want to maintain property-based testing capabilities, so that I can continue using fast-check for comprehensive testing.

#### Acceptance Criteria

1. WHEN running property-based tests THEN the system SHALL execute fast-check properties correctly
2. WHEN property tests fail THEN the system SHALL display the failing counterexample
3. WHEN configuring property tests THEN the system SHALL support the same number of iterations as Jest
4. WHEN using fast-check generators THEN the system SHALL work seamlessly with Vitest
5. WHEN debugging property tests THEN the system SHALL provide clear error messages

### Requirement 6

**User Story:** As a developer, I want updated documentation, so that team members understand how to use Vitest.

#### Acceptance Criteria

1. WHEN reviewing tech.md THEN the system SHALL document Vitest as the testing framework
2. WHEN reviewing tech.md THEN the system SHALL remove references to Jest
3. WHEN reviewing test commands THEN the system SHALL document the new Vitest commands
4. WHEN reviewing workspace information THEN the system SHALL indicate which workspaces have test suites
5. WHEN onboarding new developers THEN the system SHALL provide clear testing instructions

### Requirement 7

**User Story:** As a developer, I want to verify test performance improvements, so that I can confirm the migration benefits.

#### Acceptance Criteria

1. WHEN running the full test suite THEN the system SHALL complete faster than with Jest
2. WHEN running tests in watch mode THEN the system SHALL provide instant feedback on file changes
3. WHEN running tests with coverage THEN the system SHALL generate coverage reports efficiently
4. WHEN running parallel tests THEN the system SHALL utilize available CPU cores effectively
5. WHEN comparing performance THEN the system SHALL demonstrate measurable speed improvements
