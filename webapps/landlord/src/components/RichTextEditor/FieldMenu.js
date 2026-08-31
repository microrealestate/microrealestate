import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader
} from '@microrealestate/commonui/components/ui/card';
import { Input } from '@microrealestate/commonui/components/ui/input';
import _ from 'lodash';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export default function FieldMenu({ editor, fields }) {
  const t = useTranslations('common');
  const [filteredFields, setFilteredFields] = useState(fields);

  const onSearch = (e) => {
    const text = e.target.value;
    setFilteredFields(
      fields.filter(({ _id }) => {
        if (!text) {
          return true;
        }
        const title = _.deburr(t(_id).toLowerCase());
        const textToSearch = _.deburr(text.toLowerCase());
        if (title.indexOf(textToSearch) !== -1) {
          return true;
        }

        return false;
      })
    );
  };

  const onInsertField = (field) => () => {
    // TODO: check why editor.chain().addTemplat(...).focus() doesn't work
    editor.commands.addTemplate(field.marker, t(field._id));
    editor.commands.focus();
  };

  return (
    <Card className="z-50 fixed top-44 bottom-4 right-2 w-96">
      <CardHeader>
        <Input placeholder={t('Search')} onChange={onSearch} />
      </CardHeader>
      <CardContent className="absolute left-0 right-0 top-24 bottom-0 space-y-1 overflow-y-auto">
        {filteredFields.map((field) => {
          return (
            <Button
              variant="outline"
              key={field._id}
              onClick={onInsertField(field)}
              className="w-full justify-start"
            >
              {t(field._id)}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
