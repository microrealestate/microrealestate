import {
  RiAlignCenter,
  RiAlignLeft,
  RiAlignRight,
  RiArrowGoBackFill,
  RiArrowGoForwardLine,
  RiBold,
  RiDoubleQuotesR,
  RiFormatClear,
  RiImageFill,
  RiItalic,
  RiListOrdered,
  RiListUnordered,
  RiPrinterFill,
  RiSeparator,
  RiStrikethrough,
  RiSuperscript,
  RiTextWrap,
  RiUnderline
} from 'react-icons/ri';
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
import { useRef } from 'react';
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
  const fileInputRef = useRef(null);

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

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Convert to base64 and insert into editor
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result;
      if (src) {
        editor.chain().focus().setImage({ src }).run();
      }
    };
    reader.readAsDataURL(file);

    // Reset the input
    event.target.value = '';
  };

  const handleImageByUrl = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="flex">
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <RiArrowGoBackFill />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <RiArrowGoForwardLine />
      </Button>
      <Separator orientation="vertical" />
      <HeadingSelect editor={editor} />
      <Separator orientation="vertical" />
      <Toggle
        pressed={boldActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <RiBold />
      </Toggle>
      <Toggle
        pressed={italicActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <RiItalic />
      </Toggle>
      <Toggle
        pressed={underlineActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <RiUnderline />
      </Toggle>
      <Toggle
        pressed={strikeActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <RiStrikethrough />
      </Toggle>
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
      >
        <RiFormatClear />
      </Button>
      <Separator orientation="vertical" />
      <Toggle
        pressed={alignLeftActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <RiAlignLeft />
      </Toggle>
      <Toggle
        pressed={alignCenterActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <RiAlignCenter />
      </Toggle>
      <Toggle
        pressed={alignRightActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <RiAlignRight />
      </Toggle>
      <Separator orientation="vertical" />
      <Toggle
        pressed={superscriptActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
      >
        <RiSuperscript />
      </Toggle>
      <Separator orientation="vertical" />
      <Toggle
        pressed={bulletListActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <RiListUnordered />
      </Toggle>
      <Toggle
        pressed={orderedListActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <RiListOrdered />
      </Toggle>
      <Separator orientation="vertical" />
      <Toggle
        pressed={blockquoteActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <RiDoubleQuotesR />
      </Toggle>
      <Separator orientation="vertical" />
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().setHardBreak().run()}
      >
        <RiTextWrap />
      </Button>
      <Separator orientation="vertical" />
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <RiSeparator />
      </Button>
      <Separator orientation="vertical" />
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable}
        onClick={handleImageClick}
        title="Insert image from file"
      >
        <RiImageFill />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable}
        onClick={handleImageByUrl}
        title="Insert image from URL"
      >
        🔗
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
      {showPrintButton && (
        <>
          <Separator orientation="vertical" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePrint(editor)}
          >
            <RiPrinterFill />
          </Button>
        </>
      )}
    </div>
  );
};

export default FormatMenu;
