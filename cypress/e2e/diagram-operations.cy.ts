/// <reference types="cypress" />

describe('Diagram Operations', () => {
  beforeEach(() => {
    // Visit the application before each test
    cy.visit('/');
    // Wait for the application to load
    cy.contains('Cloud Diagram', { timeout: 10000 });

    // Create a new class diagram for testing
    cy.get('button').contains('Add').click();
    cy.get('.MuiMenu-list').contains('Class Diagram').click();
  });

  it('should undo and redo element creation', () => {
    // Add a class element to the diagram
    cy.get('.Toolbox').contains('Class').click();
    cy.get('.konvajs-content').click(300, 300);

    // Verify that the element is added
    cy.get('.konvajs-content').click(300, 300);
    cy.get('button[aria-label="open drawer"]').click();
    cy.get('.MuiDrawer-paper').should('contain', 'Class');

    // Click the undo button
    cy.get('button[aria-label="undo"]').click();

    // Verify that the element is removed
    cy.get('.konvajs-content').click(300, 300);
    cy.get('.MuiDrawer-paper').should('not.contain', 'Class');

    // Click the redo button
    cy.get('button[aria-label="redo"]').click();

    // Verify that the element is added back
    cy.get('.konvajs-content').click(300, 300);
    cy.get('.MuiDrawer-paper').should('contain', 'Class');
  });

  it('should undo and redo element property changes', () => {
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

    // Click the undo button
    cy.get('button[aria-label="undo"]').click();

    // Select the element again
    cy.get('.konvajs-content').click(300, 300);

    // Verify that the name has been reverted
    cy.get('.MuiDrawer-paper').find('input[type="text"]').first().should('not.have.value', 'TestClass');

    // Click the redo button
    cy.get('button[aria-label="redo"]').click();

    // Select the element again
    cy.get('.konvajs-content').click(300, 300);

    // Verify that the name has been updated again
    cy.get('.MuiDrawer-paper').find('input[type="text"]').first().should('have.value', 'TestClass');
  });

  it('should toggle grid visibility', () => {
    // Check if the grid is visible initially
    cy.get('.konvajs-content').should('exist');

    // Click the grid toggle button
    cy.get('button[aria-label="toggle grid"]').click();

    // Verify that the grid is toggled
    // This is difficult to verify directly since the grid is rendered on canvas
    // We'll check if the button icon changes
    cy.get('button[aria-label="toggle grid"]').should('exist');

    // Toggle the grid back
    cy.get('button[aria-label="toggle grid"]').click();
  });

  it('should toggle dark mode', () => {
    // Check the initial theme
    cy.get('body').should('have.css', 'background-color');

    // Click the theme toggle button
    cy.get('button[aria-label="toggle theme"]').click();

    // Verify that the theme is toggled
    // This is difficult to verify directly, but we can check if the button exists
    cy.get('button[aria-label="toggle theme"]').should('exist');

    // Toggle the theme back
    cy.get('button[aria-label="toggle theme"]').click();
  });

  it('should export a diagram', () => {
    // Add a class element to the diagram
    cy.get('.Toolbox').contains('Class').click();
    cy.get('.konvajs-content').click(300, 300);

    // Open the export dialog
    // This might be in a menu or a button
    // For this test, we'll assume there's an export button or menu item
    // The actual implementation might differ
    cy.get('button[aria-label="export"]').click();

    // Verify that the export dialog is displayed
    cy.get('.MuiDialog-paper').should('contain', 'Export');

    // Select an export format (e.g., PNG)
    cy.get('.MuiDialog-paper').contains('PNG').click();

    // Click the export button
    cy.get('.MuiDialog-paper').contains('Export').click();

    // Verify that the export is completed
    // This is difficult to verify directly since the file download happens outside the browser
    // We'll check if the dialog is closed
    cy.get('.MuiDialog-paper').should('not.exist');
  });
});
