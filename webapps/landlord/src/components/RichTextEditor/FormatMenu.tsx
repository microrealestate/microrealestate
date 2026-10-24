import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@microrealestate/commonui/components/ui/popover';
import { type Editor, useEditorState } from '@tiptap/react';
import { useTranslations } from 'next-intl';
import { Fragment, type ReactNode } from 'react';
import {
  RiAlignCenter,
  RiAlignLeft,
  RiAlignRight,
  RiArrowGoBackFill,
  RiArrowGoForwardLine,
  RiBold,
  RiDoubleQuotesR,
  RiFormatClear,
  RiItalic,
  RiListOrdered,
  RiListUnordered,
  RiMore2Fill,
  RiStrikethrough,
  RiSuperscript,
  RiUnderline
} from 'react-icons/ri';
import { useMediaQuery } from 'usehooks-ts';
import BlockStyleSelect from './toolbar/BlockStyleSelect';
import FontSizeControl from './toolbar/FontSizeControl';
import InsertMenu from './toolbar/InsertMenu';
import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarMenuItem,
  ToolbarSeparator,
  ToolbarToggle
} from './toolbar/ToolbarPrimitives';

type ToolbarItem = {
  key: string;
  label: string;
  shortcut?: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  run: () => void;
};

function renderInline(item: ToolbarItem) {
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

export default function FormatMenu({ editor }: { editor: Editor }) {
  const t = useTranslations('common');
  // Matches the breakpoint the rest of the app splits on
  // (`ResponsiveDialog.js`, `dashboard/Shortcuts.tsx`).
  const isWide = useMediaQuery('(min-width: 768px)');
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
      icon: <RiArrowGoBackFill />,
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

  const marks: ToolbarItem[] = [
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

  const collapsible = [history, clear, align, blocks];
  const overflow = isWide ? [] : collapsible;

  return (
    <div className="flex flex-wrap items-center gap-y-1">
      {isWide ? (
        <>
          <ToolbarGroup>{history.map(renderInline)}</ToolbarGroup>
          <ToolbarSeparator />
        </>
      ) : null}

      <BlockStyleSelect editor={editor} />
      <ToolbarSeparator />

      <FontSizeControl editor={editor} />
      <ToolbarSeparator />

      <ToolbarGroup>{marks.map(renderInline)}</ToolbarGroup>

      {isWide ? (
        <>
          <ToolbarSeparator />
          <ToolbarGroup>{clear.map(renderInline)}</ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarGroup>{align.map(renderInline)}</ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarGroup>{blocks.map(renderInline)}</ToolbarGroup>
        </>
      ) : null}

      <ToolbarSeparator />
      <InsertMenu editor={editor} />

      {overflow.length ? (
        <>
          <ToolbarSeparator />
          <Popover>
            <PopoverTrigger asChild>
              <ToolbarButton label={t('More formatting')}>
                <RiMore2Fill />
              </ToolbarButton>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-60 p-1">
              {overflow.map((group, index) => (
                <Fragment key={group[0].key}>
                  {index > 0 ? <div className="my-1 h-px bg-border" /> : null}
                  {group.map((item) => (
                    <ToolbarMenuItem
                      key={item.key}
                      label={item.label}
                      shortcut={item.shortcut}
                      icon={item.icon}
                      active={item.active}
                      disabled={item.disabled}
                      onSelect={item.run}
                    />
                  ))}
                </Fragment>
              ))}
            </PopoverContent>
          </Popover>
        </>
      ) : null}
    </div>
  );
}
