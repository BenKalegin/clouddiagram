/// <reference types="cypress" />

describe('Diagram Creation and Management', () => {
  beforeEach(() => {
    // Visit the application before each test
    cy.visit('/');
    // Wait for the application to load
    cy.contains('Cloud Diagram', { timeout: 10000 });
  });

  it('should create a new class diagram', () => {
    // Click the add button
    cy.get('[data-testid="add-diagram-button"]')
      .should('be.visible')
      .should('not.be.disabled');

    // Select Class Diagram from the menu
    cy.get('[data-testid="add-class-diagram"]')
        .should('be.visible')
        .should('not.be.disabled')
        .click();

    // Verify that a new tab is created
    cy.get('.MuiTabs-flexContainer').should('contain', 'Class Diagram');

    // Verify that the diagram editor is displayed
    cy.get('.konvajs-content').should('be.visible');
  });

  it('should create a new deployment diagram', () => {
    // Click the add button
    cy.get('button').contains('Add').click();
    // Select Deployment Diagram from the menu
    cy.get('.MuiMenu-list').contains('Deployment Diagram').click();

    // Verify that a new tab is created
    cy.get('.MuiTabs-flexContainer').should('contain', 'Deployment Diagram');

    // Verify that the diagram editor is displayed
    cy.get('.konvajs-content').should('be.visible');
  });

  it('should create a new sequence diagram', () => {
    // Click the add button
    cy.get('button').contains('Add').click();
    // Select Sequence Diagram from the menu
    cy.get('.MuiMenu-list').contains('Sequence Diagram').click();

    // Verify that a new tab is created
    cy.get('.MuiTabs-flexContainer').should('contain', 'Sequence Diagram');

    // Verify that the diagram editor is displayed
    cy.get('.konvajs-content').should('be.visible');
  });

  it('should switch between diagram tabs', () => {
    // Create a class diagram
    cy.get('button').contains('Add').click();
    cy.get('.MuiMenu-list').contains('Class Diagram').click();

    // Create a deployment diagram
    cy.get('button').contains('Add').click();
    cy.get('.MuiMenu-list').contains('Deployment Diagram').click();

    // Switch to the class diagram tab
    cy.get('.MuiTabs-flexContainer').contains('Class Diagram').click();

    // Verify that the class diagram is displayed
    cy.get('.konvajs-content').should('be.visible');

    // Switch to the deployment diagram tab
    cy.get('.MuiTabs-flexContainer').contains('Deployment Diagram').click();

    // Verify that the deployment diagram is displayed
    cy.get('.konvajs-content').should('be.visible');
  });
});
