describe('AI Dashboard', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should load the AI dashboard page', () => {
    cy.visit('/dashboard/ai');
    cy.contains('AI Assistant').should('be.visible');
  });

  it('should display all tabs', () => {
    cy.visit('/dashboard/ai');
    cy.contains('Financial Insights').should('be.visible');
    cy.contains('Market Analysis').should('be.visible');
    cy.contains('Recommendations').should('be.visible');
    cy.contains('Property Valuation').should('be.visible');
  });

  it('should switch between tabs', () => {
    cy.visit('/dashboard/ai');
    cy.contains('Market Analysis').click();
    cy.contains('Market Overview').should('be.visible');

    cy.contains('Recommendations').click();
    cy.contains('Investment Recommendations').should('be.visible');

    cy.contains('Property Valuation').click();
    cy.contains('Enter Property Details').should('be.visible');
  });

  it('should run property valuation', () => {
    cy.visit('/dashboard/ai');
    cy.contains('Property Valuation').click();

    cy.get('input[type="number"]').first().clear().type('3');
    cy.contains('Get AI Valuation').click();

    // Should show result or loading state
    cy.contains(/Analyzing|Valuation Result|Estimated Value/i).should('be.visible');
  });
});
