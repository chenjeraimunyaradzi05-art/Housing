/**
 * Authentication E2E Tests
 */

describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Login Page', () => {
    it('should display login form', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should show validation errors for empty fields', () => {
      cy.visit('/login');
      cy.get('button[type="submit"]').click();
      cy.contains('Email is required').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type('invalid@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      cy.contains(/invalid|incorrect|error/i).should('be.visible');
    });

    it('should redirect to dashboard after successful login', () => {
      cy.intercept('POST', '**/api/auth/login').as('loginRequest');

      cy.visit('/login');
      cy.get('input[name="email"]').type(Cypress.env('testUserEmail'));
      cy.get('input[name="password"]').type(Cypress.env('testUserPassword'));
      cy.get('button[type="submit"]').click();

      cy.wait('@loginRequest');
      cy.url().should('include', '/dashboard');
    });

    it('should have link to registration page', () => {
      cy.visit('/login');
      cy.contains(/sign up|register|create account/i).click();
      cy.url().should('include', '/register');
    });

    it('should have forgot password link', () => {
      cy.visit('/login');
      cy.contains(/forgot|reset/i).should('be.visible');
    });
  });

  describe('Registration Page', () => {
    it('should display registration form', () => {
      cy.visit('/register');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('input[name="firstName"]').should('be.visible');
      cy.get('input[name="lastName"]').should('be.visible');
    });

    it('should validate password requirements', () => {
      cy.visit('/register');
      cy.get('input[name="password"]').type('weak');
      cy.get('button[type="submit"]').click();
      cy.contains(/password|characters|strong/i).should('be.visible');
    });

    it('should validate email format', () => {
      cy.visit('/register');
      cy.get('input[name="email"]').type('notanemail');
      cy.get('button[type="submit"]').click();
      cy.contains(/valid email/i).should('be.visible');
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should logout successfully', () => {
      cy.visit('/dashboard');
      cy.getByTestId('user-menu').click();
      cy.contains(/logout|sign out/i).click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });

    it('should clear auth token on logout', () => {
      cy.visit('/dashboard');
      cy.getByTestId('user-menu').click();
      cy.contains(/logout|sign out/i).click();
      cy.window().then((win) => {
        expect(win.localStorage.getItem('auth_token')).to.be.null;
      });
    });
  });
});
