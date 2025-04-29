# End-to-End Testing with Cypress

This directory contains end-to-end tests for the Cloud Diagram application using Cypress with TypeScript.

## Overview

End-to-end tests verify that the application works correctly from a user's perspective by automating browser interactions and asserting that the application behaves as expected. These tests cover critical user flows such as:

1. Creating and managing diagrams
2. Adding elements to diagrams
3. Editing element properties
4. Connecting elements with links
5. Undo/redo operations
6. Exporting diagrams
7. Theme and grid toggling

## Running Tests

### Prerequisites

- Node.js and npm installed
- Project dependencies installed (`npm install`)

### Commands

- **Open Cypress Test Runner**: Run tests interactively with a visual interface
  ```
  npm run cypress:open
  ```

- **Run Cypress Tests Headlessly**: Run tests in the background (useful for CI/CD)
  ```
  npm run cypress:run
  ```

- **Run Tests with Development Server**: Start the development server and run tests
  ```
  npm run test:e2e
  ```

## Test Structure

- **cypress.config.ts**: Main Cypress configuration file

- **e2e/**: Contains test files for different user flows
  - `diagram-creation.cy.ts`: Tests for creating and managing diagrams
  - `diagram-editing.cy.ts`: Tests for adding elements and editing properties
  - `diagram-operations.cy.ts`: Tests for undo/redo, theme toggling, and exporting

- **fixtures/**: Contains test data
  - `testData.json`: Test data for diagrams and elements

- **support/**: Contains helper files
  - `commands.ts`: Custom Cypress commands for common operations with TypeScript type definitions
  - `e2e.ts`: Configuration loaded before tests run

## Writing New Tests

When writing new tests:

1. Use existing tests as templates
2. Follow the pattern of:
   - Setting up the test environment
   - Performing actions
   - Verifying results
3. Use custom commands from `commands.ts` for common operations
4. Add new custom commands as needed for reusable functionality
5. Take advantage of TypeScript features:
   - Add type annotations for better code completion and error checking
   - Define interfaces for test data
   - Extend the Cypress namespace for custom commands in `commands.ts`

## Debugging Tests

If tests fail:

1. Check the Cypress screenshots in `cypress/screenshots/`
2. Use `cy.pause()` in your tests to pause execution and inspect the state
3. Use `cy.debug()` to open the browser's developer tools during test execution
4. Add more specific assertions to pinpoint where tests are failing

## CI/CD Integration

These tests can be integrated into a CI/CD pipeline by:

1. Installing dependencies
2. Running `npm run test:e2e`
3. Publishing test results and screenshots as artifacts

## Maintenance

To keep tests maintainable:

1. Update selectors if the UI changes
2. Keep tests focused on user flows rather than implementation details
3. Use data attributes for more stable selectors (e.g., `data-testid="element-name"`)
4. Regularly run tests to catch regressions early
