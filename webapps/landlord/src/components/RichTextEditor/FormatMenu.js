import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import { Button } from '../ui/button';
import { handlePrint } from './helpers';
import { Separator } from '../ui/separator';
import { Toggle } from '../ui/toggle';
import { useState } from 'react';
import useTranslation from 'next-translate/useTranslation';

const getHeadingLevel = (editor) => {
  if (!editor) {
    return 0;
  }

  if (editor.isActive('heading', { level: 1 })) {
    return 1;
  }
  if (editor.isActive('heading', { level: 2 })) {
    return 2;
  }
  if (editor.isActive('heading', { level: 3 })) {
    return 3;
  }
  if (editor.isActive('heading', { level: 4 })) {
    return 4;
  }
  if (editor.isActive('heading', { level: 5 })) {
    return 5;
  }
  if (editor.isActive('heading', { level: 6 })) {
    return 6;
  }

  return 0;
};

function HeadingSelect({ editor }) {
  const { t } = useTranslation('common');
  const headingLevel = getHeadingLevel(editor);
  const handleHeadingChange = (level) => {
    if (Number(level) > 0) {
      editor.chain().focus().toggleHeading({ level }).run();
    } else {
      editor.chain().focus().toggleHeading({ level: headingLevel }).run();
    }
  };

  return (
    <Select
      value={headingLevel}
      onValueChange={handleHeadingChange}
      disabled={!editor.isEditable}
    >
      <SelectTrigger className="w-56 mx-1">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={1}>{t('Heading 1')}</SelectItem>
        <SelectItem value={2}>{t('Heading 2')}</SelectItem>
        <SelectItem value={3}>{t('Heading 3')}</SelectItem>
        <SelectItem value={4}>{t('Heading 4')}</SelectItem>
        <SelectItem value={5}>{t('Heading 5')}</SelectItem>
        <SelectItem value={6}>{t('Heading 6')}</SelectItem>
        <SelectItem value={0}>{t('Normal')}</SelectItem>
      </SelectContent>
    </Select>
  );
}

const FormatMenu = ({ editor, showPrintButton }) => {
  if (!editor) {
    return null;
  }

  const boldActive = editor.isActive('bold');
  const italicActive = editor.isActive('italic');
  const underlineActive = editor.isActive('underline');
  const strikeActive = editor.isActive('strike');
  const alignLeftActive = editor.isActive({ textAlign: 'left' });
  const alignCenterActive = editor.isActive({ textAlign: 'center' });
  const alignRightActive = editor.isActive({ textAlign: 'right' });
  const bulletListActive = editor.isActive('bulletList');
  const orderedListActive = editor.isActive('orderedList');
  const blockquoteActive = editor.isActive('blockquote');
  const superscriptActive = editor.isActive('superscript');

  return (
    <div className="flex">
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <i className="ri-arrow-go-back-line"></i>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <i className="ri-arrow-go-forward-line"></i>
      </Button>
      <Separator orientation="vertical" />
      <HeadingSelect editor={editor} />
      <Separator orientation="vertical" />
      <Toggle
        pressed={boldActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <i className="ri-bold"></i>
      </Toggle>
      <Toggle
        pressed={italicActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <i className="ri-italic"></i>
      </Toggle>
      <Toggle
        pressed={underlineActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <i className="ri-underline"></i>
      </Toggle>
      <Toggle
        pressed={strikeActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <i className="ri-strikethrough"></i>
      </Toggle>
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
      >
        <i className="ri-format-clear"></i>
      </Button>
      <Separator orientation="vertical" />
      <Toggle
        pressed={alignLeftActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <i className="ri-align-left"></i>
      </Toggle>
      <Toggle
        pressed={alignCenterActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <i className="ri-align-center"></i>
      </Toggle>
      <Toggle
        pressed={alignRightActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <i className="ri-align-right"></i>
      </Toggle>
      <Separator orientation="vertical" />
      <Toggle
        pressed={superscriptActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
      >
        <i className="ri-superscript"></i>
      </Toggle>
      <Separator orientation="vertical" />
      <Toggle
        pressed={bulletListActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <i className="ri-list-unordered"></i>
      </Toggle>
      <Toggle
        pressed={orderedListActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <i className="ri-list-ordered"></i>
      </Toggle>
      <Separator orientation="vertical" />
      <Toggle
        pressed={blockquoteActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <i className="ri-double-quotes-r"></i>
      </Toggle>
      <Separator orientation="vertical" />
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().setHardBreak().run()}
      >
        <i className="ri-text-wrap"></i>
      </Button>
      <Separator orientation="vertical" />
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <i className="ri-separator"></i>
      </Button>
      {showPrintButton && (
        <>
          <Separator orientation="vertical" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePrint(editor)}
          >
            <i className="ri-printer-fill"></i>
          </Button>
        </>
      )}
    </div>
  );
};

export default FormatMenu;
