import { Button } from '@microrealestate/commonui/components/ui/button';
import type { Editor } from '@tiptap/react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useState } from 'react';
import { LuALargeSmall } from 'react-icons/lu';
import { RiAddLine, RiFileSettingsLine, RiPrinterLine } from 'react-icons/ri';
import ResponsiveDialog from '../../ResponsiveDialog';
import { handlePrint } from '../helpers';
import { PageSetupFields } from '../PageMenu';
import BlockStyleSelect from './BlockStyleSelect';
import FontSizeControl from './FontSizeControl';
import { getInsertItems } from './InsertMenu';
import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarMenuItem,
  ToolbarSeparator
} from './ToolbarPrimitives';
import { renderInline, useToolbarItems } from './useToolbarItems';

type Sheet = 'format' | 'insert' | 'page' | null;

const CORE_MARK_COUNT = 3;

function Sheet({
  open,
  onClose,
  title,
  children
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const t = useTranslations('common');
  return (
    <ResponsiveDialog
      open={open}
      setOpen={(value: boolean) => {
        if (!value) {
          onClose();
        }
      }}
      title={title}
      renderHeader={undefined}
      isLoading={false}
      renderContent={() => <div className="w-full space-y-4">{children}</div>}
      renderFooter={() => (
        <Button variant="outline" onClick={onClose}>
          {t('Close')}
        </Button>
      )}
    />
  );
}

export default function MobileToolbar({
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
  const [sheet, setSheet] = useState<Sheet>(null);

  if (!items) {
    return null;
  }

  const close = () => setSheet(null);
  const closeAfter = (run: () => void) => () => {
    close();
    run();
  };

  const pageAndPrint = (
    <>
      <ToolbarButton label={t('Page setup')} onClick={() => setSheet('page')}>
        <RiFileSettingsLine />
      </ToolbarButton>
      {showPrintButton ? (
        <ToolbarButton label={t('Print')} onClick={() => handlePrint(editor)}>
          <RiPrinterLine />
        </ToolbarButton>
      ) : null}
      <Sheet open={sheet === 'page'} onClose={close} title={t('Page setup')}>
        <PageSetupFields editor={editor} />
      </Sheet>
    </>
  );

  if (!editable) {
    return <div className="flex items-center justify-end">{pageAndPrint}</div>;
  }

  return (
    <div className="flex min-w-0 flex-1 flex-nowrap items-center *:shrink-0 [&_button]:w-8">
      <ToolbarGroup>{items.history.map(renderInline)}</ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        {items.marks.slice(0, CORE_MARK_COUNT).map(renderInline)}
      </ToolbarGroup>

      <div className="ms-auto flex items-center">
        <ToolbarButton label={t('Format')} onClick={() => setSheet('format')}>
          <LuALargeSmall />
        </ToolbarButton>
        <ToolbarButton label={t('Insert')} onClick={() => setSheet('insert')}>
          <RiAddLine />
        </ToolbarButton>
        {pageAndPrint}
      </div>

      <Sheet open={sheet === 'format'} onClose={close} title={t('Format')}>
        <div className="flex flex-wrap items-center gap-2">
          <BlockStyleSelect editor={editor} />
          <FontSizeControl editor={editor} />
        </div>
        <ToolbarGroup className="flex-wrap">
          {items.marks.map(renderInline)}
        </ToolbarGroup>
        <ToolbarGroup className="flex-wrap">
          {items.align.map(renderInline)}
          <ToolbarSeparator />
          {items.blocks.map(renderInline)}
          <ToolbarSeparator />
          {items.clear.map(renderInline)}
        </ToolbarGroup>
      </Sheet>

      <Sheet open={sheet === 'insert'} onClose={close} title={t('Insert')}>
        <div>
          {getInsertItems(editor, t).map((item) => (
            <ToolbarMenuItem
              key={item.key}
              label={item.label}
              shortcut={item.shortcut}
              icon={item.icon}
              onSelect={closeAfter(item.run)}
            />
          ))}
        </div>
      </Sheet>
    </div>
  );
}
