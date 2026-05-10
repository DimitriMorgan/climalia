describe('Protected route', (): void => {
  it('redirects to login when no token', (): void => {
    cy.visit('/espace-pro/dashboard');
    cy.url().should('include', '/espace-pro/login');
  });
});
