describe('Multipliers', () => {
    it('Volume x thousand', () => {
        cy.visit('');

        cy.get('[data-cy=volume-input]').type('10');
        cy.get('[data-cy=volume-thousand]').click();
        cy.get('[data-cy=volume-input]').should('have.value', '10,000');
    });

    it('Volume x million', () => {
        cy.visit('');

        cy.get('[data-cy=volume-input]').type('1');
        cy.get('[data-cy=volume-million]').click();
        cy.get('[data-cy=volume-input]').should('have.value', '1,000,000');
    });

    it('Collateral x million', () => {
        cy.visit('');

        cy.get('[data-cy=collateral-input]').type('300');
        cy.get('[data-cy=collateral-million]').click();
        cy.get('[data-cy=collateral-input]').should('have.value', '300,000,000');
    });

    it('Collateral x billion', () => {
        cy.visit('');

        cy.get('[data-cy=collateral-input]').type('4');
        cy.get('[data-cy=collateral-billion]').click();
        cy.get('[data-cy=collateral-input]').should('have.value', '4,000,000,000');
    });
})