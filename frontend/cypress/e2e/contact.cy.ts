describe('Contact form', (): void => {
  it('submits a valid contact request and shows success', (): void => {
    cy.visit('/contact');
    cy.get('#fullName').type('Cypress User');
    cy.get('#email').type(`cypress+${Date.now().toString()}@example.com`);
    cy.get('#phone').type('0612345678');
    cy.get('#postalCode').type('75011');
    cy.get('#projectType').select('INSTALLATION_AC');
    cy.get('#message').type('Demande automatique générée par Cypress.');
    cy.get('button[type="submit"]').click();
    cy.get('[role="status"]').should('contain.text', 'envoyée');
  });
});
