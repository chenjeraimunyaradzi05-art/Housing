/**
 * Accessibility E2E Tests
 */

describe('Accessibility', () => {
  beforeEach(() => {
    cy.injectAxe();
  });

  describe('Home Page', () => {
    it('should have no accessibility violations', () => {
      cy.visit('/');
      cy.checkA11y();
    });

    it('should have proper heading hierarchy', () => {
      cy.visit('/');
      cy.get('h1').should('have.length', 1);
    });

    it('should have alt text on all images', () => {
      cy.visit('/');
      cy.get('img').each(($img) => {
        expect($img).to.have.attr('alt');
      });
    });
  });

  describe('Login Page', () => {
    it('should have no accessibility violations', () => {
      cy.visit('/login');
      cy.checkA11y();
    });

    it('should have proper form labels', () => {
      cy.visit('/login');
      cy.get('input').each(($input) => {
        const id = $input.attr('id');
        if (id) {
          cy.get(`label[for="${id}"]`).should('exist');
        }
      });
    });

    it('should be keyboard navigable', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').focus().type('{tab}');
      cy.focused().should('have.attr', 'name', 'password');
    });
  });

  describe('Dashboard', () => {
    beforeEach(() => {
      cy.login();
      cy.visit('/dashboard');
    });

    it('should have no accessibility violations', () => {
      cy.checkA11y();
    });

    it('should have skip navigation link', () => {
      cy.get('a[href="#main-content"]').should('exist');
    });

    it('should have proper ARIA landmarks', () => {
      cy.get('nav').should('exist');
      cy.get('main').should('exist');
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient color contrast on home page', () => {
      cy.visit('/');
      cy.checkA11y(null, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      cy.login();
      cy.visit('/dashboard');
    });

    it('should be able to navigate with keyboard', () => {
      cy.get('body').tab();
      cy.focused().should('be.visible');
    });

    it('should have visible focus indicators', () => {
      cy.get('a').first().focus();
      cy.focused().should('have.css', 'outline').and('not.eq', 'none');
    });

    it('should trap focus in modals', () => {
      cy.getByTestId('open-modal-button').click();
      cy.getByTestId('modal').should('be.visible');
      cy.focused().tab().tab().tab().tab();
      cy.focused().closest('[role="dialog"]').should('exist');
    });
  });

  describe('Screen Reader', () => {
    it('should have proper ARIA labels on interactive elements', () => {
      cy.login();
      cy.visit('/dashboard');

      cy.get('button').each(($button) => {
        const hasAccessibleName =
          $button.attr('aria-label') ||
          $button.attr('aria-labelledby') ||
          $button.text().trim().length > 0;
        expect(hasAccessibleName).to.be.true;
      });
    });

    it('should announce loading states', () => {
      cy.visit('/');
      cy.get('[aria-busy="true"]').should('have.attr', 'aria-live');
    });
  });
});

// Note: You'll need to install cypress-axe for this to work:
// npm install --save-dev cypress-axe axe-core
// And add to cypress/support/e2e.ts:
// import 'cypress-axe';
