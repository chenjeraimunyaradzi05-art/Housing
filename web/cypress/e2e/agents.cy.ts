describe('Agent & Partner Network', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should load the agents page', () => {
    cy.visit('/dashboard/agents');
    cy.contains('Agent & Partner Network').should('be.visible');
  });

  it('should display agent directory with cards', () => {
    cy.visit('/dashboard/agents');
    cy.contains('Agent Directory').click();
    cy.contains('Sarah Chen').should('be.visible');
    cy.contains('Maria Rodriguez').should('be.visible');
  });

  it('should filter agents by specialization', () => {
    cy.visit('/dashboard/agents');
    cy.get('select').first().select('commercial');
    cy.contains('Maria Rodriguez').should('be.visible');
  });

  it('should open contact form for an agent', () => {
    cy.visit('/dashboard/agents');
    cy.contains('Contact Agent').first().click();
    cy.get('input[placeholder="Your Name"]').should('be.visible');
    cy.get('textarea[placeholder*="Message"]').should('be.visible');
  });

  it('should display reviews tab', () => {
    cy.visit('/dashboard/agents');
    cy.contains('Reviews').click();
    cy.contains('Agent Reviews').should('be.visible');
  });

  it('should display partners tab', () => {
    cy.visit('/dashboard/agents');
    cy.contains('Partners').click();
    cy.contains('Partner Network').should('be.visible');
  });

  it('should display become an agent form', () => {
    cy.visit('/dashboard/agents');
    cy.contains('Become an Agent').click();
    cy.contains('Become a VÖR Agent').should('be.visible');
    cy.contains('Apply to Become an Agent').should('be.visible');
  });
});
