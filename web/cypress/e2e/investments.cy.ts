/**
 * Investment E2E Tests
 */

describe('Investments', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Investment Pools Listing', () => {
    beforeEach(() => {
      cy.visit('/investments');
    });

    it('should display available investment pools', () => {
      cy.getByTestId('investment-pools-list').should('be.visible');
    });

    it('should filter pools by property type', () => {
      cy.getByTestId('filter-property-type').click();
      cy.contains('Multi-Family').click();
      cy.getByTestId('investment-pools-list').children().should('have.length.at.least', 0);
    });

    it('should filter pools by minimum investment', () => {
      cy.getByTestId('filter-min-investment').type('500');
      cy.getByTestId('apply-filters').click();
    });

    it('should sort pools by expected return', () => {
      cy.getByTestId('sort-by').click();
      cy.contains('Expected Return').click();
    });

    it('should display pool details on card', () => {
      cy.getByTestId('pool-card').first().within(() => {
        cy.contains(/expected return/i).should('be.visible');
        cy.contains(/minimum/i).should('be.visible');
        cy.contains(/funded/i).should('be.visible');
      });
    });
  });

  describe('Investment Pool Details', () => {
    beforeEach(() => {
      cy.visit('/investments');
      cy.getByTestId('pool-card').first().click();
    });

    it('should display pool details page', () => {
      cy.getByTestId('pool-details').should('be.visible');
    });

    it('should display property information', () => {
      cy.contains(/property|location/i).should('be.visible');
    });

    it('should display financial projections', () => {
      cy.contains(/projection|return|yield/i).should('be.visible');
    });

    it('should display risk assessment', () => {
      cy.contains(/risk/i).should('be.visible');
    });

    it('should have invest button', () => {
      cy.getByTestId('invest-button').should('be.visible');
    });
  });

  describe('Making an Investment', () => {
    beforeEach(() => {
      cy.visit('/investments');
      cy.getByTestId('pool-card').first().click();
      cy.getByTestId('invest-button').click();
    });

    it('should open investment modal', () => {
      cy.getByTestId('investment-modal').should('be.visible');
    });

    it('should validate minimum investment amount', () => {
      cy.getByTestId('investment-amount').clear().type('1');
      cy.getByTestId('confirm-investment').click();
      cy.contains(/minimum/i).should('be.visible');
    });

    it('should show investment summary before confirmation', () => {
      cy.getByTestId('investment-amount').clear().type('1000');
      cy.contains(/summary|review/i).should('be.visible');
    });

    it('should require terms acceptance', () => {
      cy.getByTestId('investment-amount').clear().type('1000');
      cy.getByTestId('confirm-investment').click();
      cy.contains(/terms|agree/i).should('be.visible');
    });
  });

  describe('My Investments', () => {
    beforeEach(() => {
      cy.visit('/investments/my-investments');
    });

    it('should display user investments', () => {
      cy.getByTestId('my-investments-list').should('be.visible');
    });

    it('should display investment performance', () => {
      cy.contains(/performance|return/i).should('be.visible');
    });

    it('should allow viewing investment details', () => {
      cy.getByTestId('investment-item').first().click();
      cy.getByTestId('investment-details').should('be.visible');
    });
  });
});
