describe('Numeric Inputs', () => {
    describe("Natural number", () => {
        it('Volume', () => {
            cy.visit('');

            cy.get('[data-cy=volume-input]').type('10000');
            cy.get('[data-cy=volume-input]').should('have.value', '10,000');
        });

        it('Collateral', () => {
            cy.visit('');

            cy.get('[data-cy=collateral-input]').type('10000');
            cy.get('[data-cy=collateral-input]').should('have.value', '10,000');
        });
    });

    describe('Letters', function () {
        it('should not allow characters for volume', () => {
            cy.visit('');

            cy.get('[data-cy=volume-input]').type('10m');
            cy.get('[data-cy=volume-input]').should('have.value', '10');
        });

        it('should not allow characters for collateral', () => {
            cy.visit('');

            cy.get('[data-cy=collateral-input]').type('10b');
            cy.get('[data-cy=collateral-input]').should('have.value', '10');
        });
    });

    describe("Numbers with separators", () => {
        it('Volume', () => {
            cy.visit('');

            cy.get('[data-cy=volume-input]').type('10,000');
            cy.get('[data-cy=volume-input]').should('have.value', '10,000');
        });

        it('Collateral', () => {
            cy.visit('');

            cy.get('[data-cy=collateral-input]').type('10,000');
            cy.get('[data-cy=collateral-input]').should('have.value', '10,000');
        });
    });

    describe("Numbers with decimals", () => {
        it('Volume', () => {
            cy.visit('');

            cy.get('[data-cy=volume-input]').type('10,000.5');
            cy.get('[data-cy=volume-input]').should('have.value', '10,000.5');
        });

        it('Collateral', () => {
            cy.visit('');

            cy.get('[data-cy=collateral-input]').type('10,000.5');
            cy.get('[data-cy=collateral-input]').should('have.value', '10,000.5');
        });
    });
})