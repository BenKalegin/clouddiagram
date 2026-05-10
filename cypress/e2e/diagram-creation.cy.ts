/// <reference types="cypress" />

describe('Diagram Creation and Management', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.contains('Cloud Diagram', { timeout: 10000 });
  });

  const createDiagram = (label: string) => {
    cy.get('.add-tab-trigger').click();
    cy.contains('[role="menuitem"]', label).click();
  };

  it('should create a new class diagram', () => {
    createDiagram('Class Diagram');
    cy.get('[role="tablist"]').should('contain', 'Class Diagram');
    cy.get('.konvajs-content').should('be.visible');
  });

  it('should create a new deployment diagram', () => {
    createDiagram('Deployment Diagram');
    cy.get('[role="tablist"]').should('contain', 'Deployment Diagram');
    cy.get('.konvajs-content').should('be.visible');
  });

  it('should create a new sequence diagram', () => {
    createDiagram('Sequence Diagram');
    cy.get('[role="tablist"]').should('contain', 'Sequence Diagram');
    cy.get('.konvajs-content').should('be.visible');
  });

  it('should switch between diagram tabs', () => {
    createDiagram('Class Diagram');
    createDiagram('Deployment Diagram');

    cy.contains('[role="tab"]', 'Class Diagram').click();
    cy.get('.konvajs-content').should('be.visible');

    cy.contains('[role="tab"]', 'Deployment Diagram').click();
    cy.get('.konvajs-content').should('be.visible');
  });
});
