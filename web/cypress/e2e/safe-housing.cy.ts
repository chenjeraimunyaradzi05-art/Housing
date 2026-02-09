describe('Safe Housing Module', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should load the safe housing page', () => {
    cy.visit('/dashboard/safe-housing');
    cy.contains('Safe Housing & Support').should('be.visible');
  });

  it('should display the emergency banner', () => {
    cy.visit('/dashboard/safe-housing');
    cy.contains('If you are in immediate danger, call 911').should('be.visible');
    cy.contains('1-800-799-7233').should('be.visible');
  });

  it('should display crisis help tab content', () => {
    cy.visit('/dashboard/safe-housing');
    cy.contains('Crisis Help').click();
    cy.contains('Immediate Help').should('be.visible');
    cy.contains('National DV Hotline').should('be.visible');
    cy.contains('Safety Tips').should('be.visible');
  });

  it('should display safe housing directory', () => {
    cy.visit('/dashboard/safe-housing');
    cy.contains('Safe Housing').click();
    cy.get('input[placeholder*="Search by city"]').should('be.visible');
  });

  it('should filter housing listings by type', () => {
    cy.visit('/dashboard/safe-housing');
    cy.contains('Safe Housing').click();
    cy.get('select').first().select('shelter');
  });

  it('should display resources tab', () => {
    cy.visit('/dashboard/safe-housing');
    cy.contains('Resources').click();
    cy.contains('National Domestic Violence Hotline').should('be.visible');
  });

  it('should display safety plan form', () => {
    cy.visit('/dashboard/safe-housing');
    cy.contains('Safety Plan').click();
    cy.contains('My Safety Plan').should('be.visible');
    cy.contains('Emergency Contacts').should('be.visible');
    cy.contains('Safe Locations').should('be.visible');
    cy.contains('Financial Independence Steps').should('be.visible');
  });
});
