# Design Document

## Overview

This design outlines the migration strategy from Jest to Vitest for the MicroRealEstate monorepo. Vitest is a modern, Vite-powered testing framework that provides better ES modules support, faster execution, and improved developer experience. The migration will be performed incrementally across four workspaces that currently use Jest: `services/api`, `services/common`, `services/gateway`, and `cli`.

### Key Benefits of Vitest

- **Native ES Modules Support**: No need for `--experimental-vm-modules` flag
- **Faster Execution**: Powered by Vite's transformation pipeline
- **Better TypeScript Support**: Native TypeScript handling without compilation
- **Compatible API**: Drop-in replacement for Jest's API (describe, it, expect)
- **Improved Watch Mode**: Instant feedback with HMR-like experience
- **Better Error Messages**: More readable stack traces and diffs

## Architecture

### Migration Scope

The migration affects four workspaces:

1. **services/api** (JavaScript, ES modules)
   - Current: Jest with `--experimental-vm-modules` flag
   - Tests: Contract manager business logic
   - Dependencies: Supertest for API testing

2. **services/common** (TypeScript, ES modules)
   - Current: Standard Jest configuration
   - Tests: URL utility functions
   - Dependencies: None specific to testing

3. **services/gateway** (TypeScript, ES modules)
   - Current: Standard Jest configuration
   - Tests: OpenAPI aggregation with property-based testing
   - Dependencies: fast-check for property-based testing

4. **cli** (JavaScript, CommonJS)
   - Current: Jest with `--passWithNoTests` flag
   - Tests: None currently, but configured for future tests
   - Dependencies: None specific to testing

### Migration Strategy

The migration follows a **workspace-by-workspace** approach:

1. Install Vitest dependencies at workspace level
2. Create Vitest configuration file
3. Update package.json scripts
4. Verify tests pass
5. Remove Jest dependencies
6. Update documentation

## Components and Interfaces

### Vitest Configuration Files

Each workspace will have its own `vitest.config.ts` or `vitest.config.js` file:

#### For TypeScript Workspaces (gateway, common)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/__tests__/**']
    }
  }
});
```

#### For JavaScript Workspaces (api, cli)

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/**/*.test.js', 'src/**/__tests__/**']
    }
  }
});
```

### Package.json Updates

#### services/api

**Before:**
```json
{
  "scripts": {
    "test": "node --experimental-vm-modules ../../node_modules/jest/bin/jest.js"
  },
  "devDependencies": {
    "jest": "29.7.0",
    "supertest": "6.1.3"
  }
}
```

**After:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "devDependencies": {
    "vitest": "^2.1.0",
    "@vitest/coverage-v8": "^2.1.0",
    "supertest": "6.1.3"
  }
}
```

#### services/common

**Before:**
```json
{
  "scripts": {
    "test": "jest"
  },
  "devDependencies": {
    "jest": "29.7.0"
  }
}
```

**After:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "devDependencies": {
    "vitest": "^2.1.0",
    "@vitest/coverage-v8": "^2.1.0"
  }
}
```

#### services/gateway

**Before:**
```json
{
  "scripts": {
    "test": "jest"
  },
  "devDependencies": {
    "jest": "29.7.0"
  }
}
```

**After:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "devDependencies": {
    "vitest": "^2.1.0",
    "@vitest/coverage-v8": "^2.1.0"
  }
}
```

#### cli

**Before:**
```json
{
  "scripts": {
    "test": "jest --passWithNoTests"
  },
  "devDependencies": {
    "jest": "29.7.0"
  }
}
```

**After:**
```json
{
  "scripts": {
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest --passWithNoTests",
    "test:coverage": "vitest run --coverage --passWithNoTests"
  },
  "devDependencies": {
    "vitest": "^2.1.0",
    "@vitest/coverage-v8": "^2.1.0"
  }
}
```

## Data Models

### Test File Structure

Test files remain unchanged. Vitest is API-compatible with Jest:

```javascript
// Existing Jest test - works as-is with Vitest
describe('contract functionalities', () => {
  it('create contract', () => {
    const contract = Contract.create({...});
    expect(contract.terms).toEqual(108);
  });
});
```

### Property-Based Testing Integration

Fast-check integration remains unchanged:

```typescript
// Existing fast-check test - works as-is with Vitest
import * as fc from 'fast-check';

