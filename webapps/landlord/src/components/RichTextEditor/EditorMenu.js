import { useCallback, useState } from 'react';
import { Button } from '../ui/button';
import FieldMenu from './FieldMenu';
import FormatMenu from './FormatMenu';
import { Input } from '../ui/input';
import { LuSave } from 'react-icons/lu';
import { Switch } from '../ui/switch';
import TableMenu from './TableMenu';
import useTranslation from 'next-translate/useTranslation';

const EditorMenu = ({
  editor,
  title,
  showPrintButton,
  fields,
  saving,
  onChange,
  onClose,
  editable
}) => {
  const { t } = useTranslation('common');
  const [showFieldMenu, setShowFieldMenu] = useState(fields?.length && true);

  const onTitleChange = useCallback(
    (evt) => {
      onChange(evt.target.value);
    },
    [onChange]
  );

  const onShowFieldMenuChange = useCallback(() => {
    setShowFieldMenu(!showFieldMenu);
  }, [showFieldMenu]);

  return editor ? (
    <>
      <div className="top-0 sticky z-50 bg-card shadow-md p-2 pb-2">
        <div className="flex items-center justify-between m-2">
          <Input
            name="title"
            defaultValue={title}
            onChange={onTitleChange}
            readOnly={!editable}
            className="w-80"
            aria-label={t('Document title')}
          />

          <div className="flex items-center gap-10 text-muted-foreground">
            {saving ? (
              <div className="flex items-center whitespace-nowrap gap-1 ml-6">
                <LuSave className="size-4" />
                <div className="text-sm" data-cy="savingTextDocument">
                  {t('Saving')}
                </div>
              </div>
            ) : null}
            {saving === false ? (
              <div className="text-sm ml-6" data-cy="savedTextDocument">
                {t('Saved')}
              </div>
            ) : null}
            <Button onClick={onClose} variant="secondary" data-cy="close">
              {t('Close')}
            </Button>
          </div>
        </div>
        <div className="flex items-end justify-between mr-2">
          <div className="flex flex-col gap-1">
            <FormatMenu editor={editor} showPrintButton={showPrintButton} />
            <TableMenu editor={editor} />
          </div>
          {fields?.length > 0 && (
            <div className="flex items-center gap-2">
              <Switch
                checked={showFieldMenu}
                onCheckedChange={onShowFieldMenuChange}
              />
              <span>{t('Computed fields')}</span>
            </div>
          )}
        </div>
      </div>
      {showFieldMenu ? <FieldMenu editor={editor} fields={fields} /> : null}
    </>
  ) : null;
};

export default EditorMenu;
