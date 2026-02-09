/**
 * Cypress E2E Support File
 */

// Import commands
import './commands';

// Prevent uncaught exceptions from failing tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // Log the error but don't fail the test
  console.error('Uncaught exception:', err);
  return false;
});

// Custom type declarations
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login via API
       */
      login(email?: string, password?: string): Chainable<void>;

      /**
       * Custom command to logout
       */
      logout(): Chainable<void>;

      /**
       * Get element by data-testid
       */
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Wait for API request
       */
      waitForApi(alias: string): Chainable<void>;
    }
  }
}
