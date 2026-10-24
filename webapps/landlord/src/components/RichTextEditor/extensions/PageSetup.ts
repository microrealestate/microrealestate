import { Extension } from '@tiptap/core';
import type { Node as ProseMirrorNode, Schema } from '@tiptap/pm/model';
import { Step, StepResult } from '@tiptap/pm/transform';

export const PAGE_FORMATS = ['A4', 'A5', 'LETTER'] as const;
export type PageFormat = (typeof PAGE_FORMATS)[number];

export const PAGE_ORIENTATIONS = ['portrait', 'landscape'] as const;
export type PageOrientation = (typeof PAGE_ORIENTATIONS)[number];

export type PageMargins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export const PAGE_FORMAT_SIZES_MM: Record<
  PageFormat,
  { width: number; height: number }
> = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  LETTER: { width: 215.9, height: 279.4 }
};

export const PAGE_MARGIN_PRESETS = ['normal', 'narrow', 'wide'] as const;
export type PageMarginPreset = (typeof PAGE_MARGIN_PRESETS)[number];

export const PAGE_MARGIN_PRESETS_MM: Record<PageMarginPreset, PageMargins> = {
  normal: { top: 25, right: 25, bottom: 25, left: 25 },
  narrow: { top: 12.7, right: 12.7, bottom: 12.7, left: 12.7 },
  wide: { top: 25, right: 50, bottom: 25, left: 50 }
};

export type PageSetupType = {
  pageFormat: PageFormat;
  orientation: PageOrientation;
  margins: PageMargins;
};

const DEFAULT_PAGE_SETUP: PageSetupType = {
  pageFormat: 'A4',
  orientation: 'portrait',
  margins: PAGE_MARGIN_PRESETS_MM.normal
};

type PageGeometry = {
  widthMm: number;
  heightMm: number;
  margins: PageMargins;
};

function isPageFormat(value: unknown): value is PageFormat {
  return PAGE_FORMATS.includes(value as PageFormat);
}

function isPageOrientation(value: unknown): value is PageOrientation {
  return PAGE_ORIENTATIONS.includes(value as PageOrientation);
}

function isPageMargins(value: unknown): value is PageMargins {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const margins = value as Record<string, unknown>;
  return (['top', 'right', 'bottom', 'left'] as const).every(
    (side) => typeof margins[side] === 'number'
  );
}

export function normalizePageSetup(
  attrs: Record<string, unknown> | undefined | null
): PageSetupType {
  return {
    pageFormat: isPageFormat(attrs?.pageFormat)
      ? attrs.pageFormat
      : DEFAULT_PAGE_SETUP.pageFormat,
    orientation: isPageOrientation(attrs?.orientation)
      ? attrs.orientation
      : DEFAULT_PAGE_SETUP.orientation,
    margins: isPageMargins(attrs?.margins)
      ? attrs.margins
      : DEFAULT_PAGE_SETUP.margins
  };
}

export function getPageGeometry(setup: PageSetupType): PageGeometry {
  const { width, height } = PAGE_FORMAT_SIZES_MM[setup.pageFormat];
  const landscape = setup.orientation === 'landscape';

  return {
    widthMm: landscape ? height : width,
    heightMm: landscape ? width : height,
    margins: setup.margins
  };
}

/**
 * ProseMirror has no built-in step for the attributes of the root node, and the
 * doc has no position a `setNodeMarkup` could address. This step rebuilds the
 * doc node around the existing content, which leaves every position untouched,
 * so its position map is the identity and undo works through `invert`.
 */
class SetDocAttrStep extends Step {
  readonly key: string;
  readonly value: unknown;
  private previousValue: unknown;

  constructor(key: string, value: unknown, previousValue: unknown = null) {
    super();
    this.key = key;
    this.value = value;
    this.previousValue = previousValue;
  }

  apply(doc: ProseMirrorNode) {
    this.previousValue = doc.attrs[this.key];
    const attrs = { ...doc.attrs, [this.key]: this.value };
    return StepResult.ok(doc.type.create(attrs, doc.content, doc.marks));
  }

  invert() {
    return new SetDocAttrStep(this.key, this.previousValue, this.value);
  }

  map() {
    return this;
  }

  toJSON() {
    return { stepType: 'setDocAttr', key: this.key, value: this.value };
  }

  static fromJSON(_schema: Schema, json: { key: string; value: unknown }) {
    return new SetDocAttrStep(json.key, json.value);
  }
}

try {
  Step.jsonID('setDocAttr', SetDocAttrStep);
} catch {
  // Already registered by an earlier module evaluation (dev server hot reload).
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageSetup: {
      setPageSetup: (setup: Partial<PageSetupType>) => ReturnType;
    };
  }
}

const PageSetup = Extension.create({
  name: 'pageSetup',

  addGlobalAttributes() {
    return [
      {
        types: ['doc'],
        attributes: {
          pageFormat: {
            default: DEFAULT_PAGE_SETUP.pageFormat,
            // The doc node is not serialized to HTML, so these keep the
            // attribute out of any rendered markup.
            parseHTML: () => DEFAULT_PAGE_SETUP.pageFormat,
            renderHTML: () => ({})
          },
          orientation: {
            default: DEFAULT_PAGE_SETUP.orientation,
            parseHTML: () => DEFAULT_PAGE_SETUP.orientation,
            renderHTML: () => ({})
          },
          margins: {
            default: DEFAULT_PAGE_SETUP.margins,
            parseHTML: () => DEFAULT_PAGE_SETUP.margins,
            renderHTML: () => ({})
          }
        }
      }
    ];
  },

  addCommands() {
    return {
      setPageSetup:
        (setup) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            for (const [key, value] of Object.entries(setup)) {
              if (value !== undefined) {
                tr.step(new SetDocAttrStep(key, value));
              }
            }
          }
          return true;
        }
    };
  }
});

export default PageSetup;
