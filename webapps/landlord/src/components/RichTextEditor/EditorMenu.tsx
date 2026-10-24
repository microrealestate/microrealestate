import { Button } from '@microrealestate/commonui/components/ui/button';
import { Input } from '@microrealestate/commonui/components/ui/input';
import { TooltipProvider } from '@microrealestate/commonui/components/ui/tooltip';
import type { Editor } from '@tiptap/react';
import { useTranslations } from 'next-intl';
import { type ChangeEvent, useCallback } from 'react';
import { LuSave } from 'react-icons/lu';
import { RiFunctions, RiPrinterFill } from 'react-icons/ri';
import FormatMenu from './FormatMenu';
import { handlePrint } from './helpers';
import PageMenu from './PageMenu';
import TableMenu from './TableMenu';
import ReadOnlyBadge from './toolbar/ReadOnlyBadge';
import { ToolbarButton, ToolbarToggle } from './toolbar/ToolbarPrimitives';

type EditorMenuProps = {
  editor: Editor;
  title: string;
  showPrintButton?: boolean;
  hasFields: boolean;
  showFieldMenu: boolean;
  onToggleFieldMenu: () => void;
  saving?: boolean;
  onChange: (title: string) => void;
  onClose: () => void;
  editable: boolean;
  readOnlyReason?: string;
};

export default function EditorMenu({
  editor,
  title,
  showPrintButton,
  hasFields,
  showFieldMenu,
  onToggleFieldMenu,
  saving,
  onChange,
  onClose,
  editable,
  readOnlyReason
}: EditorMenuProps) {
  const t = useTranslations('common');

  const onTitleChange = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) => {
      onChange(evt.target.value);
    },
    [onChange]
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative z-10 shrink-0 space-y-2 rounded-tl-md rounded-tr-md border-b bg-card p-2 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          {editable ? (
            <Input
              name="title"
              defaultValue={title}
              onChange={onTitleChange}
              className="w-full min-w-0 sm:w-80"
              aria-label={t('Document title')}
            />
          ) : (
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="truncate font-medium">{title}</h2>
              <ReadOnlyBadge reason={readOnlyReason} />
            </div>
          )}

          <div className="ms-auto flex items-center gap-4 text-muted-foreground">
            {saving ? (
              <div className="flex items-center gap-1 whitespace-nowrap">
                <LuSave className="size-4" />
                <div
                  className="hidden text-sm sm:block"
                  data-cy="savingTextDocument"
                >
                  {t('Saving')}
                </div>
              </div>
            ) : null}
            {saving === false ? (
              <div className="text-sm" data-cy="savedTextDocument">
                {t('Saved')}
              </div>
            ) : null}
            <Button onClick={onClose} variant="secondary" data-cy="close">
              {t('Close')}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-y-1">
          {editable ? <FormatMenu editor={editor} /> : null}

          <div className="ms-auto flex items-center gap-1">
            <PageMenu editor={editor} />
            {showPrintButton ? (
              <ToolbarButton
                label={t('Print')}
                onClick={() => handlePrint(editor)}
              >
                <RiPrinterFill />
              </ToolbarButton>
            ) : null}
            {editable && hasFields ? (
              <ToolbarToggle
                label={t('Computed fields')}
                pressed={showFieldMenu}
                onClick={onToggleFieldMenu}
              >
                <RiFunctions />
              </ToolbarToggle>
            ) : null}
          </div>
        </div>

        {editable ? <TableMenu editor={editor} /> : null}
      </div>
    </TooltipProvider>
  );
}
