import { Box, Divider, InputBase, MenuItem, Select } from '@material-ui/core';
import { useCallback, useEffect, useState } from 'react';

import EditorButton from './EditorButton';
import FormatToolbar from './FormatToolbar';
import { handlePrint } from './helpers';
import { withStyles } from '@material-ui/core/styles';

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

const StyledSelect = withStyles(() => ({
  root: {
    paddingLeft: '4px',
  },
}))(Select);

const HeadingSelect = ({ editor }) => {
  const [headingLevel, setHeadingLevel] = useState(getHeadingLevel(editor));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setHeadingLevel(getHeadingLevel(editor));
  });

  const handleHeadingChange = useCallback(
    (e) => {
      const level = e.target.value;
      if (level > 0) {
        editor.chain().focus().toggleHeading({ level }).run();
      } else {
        editor.chain().focus().toggleHeading({ level: headingLevel }).run();
      }
      setHeadingLevel(level);
    },
    [editor, headingLevel]
  );

  return (
    <StyledSelect
      value={headingLevel}
      onChange={handleHeadingChange}
      input={<InputBase />}
      disabled={!editor.isEditable}
    >
      <MenuItem value={1}>
        <Box width={80}>Heading 1</Box>
      </MenuItem>
      <MenuItem value={2}>
        <Box width={80}>Heading 2</Box>
      </MenuItem>
      <MenuItem value={3}>
        <Box width={80}>Heading 3</Box>
      </MenuItem>
      <MenuItem value={4}>
        <Box width={80}>Heading 4</Box>
      </MenuItem>
      <MenuItem value={5}>
        <Box width={80}>Heading 5</Box>
      </MenuItem>
      <MenuItem value={6}>
        <Box width={80}>Heading 6</Box>
      </MenuItem>
      <MenuItem value={0}>
        <Box width={80}>Normal</Box>
      </MenuItem>
    </StyledSelect>
  );
};

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
    <FormatToolbar>
      <EditorButton
        iconType="ri-arrow-go-back-line"
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <EditorButton
        iconType="ri-arrow-go-forward-line"
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().redo().run()}
      />
      <Divider orientation="vertical" flexItem />
      <HeadingSelect editor={editor} />
      <Divider orientation="vertical" flexItem />
      <EditorButton
        iconType="ri-bold"
        selected={boldActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <EditorButton
        iconType="ri-italic"
        selected={italicActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <EditorButton
        iconType="ri-underline"
        selected={underlineActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <EditorButton
        iconType="ri-strikethrough"
        selected={strikeActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <EditorButton
        iconType="ri-format-clear"
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
      />
      <Divider orientation="vertical" flexItem />
      <EditorButton
        iconType="ri-align-left"
        selected={alignLeftActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      />
      <EditorButton
        iconType="ri-align-center"
        selected={alignCenterActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      />
      <EditorButton
        iconType="ri-align-right"
        selected={alignRightActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      />
      <Divider orientation="vertical" flexItem />
      <EditorButton
        iconType="ri-superscript"
        selected={superscriptActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
      />
      <Divider orientation="vertical" flexItem />
      <EditorButton
        iconType="ri-list-unordered"
        selected={bulletListActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <EditorButton
        iconType="ri-list-ordered"
        selected={orderedListActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <Divider orientation="vertical" flexItem />
      <EditorButton
        iconType="ri-double-quotes-r"
        selected={blockquoteActive}
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <Divider orientation="vertical" flexItem />
      <EditorButton
        iconType="ri-text-wrap"
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().setHardBreak().run()}
      />
      <Divider orientation="vertical" flexItem />
      <EditorButton
        iconType="ri-separator"
        disabled={!editor.isEditable}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />
      {showPrintButton && (
        <>
          <Divider orientation="vertical" flexItem />
          <EditorButton
            iconType="ri-printer-fill"
            onClick={() => handlePrint(editor)}
          />
        </>
      )}
    </FormatToolbar>
  );
};

export default FormatMenu;
