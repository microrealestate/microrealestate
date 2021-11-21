// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
Cypress.Commands.add('resetAppData', (baseUrl) => {
  cy.request('DELETE', `${baseUrl}/api/reset`);
});

Cypress.Commands.add('signin', (email, password) => {
  cy.get('input[name=email]').type(email);
  cy.get('input[name=password]').type(password);
  cy.get('[data-cy=submit]').click();
});

Cypress.Commands.add('signout', () => {
  cy.get('[data-cy=signout]').click();
});

Cypress.Commands.add('registerUSer', (firstName, lastName, email, password) => {
  cy.get('input[name=firstName]').type(firstName);
  cy.get('input[name=lastName]').type(lastName);
  cy.get('input[name=email]').type(email);
  cy.get('input[name=password]').type(password);
  cy.get('[data-cy=submit]').click();
});

Cypress.Commands.add('navToPage', (pageName) => {
  cy.get(`[data-cy=${pageName}Nav]`).click();
});

Cypress.Commands.add('muiSelect', (selector, value) => {
  cy.get(selector).parent().click();
  cy.get('.MuiList-root').contains(value).click();
});

Cypress.Commands.add('checkUrl', (url) => {
  cy.url({ timeout: 8000 }).should('include', url);
});
