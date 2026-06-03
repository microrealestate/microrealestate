#!/bin/bash

# MicroRealEstate Test Suite Runner
# This script runs all tests for the project with various options

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_header() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

# Test summary
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
  local service=$1
  local description=$2
  
  TESTS_RUN=$((TESTS_RUN + 1))
  
  print_info "Running $description..."
  
  if yarn test:$service 2>/dev/null; then
    print_success "$description passed"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    return 0
  else
    print_error "$description failed"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  fi
}

# Parse command line arguments
COMMAND=${1:-help}

case $COMMAND in
  all)
    print_header "Running All Tests"
    
    run_test "api" "API Service Tests"
    run_test "authenticator" "Authenticator Service Tests"
    run_test "emailer" "Emailer Service Tests"
    run_test "pdfgenerator" "PDF Generator Service Tests"
    run_test "resetservice" "Reset Service Tests"
    run_test "tenantapi" "Tenant API Service Tests"
    run_test "landlord" "Landlord Webapp Tests"
    
    echo ""
    print_header "Test Summary"
    echo "Total Tests Run: $TESTS_RUN"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    if [ $TESTS_FAILED -gt 0 ]; then
      echo -e "${RED}Failed: $TESTS_FAILED${NC}"
      exit 1
    fi
    print_success "All tests passed!"
    ;;
    
  backend)
    print_header "Running Backend Service Tests"
    
    run_test "api" "API Service Tests"
    run_test "authenticator" "Authenticator Service Tests"
    run_test "emailer" "Emailer Service Tests"
    run_test "pdfgenerator" "PDF Generator Service Tests"
    run_test "resetservice" "Reset Service Tests"
    run_test "tenantapi" "Tenant API Service Tests"
    
    echo ""
    print_header "Backend Test Summary"
    echo "Tests Passed: $TESTS_PASSED"
    [ $TESTS_FAILED -gt 0 ] && echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}" && exit 1
    print_success "All backend tests passed!"
    ;;
    
  frontend)
    print_header "Running Frontend Tests"
    run_test "landlord" "Landlord Webapp Tests"
    
    echo ""
    print_success "Frontend tests passed!"
    ;;
    
  coverage)
    print_header "Generating Coverage Reports"
    echo "Running tests with coverage..."
    yarn test:coverage
    print_success "Coverage reports generated"
    print_info "Open coverage/lcov-report/index.html to view detailed coverage"
    ;;
    
  watch)
    print_header "Running Tests in Watch Mode"
    echo "Running tests in watch mode. Press 'q' to quit."
    yarn test:watch
    ;;
    
  e2e)
    print_header "Running E2E Tests"
    yarn e2e:run
    ;;
    
  *)
    echo "MicroRealEstate Test Suite Runner"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  all              Run all unit tests (backend + frontend)"
    echo "  backend          Run backend service tests only"
    echo "  frontend         Run frontend (landlord) tests only"
    echo "  coverage         Generate coverage reports"
    echo "  watch            Run tests in watch mode"
    echo "  e2e              Run E2E tests with Cypress"
    echo "  help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 all              # Run all tests"
    echo "  $0 backend          # Run backend tests"
    echo "  $0 coverage         # Generate coverage report"
    echo ""
    ;;
esac
