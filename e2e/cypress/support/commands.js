// ***********************************************
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
import i18n from './i18n';

Cypress.Commands.add('resetAppData', () => {
  const apiBaseUrl = Cypress.env('GATEWAY_BASEURL');
  cy.request('DELETE', `${apiBaseUrl}/api/reset`);
});

Cypress.Commands.add('signIn', ({ email, password }) => {
  cy.visit('/signin');
  cy.get('input[name=email]').type(email);
  cy.get('input[name=password]').type(password);
  cy.get('[data-cy=submit]').click();
});

Cypress.Commands.add('signOut', () => {
  cy.get('[data-cy=orgMenu]').click();
  cy.get('[data-cy=signoutNav]').click();
});

Cypress.Commands.add('signUp', ({ firstName, lastName, email, password }) => {
  cy.visit('/signup');
  cy.get('input[name=firstName]').type(firstName);
  cy.get('input[name=lastName]').type(lastName);
  cy.get('input[name=email]').type(email);
  cy.get('input[name=password]').type(password);
  cy.get('[data-cy=submit]').click();
});

Cypress.Commands.add(
  'registerLandlord',
  ({ orgName, locale, currency, company }) => {
    cy.get('[data-cy=companyFalse]').click();
    cy.get('input[name=name]').type(orgName);
    cy.muiSelect('locale', locale);
    cy.muiSelect('currency', currency);
    if (company) {
      const { name, legalRepresentative, legalStructure, ein, capital } =
        company;
      cy.get('[data-cy=companyTrue]').click();
      cy.get('input[name=legalRepresentative]').type(legalRepresentative);
      cy.get('input[name=legalStructure]').type(legalStructure);
      cy.get('input[name=company]').type(name);
      cy.get('input[name=ein]').type(ein);
      cy.get('input[name=capital]').type(capital);
    }
    cy.get('[data-cy=submit]').click();
  }
);

Cypress.Commands.add(
  'createContractFromStepper',
  ({ name, description, timeRange, numberOfTerms, templates = [] }) => {
    cy.get('[data-cy=shortcutCreateContract]').click();
    cy.get('input[name=name]').type(name);
    cy.get('[data-cy=submitContract]').click();
    cy.get('textarea[name=description]').type(description);
    cy.muiSelect('timeRange', timeRange);
    cy.get('input[name=numberOfTerms]').type(numberOfTerms);
    cy.get('[data-cy=submit]').click();
    templates.map(({ type, ...template }) => {
      if (type === 'text') {
        const { title, content } = template;
        cy.get('[data-cy=addTextDocument]').click();
        cy.get('input[name=title]').clear();
        cy.get('input[name=title]').type(title);
        cy.get('[data-cy="savingTextDocument"]').should('not.exist');
        cy.get('[data-cy="savedTextDocument"]').should('not.exist');
        cy.get('.ProseMirror').type(content);
        cy.get('[data-cy="savingTextDocument"]').should('not.exist');
        cy.get('[data-cy="savedTextDocument"]').should('not.exist');
        cy.get('[data-cy=close]').click();
      } else if (type === 'fileDescriptor') {
        const {
          title,
          description,
          hasExpiryDate,
          required,
          requiredOnceContractTerminated,
          optional
        } = template;
        cy.get('[data-cy=addFileDescriptor]').click();
        cy.get('input[name=name]').type(title);
        cy.get('input[name=description]').type(description);
        if (hasExpiryDate) {
          cy.get('div:has(>input[name=hasExpiryDate]) > button').click();
        }
        if (required) {
          cy.get('[data-cy=fileRequired]').click();
        } else if (requiredOnceContractTerminated) {
          cy.get('[data-cy=fileRequiredOnceContractTerminated]').click();
        } else if (optional) {
          cy.get('[data-cy=fileOptional]').click();
        }
        cy.get('[data-cy=submitFileDescriptor]').click();
      }
    });
    cy.get('[data-cy=submit]').click();
  }
);

Cypress.Commands.add(
  'addPropertyFromStepper',
  ({ name, type, description, surface, phone, digiCode, address, rent }) => {
    cy.get('[data-cy=shortcutAddProperty]').click();
    cy.get('input[name=name]').type(name);
    cy.get('[data-cy=submitProperty]').click();
    cy.contains(i18n.getFixedT('fr-FR')('Property information'));
    cy.muiSelectText(
      'type',
      i18n.getFixedT('fr-FR')(type.replace(/^./, type[0].toUpperCase()))
    );
    cy.get('input[name=rent]').type(rent);
    cy.get('input[name=description]').type(description);
    cy.get('input[name=surface]').type(surface);
    cy.get('input[name=phone]').type(phone);
    cy.get('input[name=digicode]').type(digiCode);
    if (address) {
      const { street1, street2, zipCode, city, state, country } = address;
      cy.get('input[name="address.street1"]').type(street1);
      if (street2) {
        cy.get('input[name="address.street2"]').type(street2);
      }
      cy.get('input[name="address.zipCode"]').type(zipCode);
      cy.get('input[name="address.city"]').type(city);
      cy.get('input[name="address.state"]').type(state);
      cy.get('input[name="address.country"]').type(country);
    }
    cy.get('[data-cy=submit]').click();
  }
);

