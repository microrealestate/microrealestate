import contract369 from '../fixtures/contract_369.json';
import i18n from '../support/i18n';
import properties from '../fixtures/properties.json';
import tenants from '../fixtures/tenants.json';
import userWithCompanyAccount from '../fixtures/user_admin_company_account.json';

describe('Create resources', () => {
  before(() => {
    cy.resetAppData();
    cy.signUp(userWithCompanyAccount);
    cy.signIn(userWithCompanyAccount);
    cy.registerLandlord(userWithCompanyAccount);
  });

  it('Create a first contract, a first property and a first tenant', () => {
    // First contract
    cy.createContractFromStepper(contract369);
    cy.get('[data-cy=tabContractTemplates]').click();
    contract369.templates.map((template) => {
      cy.get('ul').contains(template.title).should('be.visible');
      if (template.type === 'text' && template.description) {
        cy.get('ul').contains(template.description).should('be.visible');
      }
    });
    cy.get('[data-cy=tabContractInfo]').click();
    cy.get('input[name=name]').should('have.value', contract369.name);
    cy.get('[data-cy=tabContractInfo]').click();
    cy.get('input[name=name]').should('have.value', contract369.name);
    cy.get('textarea[name=description]').should(
      'have.text',
      contract369.description
    );
    cy.get('input[name=timeRange]').should('have.value', contract369.timeRange);
    cy.get('input[name=numberOfTerms]').should(
      'have.value',
      contract369.numberOfTerms
    );

    cy.navToPage('dashboard');

    // First property
    cy.addPropertyFromStepper(properties[0]);
    cy.get('.pigeon-tiles-box').should('be.visible');
    cy.navToPage('properties');
    cy.contains(properties[0].name).should('be.visible');
    cy.contains(properties[0].description).should('be.visible');
    cy.contains(i18n.getFixedT(userWithCompanyAccount.locale)('Vacant')).should(
      'be.visible'
    );

    cy.navToPage('dashboard');

    // First tenant
    cy.addTenantFromStepper(tenants[0]);
    cy.navToPage('tenants');
    cy.contains(tenants[0].name).should('be.visible');
    cy.contains(tenants[0].lease.contract).should('be.visible');
    cy.contains(tenants[0].lease.properties[0].name).should('be.visible');
    cy.contains(
      i18n.getFixedT(userWithCompanyAccount.locale)('In progress')
    ).should('be.visible');

    cy.navToPage('rents');
    cy.contains(tenants[0].name).should('be.visible');

    cy.navToPage('dashboard');
    cy.contains(
      i18n.getFixedT(userWithCompanyAccount.locale)('Occupancy rate')
    ).should('be.visible');
    cy.contains(
      i18n.getFixedT(userWithCompanyAccount.locale)('Revenues')
    ).should('be.visible');
    cy.contains(
      i18n.getFixedT(userWithCompanyAccount.locale)('Settlements')
    ).should('be.visible');
    cy.contains(
      i18n.getFixedT(userWithCompanyAccount.locale)('Top 5 of not paid rents')
    ).should('be.visible');
    cy.get('.recharts-pie').should('be.visible');
    cy.get('.recharts-bar').should('be.visible');
  });
});
