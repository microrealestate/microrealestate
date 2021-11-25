const firstName = 'John';
const lastName = 'Doe';
const email = 'jdoe@test.com';
const password = 'test1234';

import i18n from '../support/i18n';

describe('User access', () => {
  before(() => {
    cy.resetAppData(Cypress.env('API_BASEURL'));
  });

  it('Register a user', () => {
    cy.visit('/signup');
    cy.get('[data-cy=signin]').click();
    cy.get('[data-cy=signup]').click();
    cy.registerUSer(firstName, lastName, email, password);
    cy.checkUrl('/signin');

    cy.signin(email, password);
    cy.checkUrl('/firstaccess');
    cy.contains(
      i18n.getFixedT('en')('Welcome {{firstName}} {{lastName}}!', {
        firstName,
        lastName,
      })
    );
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
    cy.visit('/');
    cy.signin(email, password);

    cy.navToPage('rents');
    const now = new Date();
    cy.checkUrl(`/rents/${now.getFullYear()}.${now.getMonth() + 1}`);
    cy.contains(i18n.getFixedT('fr-FR')('Rents'));
    cy.contains(i18n.getFixedT('fr-FR')('Send mass emails'));

    cy.navToPage('tenants');
    cy.checkUrl('/tenants');
    cy.contains(i18n.getFixedT('fr-FR')('Tenants'));
    cy.contains(i18n.getFixedT('fr-FR')('New tenant'));

    cy.navToPage('properties');
    cy.checkUrl('/properties');
    cy.contains(i18n.getFixedT('fr-FR')('Properties'));
    cy.contains(i18n.getFixedT('fr-FR')('New property'));

    cy.navToPage('settings');
    cy.checkUrl('/settings');
    cy.contains(i18n.getFixedT('fr-FR')('Landlord'));
    cy.contains(i18n.getFixedT('fr-FR')('Billing'));
    cy.contains(i18n.getFixedT('fr-FR')('Contracts'));
    cy.contains(i18n.getFixedT('fr-FR')('Collaborators'));
    cy.contains(i18n.getFixedT('fr-FR')('Third-parties'));

    cy.navToPage('dashboard');
    cy.checkUrl('/dashboard');
    cy.contains(
      i18n.getFixedT('fr-FR')('Welcome {{firstName}}', { firstName })
    );

    cy.signout();
    cy.checkUrl('/signin');
  });

  it('Incorrect email or password', () => {
    cy.visit('/');
    cy.signin('demo@demo.com', 'demo');
    cy.get('.MuiAlert-message').should(
      'have.text',
      i18n.getFixedT('en')('Incorrect email or password')
    );
  });

  it('User already registered', () => {
    cy.visit('/signup');
    cy.get('[data-cy=signin]').click();
    cy.get('[data-cy=signup]').click();
    cy.registerUSer(firstName, lastName, email, password);
    cy.checkUrl('/signup');
    cy.get('.MuiAlert-message').should(
      'have.text',
      i18n.getFixedT('en')('This user is already registered')
    );
  });
});
