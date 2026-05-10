/// <reference types="cypress" />

describe('Diagram Editing', () => {
  beforeEach(() => {
    // Visit the application before each test
    cy.visit('/');
    // Wait for the application to load
    cy.contains('Cloud Diagram', { timeout: 10000 });

    // Create a new class diagram for testing
    cy.get('button').contains('Add').click();
    cy.get('.MuiMenu-list').contains('Class Diagram').click();
  });

  it('should add elements to a class diagram', () => {
    // Find and click on a class element in the toolbox
    cy.get('.Toolbox').contains('Class').click();

    // Click on the canvas to add the element
    cy.get('.konvajs-content').click(300, 300);

    // Verify that the element is added to the diagram
    // This is a bit tricky since Konva elements don't have easily accessible DOM elements
    // We'll check if the properties editor shows up, which indicates an element is selected
    cy.get('.konvajs-content').click(300, 300);

    // Open the properties drawer if it's not already open
    cy.get('button[aria-label="open drawer"]').click();

    // Verify that the properties editor contains the element type
    cy.get('.MuiDrawer-paper').should('contain', 'Class');
  });

  it('should edit element properties', () => {
    // Add a class element to the diagram
    cy.get('.Toolbox').contains('Class').click();
    cy.get('.konvajs-content').click(300, 300);

    // Select the element
    cy.get('.konvajs-content').click(300, 300);

    // Open the properties drawer if it's not already open
    cy.get('button[aria-label="open drawer"]').click();

    // Find the name input field and change the name
    cy.get('.MuiDrawer-paper').find('input[type="text"]').first().clear().type('TestClass');

    // Click somewhere else to trigger the save
    cy.get('.konvajs-content').click(400, 400);

    // Select the element again
    cy.get('.konvajs-content').click(300, 300);

    // Verify that the name has been updated
    cy.get('.MuiDrawer-paper').find('input[type="text"]').first().should('have.value', 'TestClass');
  });

  it('should connect elements with links', () => {
    // Add two class elements to the diagram
    cy.get('.Toolbox').contains('Class').click();
    cy.get('.konvajs-content').click(200, 200);

    cy.get('.Toolbox').contains('Class').click();
    cy.get('.konvajs-content').click(400, 200);

    // Select the first element
    cy.get('.konvajs-content').click(200, 200);

    // Find and click on a link element in the toolbox
    cy.get('.Toolbox').contains('Association').click();

    // Click on the second element to create the link
    cy.get('.konvajs-content').click(400, 200);

    // Verify that the link is created
    // This is difficult to verify directly, so we'll check if the properties editor shows link properties
    cy.get('.konvajs-content').click(300, 200); // Click on the link (approximately in the middle)

    // Open the properties drawer if it's not already open
    cy.get('button[aria-label="open drawer"]').click();

    // Verify that the properties editor contains link properties
    cy.get('.MuiDrawer-paper').should('contain', 'Association');
  });

  it('should delete elements', () => {
    // Add a class element to the diagram
    cy.get('.Toolbox').contains('Class').click();
    cy.get('.konvajs-content').click(300, 300);

    // Select the element
    cy.get('.konvajs-content').click(300, 300);

    // Press delete key to delete the element
    cy.get('body').type('{del}');

    // Verify that the element is deleted
    // We'll click where the element was and check that the properties editor doesn't show up
    cy.get('.konvajs-content').click(300, 300);

    // Open the properties drawer if it's not already open
    cy.get('button[aria-label="open drawer"]').click();

    // Verify that the properties editor doesn't contain the element type
    cy.get('.MuiDrawer-paper').should('not.contain', 'Class');
  });
});
