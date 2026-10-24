import { Label } from '@microrealestate/commonui/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@microrealestate/commonui/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@microrealestate/commonui/components/ui/select';
import { type Editor, useEditorState } from '@tiptap/react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';
import { RiArrowDownSLine, RiFileSettingsLine } from 'react-icons/ri';
import {
  normalizePageSetup,
  PAGE_FORMATS,
  PAGE_MARGIN_PRESETS,
  PAGE_MARGIN_PRESETS_MM,
  PAGE_ORIENTATIONS,
  type PageFormat,
  type PageMarginPreset,
  type PageMargins,
  type PageOrientation
} from './extensions/PageSetup';
import { ToolbarButton } from './toolbar/ToolbarPrimitives';

const FORMAT_LABELS: Record<PageFormat, string> = {
  A4: 'A4',
  A5: 'A5',
  LETTER: 'Letter'
};

const ORIENTATION_LABELS: Record<PageOrientation, string> = {
  portrait: 'Portrait',
  landscape: 'Landscape'
};

const MARGIN_LABELS: Record<PageMarginPreset, string> = {
  normal: 'Normal',
  narrow: 'Narrow',
  wide: 'Wide'
};

function matchMarginPreset(margins: PageMargins): PageMarginPreset {
  const preset = PAGE_MARGIN_PRESETS.find((name) =>
    (['top', 'right', 'bottom', 'left'] as const).every(
      (side) => PAGE_MARGIN_PRESETS_MM[name][side] === margins[side]
    )
  );
  return preset ?? 'normal';
}

export default function PageMenu({ editor }: { editor: Editor }) {
  const t = useTranslations('common');
  const fieldId = useId();
  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) {
        return null;
      }
      const setup = normalizePageSetup(editor.state.doc.attrs);
      return {
        editable: editor.isEditable,
        pageFormat: setup.pageFormat,
        orientation: setup.orientation,
        marginPreset: matchMarginPreset(setup.margins)
      };
    }
  });

  if (!state) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <ToolbarButton label={t('Page setup')} className="w-auto gap-1 px-2">
          <RiFileSettingsLine />
          <span className="hidden text-sm font-medium lg:inline">
            {t('Page setup')}
          </span>
          <RiArrowDownSLine className="opacity-60" />
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-3">
        <div className="space-y-1">
          <Label htmlFor={`${fieldId}-format`}>{t('Page format')}</Label>
          <Select
            value={state.pageFormat}
            disabled={!state.editable}
            onValueChange={(pageFormat) =>
              editor
                .chain()
                .focus()
                .setPageSetup({ pageFormat: pageFormat as PageFormat })
                .run()
            }
          >
            <SelectTrigger id={`${fieldId}-format`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_FORMATS.map((format) => (
                <SelectItem key={format} value={format}>
                  {FORMAT_LABELS[format]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor={`${fieldId}-orientation`}>{t('Orientation')}</Label>
          <Select
            value={state.orientation}
            disabled={!state.editable}
            onValueChange={(orientation) =>
              editor
                .chain()
                .focus()
                .setPageSetup({ orientation: orientation as PageOrientation })
                .run()
            }
          >
            <SelectTrigger id={`${fieldId}-orientation`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_ORIENTATIONS.map((orientation) => (
                <SelectItem key={orientation} value={orientation}>
                  {t(ORIENTATION_LABELS[orientation])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor={`${fieldId}-margins`}>{t('Margins')}</Label>
          <Select
            value={state.marginPreset}
            disabled={!state.editable}
            onValueChange={(preset) =>
              editor
                .chain()
                .focus()
                .setPageSetup({
                  margins: PAGE_MARGIN_PRESETS_MM[preset as PageMarginPreset]
                })
                .run()
            }
          >
            <SelectTrigger id={`${fieldId}-margins`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_MARGIN_PRESETS.map((preset) => (
                <SelectItem key={preset} value={preset}>
                  {t(MARGIN_LABELS[preset])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
