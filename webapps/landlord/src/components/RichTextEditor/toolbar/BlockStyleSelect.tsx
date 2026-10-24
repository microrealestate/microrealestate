import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@microrealestate/commonui/components/ui/select';
import { type Editor, useEditorState } from '@tiptap/react';
import { useTranslations } from 'next-intl';

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

// Values are strings because Radix Select is a string API. Labels are written
// out one by one rather than built from the level so
// `scripts/extractlocalizedstrings.js` can harvest them.
const BLOCK_STYLES = [
  { level: 0, label: 'Normal', preview: '' },
  { level: 1, label: 'Heading 1', preview: 'text-xl font-semibold' },
  { level: 2, label: 'Heading 2', preview: 'text-lg font-semibold' },
  { level: 3, label: 'Heading 3', preview: 'text-base font-semibold' },
  { level: 4, label: 'Heading 4', preview: 'text-sm font-semibold' },
  { level: 5, label: 'Heading 5', preview: 'text-sm font-medium' },
  { level: 6, label: 'Heading 6', preview: 'text-xs font-medium' }
] as const;

function getHeadingLevel(editor: Editor): number {
  for (const { level } of BLOCK_STYLES) {
    if (level > 0 && editor.isActive('heading', { level })) {
      return level;
    }
  }
  return 0;
}

export default function BlockStyleSelect({ editor }: { editor: Editor }) {
  const t = useTranslations('common');
  const state = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            editable: editor.isEditable,
            level: String(getHeadingLevel(editor))
          }
        : null
  });

  if (!state) {
    return null;
  }

  const onValueChange = (value: string) => {
    const level = Number(value);
    if (level === 0) {
      editor.chain().focus().setParagraph().run();
      return;
    }
    editor
      .chain()
      .focus()
      .setHeading({ level: level as HeadingLevel })
      .run();
  };

  return (
    <Select
      value={state.level}
      onValueChange={onValueChange}
      disabled={!state.editable}
    >
      <SelectTrigger className="w-32 md:w-40" aria-label={t('Text style')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {BLOCK_STYLES.map(({ level, label, preview }) => (
          <SelectItem key={level} value={String(level)}>
            <span className={preview}>{t(label)}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
