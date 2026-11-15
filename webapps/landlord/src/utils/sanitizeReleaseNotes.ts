import DOMPurify, { type Config, type WindowLike } from 'dompurify';

// Release notes are third-party HTML (GitHub's rendering of the changelog):
// only markdown output may pass. No form controls, no inline style, no svg,
// and no class but GitHub's alert markup, so that a release body cannot draw
// the app's own UI (an overlay, a fake sign-in) inside the dialog.
const CONFIG: Config = {
  ALLOWED_TAGS: [
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'a',
    'strong',
    'em',
    'del',
    'code',
    'pre',
    'blockquote',
    'br',
    'hr',
    'div',
    'span',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'img'
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
  ALLOW_DATA_ATTR: false
};

const ALERT_CLASS = /^markdown-alert(-[a-z]+)?$/;

// A dedicated instance: the hooks must not leak into the app's other
// DOMPurify calls
// (`root` defaults to the browser window; a test passes a jsdom one)
export function createReleaseNotesSanitizer(root?: WindowLike) {
  const purify = DOMPurify(root);

  purify.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName !== 'class') {
      return;
    }
    const kept = data.attrValue
      .split(/\s+/)
      .filter((name) => ALERT_CLASS.test(name));
    if (kept.length) {
      data.attrValue = kept.join(' ');
    } else {
      data.keepAttr = false;
    }
  });

  // links leave the app
  purify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noreferrer noopener');
    }
  });

  return (html: string) => purify.sanitize(html, CONFIG) as string;
}

let sanitizer: ((html: string) => string) | undefined;

export default function sanitizeReleaseNotes(html: string) {
  sanitizer ??= createReleaseNotesSanitizer();
  return sanitizer(html);
}
