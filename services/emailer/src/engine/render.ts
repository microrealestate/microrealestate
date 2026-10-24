import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EMAIL_NAMES } from '@microrealestate/shared';
import Handlebars from 'handlebars';
import templateFunctions from '../utils/templatefunctions';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const _emailsDir = path.join(__dirname, '..', 'emails');
const _partialsDirName = '__partials';
const _parts = ['subject', 'body_html', 'body_text'] as const;

type Part = (typeof _parts)[number];

export interface RenderedContent {
  subject: string;
  text: string;
  html: string;
}

const _handlebars = Handlebars.create();

for (const flavor of ['html', 'text']) {
  const flavorDir = path.join(_emailsDir, _partialsDirName, flavor);
  for (const file of fs.readdirSync(flavorDir)) {
    if (path.extname(file) !== '.hbs') {
      continue;
    }
    _handlebars.registerPartial(
      `${flavor}/${path.basename(file, '.hbs')}`,
      fs.readFileSync(path.join(flavorDir, file), 'utf8')
    );
  }
}

const _templates = new Map<string, Handlebars.TemplateDelegate>();
for (const name of EMAIL_NAMES) {
  for (const part of _parts) {
    const file = path.join(_emailsDir, name, `${part}.hbs`);
    if (!fs.existsSync(file)) {
      continue;
    }
    _templates.set(
      `${name}/${part}`,
      _handlebars.compile(fs.readFileSync(file, 'utf8'), {
        preventIndent: true
      })
    );
  }
}

export function hasTemplates(name: string): boolean {
  return _parts.every((part) => _templates.has(`${name}/${part}`));
}

export function render(
  name: string,
  data: unknown,
  locale: string,
  currency: string
): RenderedContent {
  if (!hasTemplates(name)) {
    throw new Error(
      `cannot generate email content for ${name}. Template not found`
    );
  }

  const context = data as Record<string, unknown>;
  const helpers = templateFunctions({ locale, currency });
  const renderPart = (part: Part) =>
    // biome-ignore lint/style/noNonNullAssertion: hasTemplates above proved every part is present.
    _templates.get(`${name}/${part}`)!(context, { helpers });

  return {
    subject: renderPart('subject'),
    text: renderPart('body_text'),
    html: renderPart('body_html')
  };
}
