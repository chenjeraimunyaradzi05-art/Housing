describe('Tax & Accounting', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should load the tax dashboard', () => {
    cy.visit('/dashboard/tax');
    cy.contains('Tax & Accounting').should('be.visible');
  });

  it('should display overview with summary cards', () => {
    cy.visit('/dashboard/tax');
    cy.contains('Total Deductions').should('be.visible');
    cy.contains('Invoice Revenue').should('be.visible');
    cy.contains('Quarterly Payment Deadlines').should('be.visible');
  });

  it('should switch to deductions tab and show items', () => {
    cy.visit('/dashboard/tax');
    cy.contains('Deductions').click();
    cy.contains('Tax Deductions').should('be.visible');
    cy.contains('Mortgage Interest').should('be.visible');
  });

  it('should add a new deduction', () => {
    cy.visit('/dashboard/tax');
    cy.contains('Deductions').click();
    cy.contains('+ Add Deduction').click();
    cy.contains('New Deduction').should('be.visible');
    cy.get('input[placeholder="Description"]').type('Test deduction');
    cy.get('input[placeholder="Amount ($)"]').type('500');
    cy.contains('Save Deduction').click();
    cy.contains('Test deduction').should('be.visible');
  });

  it('should display invoices table', () => {
    cy.visit('/dashboard/tax');
    cy.contains('Invoices').click();
    cy.contains('INV-001').should('be.visible');
  });

  it('should create a new invoice', () => {
    cy.visit('/dashboard/tax');
    cy.contains('Invoices').click();
    cy.contains('+ Create Invoice').click();
    cy.get('input[placeholder="Client Name"]').type('Test Client');
    cy.get('input[placeholder="Total Amount ($)"]').type('1000');
    cy.contains('Create Invoice').click();
    cy.contains('Test Client').should('be.visible');
  });

  it('should display tax estimation calculator', () => {
    cy.visit('/dashboard/tax');
    cy.contains('Tax Estimates').click();
    cy.contains('Tax Estimation Calculator').should('be.visible');
    cy.contains('Calculate Tax Estimate').should('be.visible');
  });

  it('should display reports tab', () => {
    cy.visit('/dashboard/tax');
    cy.contains('Reports').click();
    cy.contains('Tax Reports & Documents').should('be.visible');
    cy.contains('Annual Tax Summary').should('be.visible');
    cy.contains('K-1 Statements').should('be.visible');
  });
});
