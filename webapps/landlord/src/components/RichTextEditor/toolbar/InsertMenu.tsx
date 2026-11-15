import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@microrealestate/commonui/components/ui/popover';
import { type Editor, useEditorState } from '@tiptap/react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useState } from 'react';
import {
  RiAddLine,
  RiArrowDownSLine,
  RiPageSeparator,
  RiSeparator,
  RiTableLine,
  RiTextWrap
} from 'react-icons/ri';
import '../extensions/PageBreak';
import { ToolbarMenuItem } from './ToolbarPrimitives';

export type InsertItem = {
  key: string;
  label: string;
  shortcut?: string;
  icon: ReactNode;
  run: () => void;
};

export function getInsertItems(
  editor: Editor,
  t: ReturnType<typeof useTranslations>
): InsertItem[] {
  return [
    {
      key: 'table',
      label: t('Table'),
      icon: <RiTableLine />,
      run: () =>
        editor
          .chain()
          .focus()
          .insertTable({ rows: 1, cols: 2, withHeaderRow: false })
          .run()
    },
    {
      key: 'horizontal-line',
      label: t('Horizontal line'),
      icon: <RiSeparator />,
      run: () => editor.chain().focus().setHorizontalRule().run()
    },
    {
      key: 'line-break',
      label: t('Line break'),
      shortcut: 'Shift-Enter',
      icon: <RiTextWrap />,
      run: () => editor.chain().focus().setHardBreak().run()
    },
    {
      key: 'page-break',
      label: t('Insert page break'),
      icon: <RiPageSeparator />,
      run: () => editor.chain().focus().insertPageBreak().run()
    }
  ];
}

export default function InsertMenu({ editor }: { editor: Editor }) {
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);
  const state = useEditorState({
    editor,
    selector: ({ editor }) => (editor ? { editable: editor.isEditable } : null)
  });

  if (!state) {
    return null;
  }

  const run = (insert: () => void) => () => {
    setOpen(false);
    insert();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={!state.editable}
          aria-label={t('Insert')}
          className="h-9 gap-1 px-2"
        >
          <RiAddLine />
          <span className="hidden md:inline">{t('Insert')}</span>
          <RiArrowDownSLine className="opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-1">
        {getInsertItems(editor, t).map((item) => (
          <ToolbarMenuItem
            key={item.key}
            label={item.label}
            shortcut={item.shortcut}
            icon={item.icon}
            onSelect={run(item.run)}
          />
        ))}
      </PopoverContent>
    </Popover>
  );
}
