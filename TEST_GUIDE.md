# MicroRealEstate Test Suite Guide

## Overview

This document provides guidance on the comprehensive test suite for MicroRealEstate, covering both backend services and the landlord webapp.

## Test Structure

### Backend Services

Each service has its own Jest configuration and test structure:

```
services/[SERVICE_NAME]/
├── src/
│   ├── __tests__/         # Test files
│   │   ├── [service].test.js/.ts
│   │   └── __mocks__/     # Mock implementations
│   └── [source files]
├── jest.config.js         # Jest configuration
└── package.json
```

**Services to test:**
- `api` - Main API service (already has tests)
- `authenticator` - Authentication service
- `emailer` - Email service
- `pdfgenerator` - PDF generation service
- `resetservice` - Database reset service
- `tenantapi` - Tenant-facing API

### Landlord Webapp

React component and page tests:

```
webapps/landlord/
├── src/
│   ├── __tests__/
│   │   ├── components/     # Component unit tests
│   │   ├── pages/          # Page/feature tests
│   │   ├── hooks/          # Custom hook tests
│   │   └── utils/          # Utility function tests
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── utils/
├── jest.config.js
├── jest.setup.js
└── package.json
```

## Running Tests

### Run All Tests
```bash
yarn test
```

### Run Specific Service Tests
```bash
# API service
yarn test:api

# Authenticator
yarn test:authenticator

# Emailer
yarn test:emailer

# PDF Generator
yarn test:pdfgenerator

# Reset Service
yarn test:resetservice

# Tenant API
yarn test:tenantapi

# Landlord Webapp
yarn test:landlord
```

### Watch Mode (Auto-run on file changes)
```bash
yarn test:watch
```

### Generate Coverage Reports
```bash
yarn test:coverage
```

### Run All Tests + E2E Tests
```bash
yarn test:all
```

## Writing Tests

### Backend Service Tests (Jest with Node)

```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  })

  afterEach(() => {
    // Cleanup after each test
  })

  it('should do something', () => {
    // Arrange
    const input = { /* test data */ }
    
    // Act
    const result = functionUnderTest(input)
    
    // Assert
    expect(result).toEqual(expectedValue)
  })
})
```

### Landlord Webapp Tests (Jest with React Testing Library)

#### Component Tests
```javascript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render', () => {
    render(<MyComponent />)
    expect(screen.getByText(/hello/i)).toBeInTheDocument()
  })

  it('should handle user interaction', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)
    
    await user.click(screen.getByRole('button'))
    expect(screen.getByText(/updated/i)).toBeInTheDocument()
  })
})
```

#### Hook Tests
```javascript
import { renderHook, act } from '@testing-library/react'
import { useMyHook } from '@/hooks/useMyHook'

describe('useMyHook', () => {
  it('should return expected value', () => {
    const { result } = renderHook(() => useMyHook())
    expect(result.current.value).toBe('expected')
  })

  it('should update on action', () => {
    const { result } = renderHook(() => useMyHook())
    
    act(() => {
      result.current.updateValue('new')
    })
    
    expect(result.current.value).toBe('new')
  })
})
```

## Test Categories

### Unit Tests
- Test individual functions/components in isolation
- Mock external dependencies
- Fast to run
- Located in `__tests__` directories near source files

### Integration Tests
- Test multiple components working together
- Test with real or realistic data
- Slower than unit tests
- Can test API endpoints with database interactions

### E2E Tests (Cypress)
- Test complete user workflows through the UI
- Run against deployed/running application
- Slowest but most realistic
- Located in `e2e/cypress/`

## Mocking

### Backend Services
Use Jest mocks for external dependencies:
```javascript
jest.mock('../module', () => ({
  function: jest.fn(),
}))
```

### Landlord Webapp
Mock Next.js utilities:
```javascript
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    // ... other router methods
  })
}))
```

Use `jest.setup.js` for common mocks that apply to all tests.

## Coverage Targets

Aim for the following coverage percentages:

| Type | Target |
|------|--------|
| Statements | 70%+ |
| Branches | 65%+ |
| Functions | 70%+ |
| Lines | 70%+ |

View coverage report after running tests:
```bash
yarn test:coverage
# Then open `coverage/lcov-report/index.html` in browser
```

## Continuous Integration

Tests are run automatically on:
- Pull requests
- Commits to main branch
- Pre-commit hooks (linting + tests for changed files)

CI test command:
```bash
yarn ci
```

## Troubleshooting

### Jest Module Resolution Issues
- Check `moduleNameMapper` in jest.config.js
- Ensure TypeScript types are compiled
- Clear Jest cache: `jest --clearCache`

### React Testing Library Issues
- Use `screen` queries for better practices
- Check for async operations with `waitFor`
- Review Next.js mocks in `jest.setup.js`

### Timeout Issues
- Increase timeout: `jest.setTimeout(10000)`
- Check for missing `await` statements
- Verify mock implementations are complete

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Next.js Testing](https://nextjs.org/docs/testing)

## Example Test Stubs

Example test files have been created in each service and the landlord webapp showing the expected test structure. Use these as templates when writing real tests:

- `services/api/src/__tests__/` - Existing tests
- `services/authenticator/src/__tests__/authenticator.test.js`
- `services/emailer/src/__tests__/emailer.test.js`
- `webapps/landlord/src/__tests__/components/components.test.tsx`
- `webapps/landlord/src/__tests__/pages/pages.test.tsx`

Replace TODO comments with actual test implementations.
