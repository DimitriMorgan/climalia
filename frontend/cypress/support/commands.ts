/// <reference types="cypress" />

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      loginUi(email: string, password: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('loginUi', (email: string, password: string): void => {
  cy.visit('/espace-pro/login');
  cy.get('input#email').type(email);
  cy.get('input#password').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/espace-pro/dashboard');
});

export {};
