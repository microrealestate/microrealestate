import { Button } from '@microrealestate/commonui/components/ui/button';
import { Input } from '@microrealestate/commonui/components/ui/input';
import type { Editor } from '@tiptap/react';
import _ from 'lodash';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { RiCloseLine } from 'react-icons/ri';

// `TemplateNode.js` registers this command but is still JavaScript, so it
// carries no types. Declare them here until that file is migrated.
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    template: {
      addTemplate: (id: string, label: string) => ReturnType;
    };
  }
}

type Field = { _id: string; marker: string };

export default function FieldMenu({
  editor,
  fields,
  onClose
}: {
  editor: Editor;
  fields: Field[];
  onClose: () => void;
}) {
  const t = useTranslations('common');
  const [search, setSearch] = useState('');

  const filteredFields = useMemo(() => {
    if (!search) {
      return fields;
    }
    const textToSearch = _.deburr(search.toLowerCase());
    return fields.filter(({ _id }) =>
      _.deburr(t(_id).toLowerCase()).includes(textToSearch)
    );
  }, [fields, search, t]);

  const onInsertField = (field: Field) => () => {
    editor.commands.addTemplate(field.marker, t(field._id));
    editor.commands.focus();
  };

  return (
    <aside className="absolute inset-y-0 right-0 z-40 flex w-full max-w-96 flex-col border-l bg-card shadow-xl lg:static lg:z-auto lg:w-96 lg:max-w-none lg:shadow-none">
      <div className="flex items-center gap-2 border-b p-3">
        <Input
          value={search}
          placeholder={t('Search')}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 lg:hidden"
          aria-label={t('Close')}
          onClick={onClose}
        >
          <RiCloseLine />
        </Button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        {filteredFields.map((field) => (
          <Button
            variant="outline"
            key={field._id}
            onClick={onInsertField(field)}
            className="w-full justify-start"
          >
            {t(field._id)}
          </Button>
        ))}
      </div>
    </aside>
  );
}
