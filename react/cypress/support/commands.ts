// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Declare the custom commands on the Cypress namespace
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to create a new diagram
       * @param diagramType - The type of diagram to create
       * @example cy.createNewDiagram('Class Diagram')
       */
      createNewDiagram(diagramType: string): Chainable<Element>;

      /**
       * Custom command to add an element to the diagram
       * @param elementType - The type of element to add
       * @example cy.addElementToDiagram('Class')
       */
      addElementToDiagram(elementType: string): Chainable<Element>;

      /**
       * Custom command to connect two elements
       * @param sourceSelector - The selector for the source element
       * @param targetSelector - The selector for the target element
       * @example cy.connectElements('.source-element', '.target-element')
       */
      connectElements(sourceSelector: string, targetSelector: string): Chainable<Element>;
    }
  }
}

// Custom command to create a new diagram
Cypress.Commands.add('createNewDiagram', (diagramType: string) => {
  cy.get('button').contains('Add').click();
  cy.get('.MuiMenu-list').contains(diagramType).click();
});

// Custom command to add an element to the diagram
Cypress.Commands.add('addElementToDiagram', (elementType: string) => {
  cy.get('.Toolbox').contains(elementType).click();
  cy.get('.konvajs-content').click(300, 300); // Click in the middle of the canvas
});

// Custom command to connect two elements
Cypress.Commands.add('connectElements', (sourceSelector: string, targetSelector: string) => {
  cy.get(sourceSelector).click();
  cy.get('.konvajs-content').trigger('mousedown', { button: 0 });
  cy.get(targetSelector).trigger('mousemove').trigger('mouseup');
});

// This ensures the file is treated as a module
export {};
