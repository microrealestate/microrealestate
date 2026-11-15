import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@microrealestate/commonui/components/ui/popover';
import type { Editor } from '@tiptap/react';
import { useTranslations } from 'next-intl';
import { Fragment, type ReactNode, useCallback, useState } from 'react';
import {
  RiArrowLeftSLine,
  RiFileSettingsLine,
  RiMore2Fill,
  RiPrinterLine
} from 'react-icons/ri';
import { handlePrint } from '../helpers';
import PageMenu, { PageSetupFields } from '../PageMenu';
import AlignMenu from './AlignMenu';
import BlockStyleSelect from './BlockStyleSelect';
import FontSizeControl from './FontSizeControl';
import InsertMenu, { getInsertItems } from './InsertMenu';
import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarMenuItem,
  ToolbarSeparator
} from './ToolbarPrimitives';
import {
  renderInline,
  type ToolbarItem,
  useToolbarItems
} from './useToolbarItems';

const BUTTON_WIDTH = 36;
const SEPARATOR_WIDTH = 9;
const CORE_MARK_COUNT = 3;

type Slot = 'clear' | 'blocks' | 'page' | 'insert' | 'extraMarks';
const COLLAPSE_ORDER: Slot[] = [
  'clear',
  'blocks',
  'page',
  'insert',
  'extraMarks'
];

function collapsedSlotCount(
  available: number | undefined,
  alwaysWidth: number,
  widths: Record<Slot, number>
): number {
  if (!available) {
    return 0;
  }
  for (let count = 0; count < COLLAPSE_ORDER.length; count++) {
    const inline = COLLAPSE_ORDER.slice(count).reduce(
      (width, slot) => width + widths[slot],
      0
    );
    const more = count > 0 ? SEPARATOR_WIDTH + BUTTON_WIDTH : 0;
    if (alwaysWidth + inline + more <= available) {
      return count;
    }
  }
  return COLLAPSE_ORDER.length;
}

