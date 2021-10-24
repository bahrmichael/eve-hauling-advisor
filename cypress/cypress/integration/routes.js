describe('Route Calculation', () => {
    it('Finds highsec route', () => {
        cy.visit('https://young-bird-6gerc.cloud.serverless.com/')

        cy.get('[data-cy=origin-input]').type('Jita');
        cy.get('[data-cy=destination-input]').type('Ashab');

        cy.get('[data-cy=contingent-highsec-yes]', {timeout: 60_000}).contains('Yes');

        cy.get('[data-cy=volume-input]').type('100000');
        cy.get('[data-cy=collateral-input]').type('1000000000');
        cy.get('[data-cy=calculate-button]').click();

        cy.get('[data-cy=result-table]', {timeout: 60_000}).contains('Red Frog Freight');
    });

    it('Finds lowsec route', () => {
        cy.visit('https://young-bird-6gerc.cloud.serverless.com/')

        cy.get('[data-cy=origin-input]').type('Jita');
        cy.get('[data-cy=destination-input]').type('Chidah');

        cy.get('[data-cy=contingent-highsec-no]', {timeout: 60_000}).contains('No');

        cy.get('[data-cy=volume-input]').type('10000');
        cy.get('[data-cy=collateral-input]').type('1000000000');
        cy.get('[data-cy=calculate-button]').click();

        cy.get('[data-cy=result-table]', {timeout: 60_000}).contains('Push Industries');
    });
})