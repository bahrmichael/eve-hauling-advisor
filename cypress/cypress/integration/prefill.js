describe('Prefilled URL', () => {
    it('With All Parameters', () => {
        cy.visit('');

        cy.get('[data-cy=origin-input]').should('have.value', 'Amarr');
        cy.get('[data-cy=destination-input]').should('have.value', 'Jita');
        cy.get('[data-cy=volume-input]').should('have.value', '10,000');
        cy.get('[data-cy=collateral-input]').should('have.value', '500,000,000');

        cy.get('[data-cy=contingent-highsec-yes]', {timeout: 60_000}).contains('Yes');
        cy.get('[data-cy=calculate-button]').click();
        cy.get('[data-cy=result-table]', {timeout: 60_000}).contains('Red Frog Freight');
    });

    it('With Partial Parameters', () => {
        cy.visit('');

        cy.get('[data-cy=origin-input]').should('have.value', 'Amarr');
        cy.get('[data-cy=destination-input]').should('have.value', 'Jita');

        cy.get('[data-cy=contingent-highsec-yes]', {timeout: 60_000}).contains('Yes');
    });
})