describe('OpenAPI Aggregation Property Tests', () => {
  it('should include all service endpoints', () => {
    fc.assert(
      fc.property(
        fc.array(arbOpenAPISpec, { minLength: 1, maxLength: 6 }),
        (serviceSpecs) => {
          const aggregated = aggregateSpecs(serviceSpecs);
          // assertions...
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, most are specific examples or verification steps rather than universal properties. The migration is primarily a configuration and dependency management task with specific verification points. The testable criteria are mostly examples that verify specific states (files exist, dependencies are correct, tests pass).

Key observations:
- Many criteria are redundant (e.g., multiple criteria about tests passing)
- Most criteria are about specific file states or configurations, not universal properties
- Performance criteria require manual measurement and comparison
- The migration success is best verified through specific examples rather than properties

### Correctness Properties

Given the nature of this migration task, there are no universal properties that apply across all inputs. Instead, the migration correctness is verified through specific examples and checks:

**Example Verification 1: Dependency Migration Completeness**
For the four specific workspaces (api, common, gateway, cli), verify that:
- Vitest is present in devDependencies
- Jest is absent from devDependencies
- Coverage provider (@vitest/coverage-v8) is present
**Validates: Requirements 1.1, 1.2, 1.5**

**Example Verification 2: Configuration Files Present**
For each workspace with tests, verify that a vitest.config file exists with correct coverage settings
**Validates: Requirements 2.1, 2.2**

**Example Verification 3: Script Updates**
For each workspace, verify that:
- The test script calls "vitest run" instead of "jest"
- The api workspace script no longer uses --experimental-vm-modules
- Watch and coverage scripts are available
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

**Example Verification 4: Test Execution Success**
For each workspace, verify that running the test command passes all existing tests:
- services/api: Contract manager tests pass
- services/common: URL utility tests pass
- services/gateway: OpenAPI property tests pass
- cli: Handles passWithNoTests correctly
**Validates: Requirements 1.3, 1.4, 4.1, 4.2, 4.3, 4.4**

**Example Verification 5: Documentation Updates**
Verify that tech.md:
- Documents Vitest as the testing framework
- Removes Jest references
- Documents Vitest commands
- Lists workspaces with test suites
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

## Error Handling

### Migration Errors

**Dependency Installation Failures**
- **Cause**: Network issues, version conflicts
- **Handling**: Retry installation, check for peer dependency conflicts
- **Recovery**: Use specific Vitest version if latest fails

**Test Execution Failures**
- **Cause**: API incompatibilities, configuration issues
- **Handling**: Review Vitest configuration, check for unsupported Jest features
- **Recovery**: Adjust configuration or test code if necessary

**Import Resolution Issues**
- **Cause**: ES module path resolution differences
- **Handling**: Verify import paths include .js extensions
- **Recovery**: Update import statements if needed

**Coverage Generation Failures**
- **Cause**: Coverage provider configuration issues
- **Handling**: Verify @vitest/coverage-v8 is installed
- **Recovery**: Adjust coverage configuration

### Rollback Strategy

If migration fails for a workspace:
1. Restore original package.json
2. Remove vitest.config file
3. Reinstall Jest dependencies
4. Verify tests pass with Jest
5. Document issues for future retry

## Testing Strategy

### Unit Testing Approach

The migration itself doesn't require new unit tests. Instead, we verify that existing unit tests continue to pass with Vitest:

**services/api**
- 16 existing tests for contract manager functionality
- Tests cover: creation, renewal, termination, payment tracking
- All tests must pass without modification

**services/common**
- 3 existing tests for URL utility functions
- Tests cover: URL building and destructuring
- All tests must pass without modification

**services/gateway**
- 6 existing property-based tests for OpenAPI aggregation
- Tests use fast-check with 100 iterations each
- All tests must pass without modification

**cli**
- No existing tests, but must handle --passWithNoTests flag
- Should exit successfully with no tests found

### Property-Based Testing

The gateway service uses fast-check for property-based testing. The migration must maintain this capability:

**Library**: fast-check (no changes required)
**Framework**: Vitest (replaces Jest)
**Configuration**: 100 iterations per property (maintained)

**Property Test Tags**: Each property test includes a comment referencing the design document:
```typescript
/**
 * Property-Based Tests for OpenAPI Aggregation
 * Feature: api-documentation, Property 1: Service endpoint aggregation completeness
 * Validates: Requirements 1.2, 1.3, 1.4, 1.5, 4.2
 */
```

These tags remain unchanged during migration.

### Integration Testing

**Workspace-Level Integration**
- Run full test suite in each workspace
- Verify coverage reports generate correctly
- Test watch mode functionality

**Monorepo-Level Integration**
- Verify yarn workspace commands work
- Test running all tests from root
- Verify no cross-workspace issues

### Migration Verification Checklist

For each workspace:
- [ ] Vitest installed in devDependencies
- [ ] Jest removed from devDependencies
- [ ] vitest.config file created
- [ ] package.json scripts updated
- [ ] All tests pass with `yarn test`
- [ ] Coverage reports generate with `yarn test:coverage`
- [ ] Watch mode works with `yarn test:watch`

For documentation:
- [ ] tech.md updated to reference Vitest
- [ ] Jest references removed from tech.md
- [ ] Test commands documented
- [ ] Workspace test status documented

## Implementation Considerations

### Vitest Version Selection

Use Vitest 2.1.0 or later for:
- Stable API
- Full fast-check compatibility
- Mature coverage provider
- Good TypeScript support

### Configuration Consistency

All workspaces should use consistent configuration:
- `globals: true` for Jest-compatible API
- `environment: 'node'` for Node.js testing
- `coverage.provider: 'v8'` for fast coverage
- Same reporter configuration

### ES Modules Handling

Vitest handles ES modules natively:
- No --experimental-vm-modules flag needed
- Import statements work as-is
- .js extensions in imports are respected

### TypeScript Handling

Vitest handles TypeScript natively:
- No pre-compilation needed
- tsconfig.json is respected
- Type checking during tests (optional)

### Fast-Check Integration

Fast-check works seamlessly with Vitest:
- No configuration changes needed
- Same API as with Jest
- Property test syntax unchanged

### Performance Optimization

Vitest provides better performance through:
- Parallel test execution by default
- Smart test re-running in watch mode
- Faster module transformation
- Efficient coverage collection

### CI/CD Considerations

For continuous integration:
- Use `vitest run` for non-interactive execution
- Coverage reports in same format as Jest
- Exit codes compatible with CI systems
- Same test output format

## Dependencies

### New Dependencies

**All Test Workspaces**:
- `vitest`: ^2.1.0 (test runner)
- `@vitest/coverage-v8`: ^2.1.0 (coverage provider)

### Removed Dependencies

**All Test Workspaces**:
- `jest`: 29.7.0 (replaced by Vitest)

### Unchanged Dependencies

**services/api**:
- `supertest`: 6.1.3 (HTTP testing, works with Vitest)

**services/gateway**:
- `fast-check`: (property-based testing, works with Vitest)

## Migration Timeline

### Phase 1: Preparation
- Review existing test suites
- Document current test counts and coverage
- Identify any Jest-specific features in use

### Phase 2: Workspace Migration
- Migrate services/common (simplest, TypeScript)
- Migrate services/gateway (TypeScript with fast-check)
- Migrate services/api (JavaScript with ES modules)
- Migrate cli (JavaScript, no tests yet)

### Phase 3: Verification
- Run all tests in each workspace
- Verify coverage reports
- Test watch mode functionality
- Document any issues

### Phase 4: Documentation
- Update tech.md
- Update structure.md if needed
- Document new test commands
- Update workspace information

### Phase 5: Cleanup
- Remove Jest dependencies
- Remove jest.config.js files
- Verify no Jest references remain
- Final verification of all tests

## Success Criteria

The migration is successful when:
1. All four workspaces use Vitest instead of Jest
2. All existing tests pass without modification
3. Coverage reports generate correctly
4. Watch mode works in all workspaces
5. Documentation is updated
6. No Jest dependencies remain
7. Performance is equal or better than Jest
