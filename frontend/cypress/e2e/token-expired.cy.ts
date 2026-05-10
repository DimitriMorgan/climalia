describe('Token expiration', (): void => {
  it('logs out automatically on 401', (): void => {
    cy.loginUi('employe.idf@climalia.fr', 'demo');
    // Force the next /api/documents call to 401
    cy.intercept('GET', '/api/documents*', {
      statusCode: 401,
      body: { message: 'Expired JWT Token' },
    }).as('expired');
    cy.reload();
    cy.wait('@expired');
    cy.url().should('include', '/espace-pro/login');
  });
});
