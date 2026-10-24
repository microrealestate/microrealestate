import {
  type AuthType,
  EMAIL_NAMES,
  type EmailName
} from '@microrealestate/shared';
import definitions from '../emails';
import { hasTemplates } from './render';
import { AUTH_BY_SENDER, type EmailDefinition } from './types';

const _byName = new Map<string, EmailDefinition>();

function validate(all: EmailDefinition[]): void {
  for (const definition of all) {
    const { name } = definition;

    if (!name) {
      throw new Error('an email definition has no name');
    }
    if (_byName.has(name)) {
      throw new Error(`duplicate email definition ${name}`);
    }
    if (!hasTemplates(name)) {
      throw new Error(
        `email definition ${name} is missing one of subject.hbs, body_html.hbs, body_text.hbs`
      );
    }

    _byName.set(name, definition);
  }

  // `name: EmailName` covers the other direction: a definition cannot use an unlisted name.
  for (const name of EMAIL_NAMES) {
    if (!_byName.has(name)) {
      throw new Error(`no email definition for ${name}`);
    }
  }
}

validate(definitions);

export function getOnDemandDefinition(
  name: string
): EmailDefinition | undefined {
  return _byName.get(name);
}

export function onDemandNames(auth: AuthType): EmailName[] {
  return definitions
    .filter((definition) => AUTH_BY_SENDER[definition.sender] === auth)
    .map(({ name }) => name);
}
