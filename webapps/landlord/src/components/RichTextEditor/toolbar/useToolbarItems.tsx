import { type Editor, useEditorState } from '@tiptap/react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import {
  RiAlignCenter,
  RiAlignLeft,
  RiAlignRight,
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiBold,
  RiDoubleQuotesR,
  RiFormatClear,
  RiItalic,
  RiListOrdered,
  RiListUnordered,
  RiStrikethrough,
  RiSuperscript,
  RiUnderline
} from 'react-icons/ri';
import { ToolbarButton, ToolbarToggle } from './ToolbarPrimitives';

export type ToolbarItem = {
  key: string;
  label: string;
  shortcut?: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  run: () => void;
};

export function renderInline(item: ToolbarItem) {
  if (item.active === undefined) {
    return (
      <ToolbarButton
        key={item.key}
        label={item.label}
        shortcut={item.shortcut}
        disabled={item.disabled}
        onClick={item.run}
      >
        {item.icon}
      </ToolbarButton>
    );
  }
  return (
    <ToolbarToggle
      key={item.key}
      label={item.label}
      shortcut={item.shortcut}
      pressed={item.active}
      disabled={item.disabled}
      onClick={item.run}
    >
      {item.icon}
    </ToolbarToggle>
  );
}

export type ToolbarItems = {
  history: ToolbarItem[];
  marks: ToolbarItem[];
  align: ToolbarItem[];
  blocks: ToolbarItem[];
  clear: ToolbarItem[];
};

export function useToolbarItems(editor: Editor): ToolbarItems | null {
  const t = useTranslations('common');
  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) {
        return null;
      }
      const editable = editor.isEditable;
      return {
        editable,
        canUndo: editable && editor.can().undo(),
        canRedo: editable && editor.can().redo(),
        boldActive: editor.isActive('bold'),
        italicActive: editor.isActive('italic'),
        underlineActive: editor.isActive('underline'),
        strikeActive: editor.isActive('strike'),
        superscriptActive: editor.isActive('superscript'),
        alignLeftActive: editor.isActive({ textAlign: 'left' }),
        alignCenterActive: editor.isActive({ textAlign: 'center' }),
        alignRightActive: editor.isActive({ textAlign: 'right' }),
        bulletListActive: editor.isActive('bulletList'),
        orderedListActive: editor.isActive('orderedList'),
        blockquoteActive: editor.isActive('blockquote')
      };
    }
  });

  if (!state) {
    return null;
  }

  const { editable } = state;

  const history: ToolbarItem[] = [
    {
      key: 'undo',
      label: t('Undo'),
      shortcut: 'Mod-Z',
      icon: <RiArrowGoBackLine />,
      disabled: !state.canUndo,
      run: () => editor.chain().focus().undo().run()
    },
    {
      key: 'redo',
      label: t('Redo'),
      shortcut: 'Mod-Shift-Z',
      icon: <RiArrowGoForwardLine />,
      disabled: !state.canRedo,
      run: () => editor.chain().focus().redo().run()
    }
  ];

  const allMarks: ToolbarItem[] = [
    {
      key: 'bold',
      label: t('Bold'),
      shortcut: 'Mod-B',
      icon: <RiBold />,
      active: state.boldActive,
      disabled: !editable,
      run: () => editor.chain().focus().toggleBold().run()
    },
    {
      key: 'italic',
      label: t('Italic'),
      shortcut: 'Mod-I',
      icon: <RiItalic />,
      active: state.italicActive,
      disabled: !editable,
      run: () => editor.chain().focus().toggleItalic().run()
    },
    {
      key: 'underline',
      label: t('Underline'),
      shortcut: 'Mod-U',
      icon: <RiUnderline />,
      active: state.underlineActive,
      disabled: !editable,
      run: () => editor.chain().focus().toggleUnderline().run()
    },
    {
      key: 'strike',
      label: t('Strikethrough'),
      shortcut: 'Mod-Shift-S',
      icon: <RiStrikethrough />,
      active: state.strikeActive,
      disabled: !editable,
      run: () => editor.chain().focus().toggleStrike().run()
    },
    {
      key: 'superscript',
      label: t('Superscript'),
      shortcut: 'Mod-.',
      icon: <RiSuperscript />,
      active: state.superscriptActive,
      disabled: !editable,
      run: () => editor.chain().focus().toggleSuperscript().run()
    }
  ];

  const clear: ToolbarItem[] = [
    {
      key: 'clear',
      label: t('Clear formatting'),
      icon: <RiFormatClear />,
      disabled: !editable,
      run: () => editor.chain().focus().unsetAllMarks().run()
    }
  ];

  const align: ToolbarItem[] = [
    {
      key: 'align-left',
      label: t('Align left'),
      shortcut: 'Mod-Shift-L',
      icon: <RiAlignLeft />,
      active: state.alignLeftActive,
      disabled: !editable,
      run: () => editor.chain().focus().setTextAlign('left').run()
    },
    {
      key: 'align-center',
      label: t('Align center'),
      shortcut: 'Mod-Shift-E',
      icon: <RiAlignCenter />,
      active: state.alignCenterActive,
      disabled: !editable,
      run: () => editor.chain().focus().setTextAlign('center').run()
    },
    {
      key: 'align-right',
      label: t('Align right'),
      shortcut: 'Mod-Shift-R',
      icon: <RiAlignRight />,
      active: state.alignRightActive,
      disabled: !editable,
      run: () => editor.chain().focus().setTextAlign('right').run()
    }
  ];

  const blocks: ToolbarItem[] = [
    {
      key: 'bullet-list',
      label: t('Bulleted list'),
      shortcut: 'Mod-Shift-8',
      icon: <RiListUnordered />,
      active: state.bulletListActive,
      disabled: !editable,
      run: () => editor.chain().focus().toggleBulletList().run()
    },
    {
      key: 'ordered-list',
      label: t('Numbered list'),
      shortcut: 'Mod-Shift-7',
      icon: <RiListOrdered />,
      active: state.orderedListActive,
      disabled: !editable,
      run: () => editor.chain().focus().toggleOrderedList().run()
    },
    {
      key: 'blockquote',
      label: t('Quote'),
      shortcut: 'Mod-Shift-B',
      icon: <RiDoubleQuotesR />,
      active: state.blockquoteActive,
      disabled: !editable,
      run: () => editor.chain().focus().toggleBlockquote().run()
    }
  ];

  return { history, marks: allMarks, align, blocks, clear };
}
