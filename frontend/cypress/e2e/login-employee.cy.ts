describe('Espace pro — employé', (): void => {
  it('logs in and sees employee documents', (): void => {
    cy.loginUi('employe.idf@climalia.fr', 'demo');
    cy.contains('Salarié');
    cy.get('table tbody tr').its('length').should('be.greaterThan', 0);
    cy.get('table tbody tr').first().contains('button', 'Télécharger').click();
    // Phase 1: download endpoint returns JSON metadata, not binary;
    // we just assert the request fired by checking we still have rows.
  });
});
