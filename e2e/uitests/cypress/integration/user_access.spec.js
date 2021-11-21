const APP_BASEURL = 'http://localhost:8080';

const firstName = 'John';
const lastName = 'Doe';
const email = 'jdoe@test.com';
const password = 'test1234';

describe('User access', () => {
  before(() => {
    cy.resetAppData(APP_BASEURL);
  });

  it('Register a user', () => {
    cy.visit(`${APP_BASEURL}/app/signup`);
    cy.get('[data-cy=signin]').click();
    cy.get('[data-cy=signup]').click();
    cy.registerUSer(firstName, lastName, email, password);
    cy.checkUrl('/app/signin');

    cy.signin(email, password);
    cy.checkUrl('/app/firstaccess');
    cy.contains('Welcome John Doe!');
    cy.get('input[name=name]').type("John's properties");
    cy.muiSelect('input[name=locale]', 'Français (France)');
    cy.muiSelect('input[name=currency]', 'Euro (€)');
    cy.get('input[name=legalRepresentative]').should('not.exist');
    cy.get('input[name=legalStructure]').should('not.exist');
    cy.get('input[name=company]').should('not.exist');
    cy.get('input[name=ein]').should('not.exist');
    cy.get('input[name=capital]').should('not.exist');

    cy.get('[data-cy=companyTrue]').click();
    cy.get('input[name=legalRepresentative]');
    cy.get('input[name=legalStructure]');
    cy.get('input[name=company]');
    cy.get('input[name=ein]');
    cy.get('input[name=capital]');
    cy.get('[data-cy=submit]').should('be.disabled');

    cy.get('[data-cy=companyFalse]').click();
    cy.get('[data-cy=submit]').click();
    cy.checkUrl("/fr-FR/John's%20properties/dashboard");
    cy.signout();
  });

  it('Check page navigation', () => {
    cy.visit(`${APP_BASEURL}/app/`);
    cy.signin(email, password);

    cy.navToPage('rents');
    const now = new Date();
    cy.checkUrl(`/rents/${now.getFullYear()}.${now.getMonth() + 1}`);

    cy.navToPage('tenants');
    cy.checkUrl('/tenants');

    cy.navToPage('properties');
    cy.checkUrl('/properties');

    cy.navToPage('settings');
    cy.checkUrl('/settings');

    cy.navToPage('dashboard');
    cy.checkUrl('/dashboard');

    cy.signout();
  });

  it('Incorrect email or password', () => {
    cy.visit(`${APP_BASEURL}/app/`);
    cy.signin('demo@demo.com', 'demo');
    cy.get('.MuiAlert-message').should(
      'have.text',
      'Incorrect email or password'
    );
  });

  it('User already registered', () => {
    cy.visit(`${APP_BASEURL}/app/signup`);
    cy.get('[data-cy=signin]').click();
    cy.get('[data-cy=signup]').click();
    cy.registerUSer(firstName, lastName, email, password);
    cy.checkUrl('/app/signup');
    cy.get('.MuiAlert-message').should(
      'have.text',
      'This user is already registered'
    );
  });
});
