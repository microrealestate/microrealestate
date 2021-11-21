const APP_BASEURL = 'http://localhost:8080';

const firstName = 'John';
const lastName = 'Doe';
const email = 'jdoe@test.com';
const password = 'test1234';

describe('User access', () => {
  before(() => {
    cy.resetAppData(APP_BASEURL);
  });

  it('Incorrect email or password', () => {
    cy.visit(`${APP_BASEURL}/app/`);
    cy.signin('demo@demo.com', 'demo');
    cy.get('.MuiAlert-message').should(
      'have.text',
      'Incorrect email or password'
    );
  });

  it('Register a user', () => {
    cy.visit(`${APP_BASEURL}/app/signup`);
    cy.get('[data-cy=signin]').click();
    cy.get('[data-cy=signup]').click();
    cy.registerUSer(firstName, lastName, email, password);
    cy.url().should('include', '/app/signin');
  });

  it('User already registered', () => {
    cy.visit(`${APP_BASEURL}/app/signup`);
    cy.get('[data-cy=signin]').click();
    cy.get('[data-cy=signup]').click();
    cy.registerUSer(firstName, lastName, email, password);
    cy.url().should('include', '/app/signup');
    cy.get('.MuiAlert-message').should(
      'have.text',
      'This user is already registered'
    );
  });

  it('First access', () => {
    cy.visit(`${APP_BASEURL}/app/signin`);
    cy.signin(email, password);
    cy.contains('Welcome John Doe!');
    cy.url().should('include', '/app/firstaccess');
  });
});
