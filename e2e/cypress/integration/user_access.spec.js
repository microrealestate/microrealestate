const userWithPersonalAccount = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'jdoe@test.com',
  password: 'test1234',
};

const userWithCompanyAccount = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'janedoe@test.com',
  password: 'test1234',
};

import i18n from '../support/i18n';

describe('User access', () => {
  before(() => {
    cy.resetAppData(Cypress.env('API_BASEURL'));
  });

  it('Register a landlord with a personal account', () => {
    cy.visit('/signup');
    cy.get('[data-cy=signin]').click();
    cy.get('[data-cy=signup]').click();
    cy.registerUser(
      userWithPersonalAccount.firstName,
      userWithPersonalAccount.lastName,
      userWithPersonalAccount.email,
      userWithPersonalAccount.password
    );
    cy.checkUrl('/signin');

    cy.signin(userWithPersonalAccount.email, userWithPersonalAccount.password);
    cy.checkUrl('/firstaccess');
    cy.contains(
      i18n.getFixedT('en')('Welcome {{firstName}} {{lastName}}!', {
        firstName: userWithPersonalAccount.firstName,
        lastName: userWithPersonalAccount.lastName,
      })
    );

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

    cy.registerLandlord("John's properties", 'Français (France)', 'Euro (€)');
    cy.checkUrl("/fr-FR/John's%20properties/dashboard");
    cy.signout();
  });

  it('Register a landlord with a company account', () => {
    cy.visit('/signup');
    cy.get('[data-cy=signin]').click();
    cy.get('[data-cy=signup]').click();
    cy.registerUser(
      userWithCompanyAccount.firstName,
      userWithCompanyAccount.lastName,
      userWithCompanyAccount.email,
      userWithCompanyAccount.password
    );
    cy.checkUrl('/signin');

    cy.signin(userWithCompanyAccount.email, userWithCompanyAccount.password);
    cy.checkUrl('/firstaccess');
    cy.contains(
      i18n.getFixedT('en')('Welcome {{firstName}} {{lastName}}!', {
        firstName: userWithCompanyAccount.firstName,
        lastName: userWithCompanyAccount.lastName,
      })
    );

    cy.registerLandlord(
      "Jane's properties",
      'Français (France)',
      'Euro (€)',
      'My company',
      'Jane Doe',
      'Inc',
      'AER33333',
      30000
    );
    cy.checkUrl("/fr-FR/Jane's%20properties/dashboard");
    cy.signout();
  });

  it('Check page navigation', () => {
    cy.visit('/');
    cy.signin(userWithPersonalAccount.email, userWithPersonalAccount.password);

    cy.navToPage('rents');
    const now = new Date();
    cy.checkUrl(
      `/rents/${now.getFullYear()}.${String(now.getMonth() + 1).padStart(
        2,
        '0'
      )}`
    );
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

    cy.navToPage('accounting');
    cy.checkUrl(`/accounting/${now.getFullYear()}`);
    cy.contains(i18n.getFixedT('fr-FR')('Accounting'));

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
      i18n.getFixedT('fr-FR')('Welcome {{firstName}}', {
        firstName: userWithPersonalAccount.firstName,
      })
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
    cy.registerUser(
      userWithPersonalAccount.firstName,
      userWithPersonalAccount.lastName,
      userWithPersonalAccount.email,
      userWithPersonalAccount.password
    );
    cy.checkUrl('/signup');
    cy.get('.MuiAlert-message').should(
      'have.text',
      i18n.getFixedT('en')('This user is already registered')
    );
  });
});
