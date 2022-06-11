import i18n from '../support/i18n';
import userWithCompanyAccount from '../fixtures/user_admin_company_account.json';
import userWithPersonalAccount from '../fixtures/user_admin_personal_account.json';

describe('User access', () => {
  before(() => {
    cy.resetAppData();
  });

  it('Register a landlord with a personal account', () => {
    cy.visit('/signup');
    cy.get('[data-cy=signin]').click();
    cy.get('[data-cy=signup]').click();
    cy.signUp(userWithPersonalAccount);
    cy.checkUrl('/signin');

    cy.signIn(userWithPersonalAccount);
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

    cy.registerLandlord(userWithPersonalAccount);
    cy.checkUrl(
      `/fr-FR/${encodeURI(userWithPersonalAccount.orgName)}/dashboard`
    );
    cy.signOut();
  });

  it('Register a landlord with a company account', () => {
    cy.visit('/signup');
    cy.get('[data-cy=signin]').click();
    cy.get('[data-cy=signup]').click();
    cy.signUp(userWithCompanyAccount);
    cy.checkUrl('/signin');

    cy.signIn(userWithCompanyAccount);
    cy.checkUrl('/firstaccess');
    cy.contains(
      i18n.getFixedT('en')('Welcome {{firstName}} {{lastName}}!', {
        firstName: userWithCompanyAccount.firstName,
        lastName: userWithCompanyAccount.lastName,
      })
    );

    cy.registerLandlord(userWithCompanyAccount);
    cy.checkUrl(
      `/fr-FR/${encodeURI(userWithCompanyAccount.orgName)}/dashboard`
    );
    cy.signOut();
  });

  it('Check page navigation', () => {
    cy.visit('/');
    cy.signIn(userWithPersonalAccount);

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
      i18n.getFixedT('fr-FR')('Welcome {{firstName}} {{lastName}}!', {
        firstName: userWithPersonalAccount.firstName,
        lastName: userWithPersonalAccount.lastName,
      })
    );

    cy.signOut();
    cy.checkUrl('/signin');
  });

  it('Incorrect email or password', () => {
    cy.visit('/');
    cy.signIn({ email: 'demo@demo.com', password: 'demo' });
    cy.get('.MuiAlert-message').should(
      'have.text',
      i18n.getFixedT('en')('Incorrect email or password')
    );
  });

  it('User already registered', () => {
    cy.visit('/signup');
    cy.get('[data-cy=signin]').click();
    cy.get('[data-cy=signup]').click();
    cy.signUp(userWithPersonalAccount);
    cy.checkUrl('/signup');
    cy.get('.MuiAlert-message').should(
      'have.text',
      i18n.getFixedT('en')('This user is already registered')
    );
  });
});
