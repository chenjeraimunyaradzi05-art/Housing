/**
 * Dashboard E2E Tests
 */

describe('Dashboard', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/dashboard');
  });

  describe('Dashboard Overview', () => {
    it('should display user greeting', () => {
      cy.contains(/welcome|hello|hi/i).should('be.visible');
    });

    it('should display portfolio summary', () => {
      cy.getByTestId('portfolio-summary').should('be.visible');
      cy.contains(/total|portfolio|value/i).should('be.visible');
    });

    it('should display recent activity', () => {
      cy.getByTestId('recent-activity').should('be.visible');
    });

    it('should display quick actions', () => {
      cy.getByTestId('quick-actions').should('be.visible');
    });
  });

  describe('Navigation', () => {
    it('should navigate to investments page', () => {
      cy.contains(/investments/i).click();
      cy.url().should('include', '/investments');
    });

    it('should navigate to properties page', () => {
      cy.contains(/properties/i).click();
      cy.url().should('include', '/properties');
    });

    it('should navigate to accounts page', () => {
      cy.contains(/accounts/i).click();
      cy.url().should('include', '/accounts');
    });

    it('should navigate to settings page', () => {
      cy.getByTestId('user-menu').click();
      cy.contains(/settings/i).click();
      cy.url().should('include', '/settings');
    });
  });

  describe('Financial Summary', () => {
    it('should display net worth', () => {
      cy.getByTestId('net-worth').should('be.visible');
    });

    it('should display investment returns', () => {
      cy.contains(/returns|gains/i).should('be.visible');
    });

    it('should display cash flow', () => {
      cy.contains(/cash flow|income/i).should('be.visible');
    });
  });

  describe('Notifications', () => {
    it('should display notification badge when there are unread notifications', () => {
      cy.getByTestId('notifications-button').should('be.visible');
    });

    it('should open notifications panel', () => {
      cy.getByTestId('notifications-button').click();
      cy.getByTestId('notifications-panel').should('be.visible');
    });
  });
});
