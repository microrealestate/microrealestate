import contract369 from '../fixtures/contract_369.json';
import i18n from '../support/i18n';
import properties from '../fixtures/properties.json';
import tenants from '../fixtures/tenants.json';
import userWithCompanyAccount from '../fixtures/user_admin_company_account.json';

describe('Create/delete resources', () => {
  before(() => {
    cy.resetAppData();
    cy.signUp(userWithCompanyAccount);
    cy.signIn(userWithCompanyAccount);
    cy.checkPage('firstaccess');
    cy.registerLandlord(userWithCompanyAccount);
  });

  it('Create/delete a contract, a property and a tenant', () => {
    // First contract
    cy.createContractFromStepper(contract369);
    cy.get('[data-cy=tabContractTemplates]').click();
    contract369.templates.map((template) => {
      cy.get('[data-cy=contractPage]')
        .contains(template.title)
        .should('be.visible');
      if (template.type === 'text' && template.description) {
        cy.get('[data-cy=contractPage]')
          .contains(template.description)
          .should('be.visible');
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

    cy.navAppMenu('dashboard');

    // First property
    cy.addPropertyFromStepper(properties[0]);
    cy.get('.pigeon-tiles-box').should('be.visible');
    cy.navAppMenu('properties');
    cy.contains(properties[0].name).should('be.visible');
    cy.contains(properties[0].description).should('be.visible');
    cy.contains(i18n.getFixedT(userWithCompanyAccount.locale)('Vacant')).should(
      'be.visible'
    );

    cy.navAppMenu('dashboard');

    // First tenant
    cy.addTenantFromStepper(tenants[0]);
    cy.navAppMenu('tenants');
    cy.contains(tenants[0].name).should('be.visible');
    cy.contains(tenants[0].lease.contract).should('be.visible');
    cy.contains(
      i18n.getFixedT(userWithCompanyAccount.locale)('Lease running')
    ).should('be.visible');

    cy.navAppMenu('rents');
    cy.contains(tenants[0].name).should('be.visible');

    cy.navAppMenu('dashboard');
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
    cy.get('.recharts-radial-bar-sector').should('be.visible');
    cy.get('.recharts-bar').should('be.visible');

    cy.navAppMenu('tenants');
    cy.searchResource(tenants[0].name);
    cy.openResource(tenants[0].name);
    cy.removeResource();
    cy.contains(i18n.getFixedT('fr-FR')('No tenants found'));

    cy.navAppMenu('properties');
    cy.searchResource(properties[0].name);
    cy.openResource(properties[0].name);
    cy.removeResource();
    cy.contains(i18n.getFixedT('fr-FR')('No properties found'));

    cy.navOrgMenu('contracts');
    cy.openResource(contract369.name);
    cy.removeResource();
    cy.contains(contract369.name).should('not.exist');

    cy.navAppMenu('dashboard');
    cy.contains(
      i18n.getFixedT('fr-FR')(
        'Follow these steps to start managing your properties'
      )
    );
  });
});
