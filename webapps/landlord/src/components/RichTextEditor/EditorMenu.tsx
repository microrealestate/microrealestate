import { Input } from '@microrealestate/commonui/components/ui/input';
import { TooltipProvider } from '@microrealestate/commonui/components/ui/tooltip';
import type { Editor } from '@tiptap/react';
import { useTranslations } from 'next-intl';
import { type ChangeEvent, useCallback } from 'react';
import { LuSave } from 'react-icons/lu';
import { RiArrowLeftLine } from 'react-icons/ri';
import FormatMenu from './FormatMenu';
import TableMenu from './TableMenu';
import ReadOnlyBadge from './toolbar/ReadOnlyBadge';
import { ToolbarButton } from './toolbar/ToolbarPrimitives';

type EditorMenuProps = {
  editor: Editor;
  title: string;
  showPrintButton?: boolean;
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
        <div className="flex flex-nowrap items-center gap-2">
          <ToolbarButton label={t('Close')} onClick={onClose} data-cy="close">
            <RiArrowLeftLine className="rtl:-scale-x-100" />
          </ToolbarButton>
          {editable ? (
            <Input
              name="title"
              defaultValue={title}
              onChange={onTitleChange}
              className="min-w-0 flex-1 sm:max-w-80"
              aria-label={t('Document title')}
            />
          ) : (
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="truncate font-medium">{title}</h2>
              <ReadOnlyBadge reason={readOnlyReason} />
            </div>
          )}

          <div className="flex shrink-0 items-center text-muted-foreground">
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
          </div>
        </div>

        <FormatMenu
          editor={editor}
          editable={editable}
          showPrintButton={showPrintButton}
        />

        {editable ? <TableMenu editor={editor} /> : null}
      </div>
    </TooltipProvider>
  );
}
