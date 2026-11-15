import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@microrealestate/commonui/components/ui/accordion';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { Input } from '@microrealestate/commonui/components/ui/input';
import type { Editor } from '@tiptap/react';
import _ from 'lodash';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { LuPanelLeftClose } from 'react-icons/lu';
import { RiAddLine, RiBracesLine } from 'react-icons/ri';
import ResponsiveDialog from '../ResponsiveDialog';

// `TemplateNode.js` registers this command but is still JavaScript, so it
// carries no types. Declare them here until that file is migrated.
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    template: {
      addTemplate: (id: string, label: string) => ReturnType;
    };
  }
}

const FIELD_GROUPS = [
  'document',
  'landlord',
  'tenant',
  'property',
  'lease'
] as const;
type FieldGroup = (typeof FIELD_GROUPS)[number];

export type Field = {
  _id: string;
  marker: string;
  group?: FieldGroup;
  label?: string;
};

type Translate = ReturnType<typeof useTranslations>;

function fieldGroup(field: Field): FieldGroup {
  return field.group ?? 'document';
}

function groupTitle(t: Translate, group: FieldGroup): string {
  switch (group) {
    case 'landlord':
      return t('Landlord');
    case 'tenant':
      return t('Tenant');
    case 'property':
      return t('Property');
    case 'lease':
      return t('Lease');
    default:
      return t('Document');
  }
}

export function fieldLabel(t: Translate, field: Field): string {
  return field.label ?? t(field._id);
}

export function chipLabel(t: Translate, field: Field): string {
  const group = fieldGroup(field);
  const label = fieldLabel(t, field);
  if (group === 'document') {
    return label;
  }
  return t('{section}: {field}', {
    section: groupTitle(t, group),
    field: label
  });
}

export function FieldMenuStrip({ onOpen }: { onOpen: () => void }) {
  const t = useTranslations('common');
  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        aria-label={t('Computed fields')}
        aria-expanded={false}
        data-cy="fieldMenuStrip"
        className="hidden w-10 shrink-0 flex-col items-center gap-3 border-e bg-card py-3 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex"
      >
        <RiBracesLine className="size-4" />
        <span className="text-sm [writing-mode:vertical-rl]">
          {t('Computed fields')}
        </span>
      </button>
      <Button
        size="icon"
        onClick={onOpen}
        aria-label={t('Computed fields')}
        aria-expanded={false}
        className="absolute bottom-4 start-4 z-30 rounded-full shadow-lg lg:hidden"
      >
        <RiBracesLine className="size-4" />
      </Button>
    </>
  );
}

function normalize(text: string) {
  return _.deburr(text.toLowerCase());
}

type FieldMenuBodyProps = {
  editor: Editor;
  fields: Field[];
  openGroups: string[] | null;
  onOpenGroupsChange: (groups: string[]) => void;
  onInsert?: () => void;
};

function FieldMenuBody({
  editor,
  fields,
  openGroups,
  onOpenGroupsChange,
  onInsert,
  className
}: FieldMenuBodyProps & { className?: string }) {
  const t = useTranslations('common');
  const [search, setSearch] = useState('');

  const sections = useMemo(() => {
    const textToSearch = normalize(search.trim());
    return FIELD_GROUPS.map((group) => {
      const title = groupTitle(t, group);
      const groupFields = fields.filter((field) => fieldGroup(field) === group);
      return {
        group,
        title,
        fields:
          !textToSearch || normalize(title).includes(textToSearch)
            ? groupFields
            : groupFields.filter((field) =>
                normalize(fieldLabel(t, field)).includes(textToSearch)
              )
      };
    }).filter((section) => section.fields.length > 0);
  }, [fields, search, t]);

  const searching = search.trim() !== '';
  const accordionValue = searching
    ? sections.map(({ group }) => group)
    : (openGroups ?? sections.slice(0, 1).map(({ group }) => group));

  const onInsertField = (field: Field) => () => {
    editor.commands.addTemplate(field.marker, chipLabel(t, field));
    editor.commands.focus();
    onInsert?.();
  };

  return (
    <div className={className}>
      <Input
        value={search}
        placeholder={t('Search')}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {sections.length > 0 ? (
          <Accordion
            type="multiple"
            value={accordionValue}
            onValueChange={(value) => {
              if (!searching) {
                onOpenGroupsChange(value);
              }
            }}
          >
            {sections.map(({ group, title, fields }) => (
              <AccordionItem
                key={group}
                value={group}
                className="last:border-0"
                data-cy={`fieldGroup-${group}`}
              >
                <AccordionTrigger className="py-3 text-sm hover:no-underline">
                  <span className="flex items-baseline gap-2">
                    {title}
                    <span className="text-xs font-normal text-muted-foreground">
                      {fields.length}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-0.5 pb-3">
                  {fields.map((field) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      key={field._id}
                      onClick={onInsertField(field)}
                      className="group h-8 w-full justify-between gap-2 px-2 font-normal"
                    >
                      <span className="truncate">{fieldLabel(t, field)}</span>
                      <RiAddLine
                        aria-hidden
                        className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
                      />
                    </Button>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('No matching field')}
          </p>
        )}
      </div>
    </div>
  );
}

export default function FieldMenu({
  onClose,
  ...bodyProps
}: FieldMenuBodyProps & { onClose: () => void }) {
  const t = useTranslations('common');
  return (
    <aside className="absolute inset-y-0 start-0 z-40 flex w-full max-w-96 flex-col border-e bg-card shadow-xl lg:static lg:z-auto lg:w-96 lg:max-w-none lg:shadow-none">
      <div className="flex items-center gap-2 border-b p-3">
        <RiBracesLine className="size-4 shrink-0 text-muted-foreground" />
        <h2 className="flex-1 truncate text-sm font-medium">
          {t('Computed fields')}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label={t('Close')}
          onClick={onClose}
          data-cy="fieldMenuClose"
        >
          <LuPanelLeftClose className="size-4 rtl:-scale-x-100" />
        </Button>
      </div>
      <FieldMenuBody
        {...bodyProps}
        className="flex min-h-0 flex-1 flex-col gap-2 p-3 pb-0"
      />
    </aside>
  );
}

export function FieldMenuDrawer({
  open,
  setOpen,
  ...bodyProps
}: FieldMenuBodyProps & {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const t = useTranslations('common');
  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      title={t('Computed fields')}
      renderHeader={undefined}
      isLoading={false}
      renderContent={() => (
        <FieldMenuBody
          {...bodyProps}
          onInsert={() => setOpen(false)}
          className="flex w-full flex-col gap-2"
        />
      )}
      renderFooter={() => (
        <Button variant="outline" onClick={() => setOpen(false)}>
          {t('Close')}
        </Button>
      )}
    />
  );
}