function useElementWidth(): [
  (element: HTMLElement | null) => void,
  number | undefined
] {
  const [width, setWidth] = useState<number>();
  const ref = useCallback((element: HTMLElement | null) => {
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.borderBoxSize[0]?.inlineSize ?? entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

function menuRows(items: ToolbarItem[], onDone?: () => void) {
  return items.map((item) => (
    <ToolbarMenuItem
      key={item.key}
      label={item.label}
      shortcut={item.shortcut}
      icon={item.icon}
      active={item.active}
      disabled={item.disabled}
      onSelect={() => {
        item.run();
        onDone?.();
      }}
    />
  ));
}

export default function DesktopToolbar({
  editor,
  editable,
  showPrintButton
}: {
  editor: Editor;
  editable: boolean;
  showPrintButton?: boolean;
}) {
  const t = useTranslations('common');
  const items = useToolbarItems(editor);
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreView, setMoreView] = useState<'menu' | 'page'>('menu');
  const [rootRef, available] = useElementWidth();
  const [fixedRef, fixedWidth = 0] = useElementWidth();
  const [insertRef, insertWidth = 0] = useElementWidth();
  const [pageRef, pageWidth = 0] = useElementWidth();
  const [alignRef, alignWidth = 0] = useElementWidth();

  if (!items) {
    return null;
  }

  const print = showPrintButton ? (
    <ToolbarButton label={t('Print')} onClick={() => handlePrint(editor)}>
      <RiPrinterLine />
    </ToolbarButton>
  ) : null;

  if (!editable) {
    return (
      <div className="flex items-center gap-1">
        {print}
        <PageMenu editor={editor} />
      </div>
    );
  }

  const coreMarks = items.marks.slice(0, CORE_MARK_COUNT);
  const extraMarks = items.marks.slice(CORE_MARK_COUNT);
  const widths: Record<Slot, number> = {
    clear: SEPARATOR_WIDTH + BUTTON_WIDTH,
    blocks: SEPARATOR_WIDTH + items.blocks.length * BUTTON_WIDTH,
    page: pageWidth,
    insert: SEPARATOR_WIDTH + insertWidth,
    extraMarks: extraMarks.length * BUTTON_WIDTH
  };
  const collapsed = new Set(
    COLLAPSE_ORDER.slice(
      0,
      collapsedSlotCount(
        available,
        fixedWidth + SEPARATOR_WIDTH + alignWidth,
        widths
      )
    )
  );
  const shows = (slot: Slot) => !collapsed.has(slot);

  const closeMore = () => setMoreOpen(false);
  const moreSections: { key: string; content: ReactNode }[] = [];
  if (collapsed.has('extraMarks')) {
    moreSections.push({ key: 'marks', content: menuRows(extraMarks) });
  }
  if (collapsed.has('blocks')) {
    moreSections.push({ key: 'blocks', content: menuRows(items.blocks) });
  }
  if (collapsed.has('clear')) {
    moreSections.push({ key: 'clear', content: menuRows(items.clear) });
  }
  if (collapsed.has('insert')) {
    moreSections.push({
      key: 'insert',
      content: menuRows(getInsertItems(editor, t), closeMore)
    });
  }
  if (collapsed.has('page')) {
    moreSections.push({
      key: 'page',
      content: (
        <ToolbarMenuItem
          label={t('Page setup')}
          icon={<RiFileSettingsLine />}
          onSelect={() => setMoreView('page')}
        />
      )
    });
  }

  return (
    <div
      ref={rootRef}
      className="flex min-w-0 flex-1 flex-nowrap items-center overflow-hidden *:shrink-0"
    >
      <div ref={fixedRef} className="flex items-center">
        <ToolbarGroup>
          {items.history.map(renderInline)}
          {print}
        </ToolbarGroup>
        <ToolbarSeparator />
        <BlockStyleSelect editor={editor} />
        <ToolbarSeparator />
        <FontSizeControl editor={editor} />
        <ToolbarSeparator />
        <ToolbarGroup>{coreMarks.map(renderInline)}</ToolbarGroup>
      </div>
      {shows('extraMarks') ? (
        <ToolbarGroup>{extraMarks.map(renderInline)}</ToolbarGroup>
      ) : null}
      <ToolbarSeparator />
      <div ref={alignRef} className="flex">
        <AlignMenu items={items.align} />
      </div>
      {shows('blocks') ? (
        <>
          <ToolbarSeparator />
          <ToolbarGroup>{items.blocks.map(renderInline)}</ToolbarGroup>
        </>
      ) : null}
      {shows('clear') ? (
        <>
          <ToolbarSeparator />
          <ToolbarGroup>{items.clear.map(renderInline)}</ToolbarGroup>
        </>
      ) : null}
      {shows('insert') ? (
        <>
          <ToolbarSeparator />
          <div ref={insertRef} className="flex">
            <InsertMenu editor={editor} />
          </div>
        </>
      ) : null}
      {shows('page') ? (
        <div ref={pageRef} className="flex">
          <PageMenu editor={editor} />
        </div>
      ) : null}
      {moreSections.length ? (
        <>
          <ToolbarSeparator />
          <Popover
            open={moreOpen}
            onOpenChange={(open) => {
              setMoreOpen(open);
              if (!open) {
                setMoreView('menu');
              }
            }}
          >
            <PopoverTrigger asChild>
              <ToolbarButton label={t('More tools')}>
                <RiMore2Fill />
              </ToolbarButton>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-1">
              {moreView === 'page' ? (
                <div className="space-y-2 p-1">
                  <ToolbarMenuItem
                    label={t('Page setup')}
                    icon={<RiArrowLeftSLine className="rtl:-scale-x-100" />}
                    onSelect={() => setMoreView('menu')}
                  />
                  <div className="px-2 pb-2">
                    <PageSetupFields editor={editor} />
                  </div>
                </div>
              ) : (
                moreSections.map(({ key, content }, index) => (
                  <Fragment key={key}>
                    {index > 0 ? <div className="my-1 h-px bg-border" /> : null}
                    {content}
                  </Fragment>
                ))
              )}
            </PopoverContent>
          </Popover>
        </>
      ) : null}
    </div>
  );
}