Cypress.Commands.add(
  'addTenantFromStepper',
  ({ name, isCompany, address, contacts, lease, billing, documents }) => {
    cy.get('[data-cy=shortcutAddTenant]').click();
    cy.get('input[name=name]').type(name);
    cy.get('[data-cy=submitTenant]').click();
    if (isCompany) {
      cy.get('[data-cy=tenantIsBusinessAccount]').click();
    } else {
      cy.get('[data-cy=tenantIsPersonalAccount]').click();
    }
    if (address) {
      const { street1, street2, zipCode, city, state, country } = address;
      cy.get('input[name="address.street1"]').type(street1);
      if (street2) {
        cy.get('input[name="address.street2"]').type(street2);
      }
      cy.get('input[name="address.zipCode"]').type(zipCode);
      cy.get('input[name="address.city"]').type(city);
      cy.get('input[name="address.state"]').type(state);
      cy.get('input[name="address.country"]').type(country);
    }
    contacts.forEach(({ name, email, phone1, phone2 }, index) => {
      if (index > 0) {
        cy.get('button[data-cy=addContactsItem]').click();
      }
      cy.get(`input[name="contacts[${index}].contact"]`).type(name);
      cy.get(`input[name="contacts[${index}].email"]`).type(email);
      cy.get(`input[name="contacts[${index}].phone1"]`).type(phone1);
      cy.get(`input[name="contacts[${index}].phone2"]`).type(phone2);
    });
    cy.get('[data-cy=submit]').click();

    if (lease) {
      const { contract, beginDate, properties } = lease;
      cy.muiSelectText('leaseId', contract);
      cy.get('input[name=beginDate]').clear();
      cy.get('input[name=beginDate]').type(beginDate);
      properties.forEach(({ name, expense, entryDate, exitDate }, index) => {
        if (index > 0) {
          cy.get('[data-cy=addPropertiesItem]').click();
        }
        cy.muiSelectText(`properties[${index}]._id`, name);
        cy.get(`input[name="properties[${index}].expenses[0].title"]`).type(
          expense.title
        );
        cy.get(`input[name="properties[${index}].expenses[0].amount"]`).clear();
        cy.get(`input[name="properties[${index}].expenses[0].amount"]`).type(
          expense.amount
        );
        cy.get(`input[name="properties[${index}].entryDate"]`).clear();
        cy.get(`input[name="properties[${index}].entryDate"]`).type(entryDate);
        cy.get(`input[name="properties[${index}].exitDate"]`).clear();
        cy.get(`input[name="properties[${index}].exitDate"]`).type(exitDate);
      });
    }
    cy.get('[data-cy=submit]').click();

    if (billing) {
      const { isVat, percentageVatRatio } = billing;
      if (isVat) {
        cy.get('div:has(>input[name=isVat]) > button').click();
      }
      cy.get('input[name=vatRatio]').clear();
      cy.get('input[name=vatRatio]').type(percentageVatRatio);
    }
    cy.get('[data-cy=submit]').click();

    if (documents) {
      documents.forEach(({ type, ...template }) => {
        if (type === 'text') {
          const { templateName, title, content } = template;
          cy.get('[data-cy=addTenantTextDocument]').click();
          cy.get(
            `[data-cy=template-${templateName.replace(/\s/g, '')}]`
          ).click();
          if (title) {
            cy.get('input[name=title]').clear();
            cy.get('input[name=title]').type(title);
            cy.get('[data-cy="savingTextDocument"]').should('not.exist');
            cy.get('[data-cy="savedTextDocument"]').should('not.exist');
          }
          if (content) {
            cy.get('.ProseMirror').type(content);
            cy.get('[data-cy="savingTextDocument"]').should('not.exist');
            cy.get('[data-cy="savedTextDocument"]').should('not.exist');
          }
          cy.get('[data-cy=close]').click();
        } else if (type === 'file') {
          cy.get('[data-cy=addTenantFile]').click();
        }
      });
    }

    cy.get('[data-cy=submit]').click();
  }
);

Cypress.Commands.add('navAppMenu', (pageName) => {
  cy.get('[data-cy=appMenu]').click();
  cy.get(`[data-cy=${pageName}Nav]`).click();
  cy.checkPage(pageName);
});

Cypress.Commands.add('navOrgMenu', (pageName) => {
  cy.get('[data-cy=orgMenu]').click();
  cy.get(`[data-cy=${pageName}Nav]`).click();
  cy.checkPage(pageName);
});

Cypress.Commands.add('muiSelect', (name, value) => {
  cy.get(`input[name="${name}"]`).parent().click();
  cy.get(`.MuiList-root [data-value="${value}"]`).click();
});

Cypress.Commands.add('muiSelectText', (name, text) => {
  cy.get(`input[name="${name}"]`).parent().click();
  cy.get('.MuiList-root').contains(text).click();
});

Cypress.Commands.add('checkUrl', (url) => {
  cy.url({ timeout: 8000 }).should('include', url);
});

Cypress.Commands.add('checkPage', (pageName) => {
  cy.get(`[data-cy=${pageName}Page]`).should('be.visible');
});

Cypress.Commands.add('searchResource', (text) => {
  cy.get('[data-cy=globalSearchField]').click();
  cy.get('[data-cy=globalSearchField]').clear();
  cy.get('[data-cy=globalSearchField]').type(text);
});

Cypress.Commands.add('openResource', (resourceName) => {
  cy.get('button[data-cy=openResourceButton]').contains(resourceName).click();
});

Cypress.Commands.add('removeResource', () => {
  cy.get('button[data-cy=removeResourceButton]').click();
  cy.get('[role=dialog]')
    .get('button')
    .contains(i18n.getFixedT('fr-FR')('Continue'))
    .click();
});
