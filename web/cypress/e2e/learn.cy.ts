describe('Learn & Grow (Content Streaming)', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should load the learn page', () => {
    cy.visit('/dashboard/learn');
    cy.contains('Learn & Grow').should('be.visible');
  });

  it('should display content cards in browse tab', () => {
    cy.visit('/dashboard/learn');
    cy.contains('Real Estate Investing 101').should('be.visible');
    cy.contains('Understanding Mortgage Rates').should('be.visible');
  });

  it('should filter content by type', () => {
    cy.visit('/dashboard/learn');
    cy.get('select').first().select('video');
    cy.contains('Real Estate Investing 101').should('be.visible');
  });

  it('should filter content by difficulty', () => {
    cy.visit('/dashboard/learn');
    cy.get('select').last().select('advanced');
    cy.contains('Tax Strategies').should('be.visible');
  });

  it('should search content', () => {
    cy.visit('/dashboard/learn');
    cy.get('input[placeholder*="Search content"]').type('mortgage');
    cy.contains('Understanding Mortgage Rates').should('be.visible');
  });

  it('should display courses tab', () => {
    cy.visit('/dashboard/learn');
    cy.contains('Courses').click();
    cy.contains('Learning Paths & Courses').should('be.visible');
    cy.contains('Real Estate Investing Masterclass').should('be.visible');
  });

  it('should display live events tab', () => {
    cy.visit('/dashboard/learn');
    cy.contains('Live & Upcoming').click();
    cy.contains('Live Events & Webinars').should('be.visible');
  });

  it('should display my library tab', () => {
    cy.visit('/dashboard/learn');
    cy.contains('My Library').click();
    cy.contains('No items in your library').should('be.visible');
    cy.contains('Browse Content').should('be.visible');
  });
});
