/**
 * Cypress Custom Commands
 */

// Login command
Cypress.Commands.add('login', (email?: string, password?: string) => {
  const userEmail = email || Cypress.env('testUserEmail');
  const userPassword = password || Cypress.env('testUserPassword');

  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/auth/login`,
    body: {
      email: userEmail,
      password: userPassword,
    },
  }).then((response) => {
    if (response.body.token) {
      window.localStorage.setItem('auth_token', response.body.token);
    }
  });
});

// Logout command
Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('auth_token');
  cy.visit('/');
});

// Get by test ID command
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

// Wait for API command
Cypress.Commands.add('waitForApi', (alias: string) => {
  cy.wait(`@${alias}`);
});

export {};
