describe('Numeric Inputs', () => {
    describe("Natural number", () => {
        it('Volume', () => {
            cy.visit('https://young-bird-6gerc.cloud.serverless.com/')

            cy.get('[data-cy=volume-input]').type('10000');
            cy.get('[data-cy=volume-input]').should('have.value', '10,000');
        });

        it('Collateral', () => {
            cy.visit('https://young-bird-6gerc.cloud.serverless.com/')

            cy.get('[data-cy=collateral-input]').type('10000');
            cy.get('[data-cy=collateral-input]').should('have.value', '10,000');
        });
    });

    describe("Numbers with separators", () => {
        it('Volume', () => {
            cy.visit('https://young-bird-6gerc.cloud.serverless.com/')

            cy.get('[data-cy=volume-input]').type('10,000');
            cy.get('[data-cy=volume-input]').should('have.value', '10,000');
        });

        it('Collateral', () => {
            cy.visit('https://young-bird-6gerc.cloud.serverless.com/')

            cy.get('[data-cy=collateral-input]').type('10,000');
            cy.get('[data-cy=collateral-input]').should('have.value', '10,000');
        });
    });

    describe("Numbers with decimals", () => {
        it('Volume', () => {
            cy.visit('https://young-bird-6gerc.cloud.serverless.com/')

            cy.get('[data-cy=volume-input]').type('10,000.5');
            cy.get('[data-cy=volume-input]').should('have.value', '10,000.5');
        });

        it('Collateral', () => {
            cy.visit('https://young-bird-6gerc.cloud.serverless.com/')

            cy.get('[data-cy=collateral-input]').type('10,000.5');
            cy.get('[data-cy=collateral-input]').should('have.value', '10,000.5');
        });
    });
})