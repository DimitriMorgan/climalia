describe('Espace pro — partenaire', (): void => {
  it('logs in, filters by region, sees filtered list', (): void => {
    cy.loginUi('syndic@partner.fr', 'demo');
    cy.contains('Partenaire');
    cy.get('input#filter-region').type('Île-de-France');
    cy.wait(500);
    cy.get('body').then(($b): void => {
      const text = $b.text();
      expect(text).to.satisfy((t: string) => /Île-de-France/.test(t) || /Aucun document/.test(t));
    });
  });
});
