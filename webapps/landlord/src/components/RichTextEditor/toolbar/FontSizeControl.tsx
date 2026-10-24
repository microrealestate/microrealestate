import { Input } from '@microrealestate/commonui/components/ui/input';
// Side-effect import: the package augments `@tiptap/core` with `setFontSize`,
// and the augmentation is only in scope once the module is part of the program.
import '@tiptap/extension-text-style';
import { type Editor, useEditorState } from '@tiptap/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { LuAArrowDown, LuAArrowUp } from 'react-icons/lu';
import { ToolbarButton, ToolbarGroup } from './ToolbarPrimitives';

// Sizes are points, never pixels. The editor is a physical-paper model — the
// sheet is sized in mm and `richtexteditor.css` sets the base as `11pt` — so a
// point value prints at the size it shows on screen, which is the whole point
// of the control.
const FONT_SIZES = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72
] as const;
const DEFAULT_FONT_SIZE_PT = 11;
const MIN_FONT_SIZE_PT = 6;
const MAX_FONT_SIZE_PT = 200;
const PT_PER_PX = 72 / 96;

function parseSizeToPt(size: unknown): number | null {
  if (typeof size !== 'string') {
    return null;
  }
  const amount = Number.parseFloat(size);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  return Math.round(size.trim().endsWith('px') ? amount * PT_PER_PX : amount);
}

function resolveFontSizePt(editor: Editor): number {
  const fromMark = parseSizeToPt(editor.getAttributes('textStyle')?.fontSize);
  if (fromMark) {
    return fromMark;
  }
  try {
    const { node } = editor.view.domAtPos(editor.state.selection.from);
    const element =
      node.nodeType === Node.ELEMENT_NODE
        ? (node as HTMLElement)
        : node.parentElement;
    if (element) {
      const px = Number.parseFloat(window.getComputedStyle(element).fontSize);
      if (Number.isFinite(px) && px > 0) {
        return Math.round(px * PT_PER_PX);
      }
    }
  } catch {
    // domAtPos throws while the view is being torn down; the default is fine.
  }
  return DEFAULT_FONT_SIZE_PT;
}

function stepSize(current: number, direction: 1 | -1): number {
  const candidates =
    direction === 1
      ? FONT_SIZES.filter((size) => size > current)
      : FONT_SIZES.filter((size) => size < current);
  if (!candidates.length) {
    return direction === 1 ? FONT_SIZES[FONT_SIZES.length - 1] : FONT_SIZES[0];
  }
  return direction === 1 ? candidates[0] : candidates[candidates.length - 1];
}

export default function FontSizeControl({ editor }: { editor: Editor }) {
  const t = useTranslations('common');
  const [draft, setDraft] = useState<string | null>(null);
  const state = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            editable: editor.isEditable,
            size: resolveFontSizePt(editor)
          }
        : null
  });

  if (!state) {
    return null;
  }

  const apply = (size: number) => {
    const clamped = Math.min(
      MAX_FONT_SIZE_PT,
      Math.max(MIN_FONT_SIZE_PT, Math.round(size))
    );
    editor.chain().focus().setFontSize(`${clamped}pt`).run();
  };

  const commitDraft = () => {
    const typed = Number.parseFloat(draft ?? '');
    setDraft(null);
    if (Number.isFinite(typed) && typed > 0) {
      apply(typed);
    }
  };

  return (
    <ToolbarGroup>
      <ToolbarButton
        label={t('Decrease font size')}
        disabled={!state.editable}
        onClick={() => apply(stepSize(state.size, -1))}
      >
        <LuAArrowDown />
      </ToolbarButton>
      <Input
        value={draft ?? String(state.size)}
        disabled={!state.editable}
        inputMode="numeric"
        aria-label={t('Font size')}
        className="hidden h-9 w-14 px-1 text-center md:block"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitDraft();
          } else if (event.key === 'Escape') {
            setDraft(null);
          }
        }}
      />
      <ToolbarButton
        label={t('Increase font size')}
        disabled={!state.editable}
        onClick={() => apply(stepSize(state.size, 1))}
      >
        <LuAArrowUp />
      </ToolbarButton>
    </ToolbarGroup>
  );
}
