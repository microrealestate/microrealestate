import { Section } from '@microrealestate/commonui/components/formfields/Section';
import { SelectField } from '@microrealestate/commonui/components/formfields/SelectField';
import { SubmitButton } from '@microrealestate/commonui/components/formfields/SubmitButton';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { Checkbox } from '@microrealestate/commonui/components/ui/checkbox';
import { toast } from '@microrealestate/commonui/components/ui/sonner';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@microrealestate/commonui/components/ui/table';
import { useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { LuCirclePlus, LuLink, LuUnlink } from 'react-icons/lu';
import ConfirmDialog from '@/components/ConfirmDialog';
import Link from '@/components/Link';
import NumberFormat from '@/components/NumberFormat';
import { useStore } from '@/providers/StoreProvider';
import { QueryKeys } from '@/utils/restcalls';
import {
  attachCandidates,
  canHaveChildren,
  childUnits,
  NO_PARENT,
  parentCandidates,
  parentPath,
  type Unit
} from './composition';
import NewPropertyDialog from './NewPropertyDialog';
import PropertyIcon from './PropertyIcon';
import PropertyPicker from './PropertyPicker';
import PropertyStatusBadge from './PropertyStatusBadge';

type StoreResult = { status: number; data?: Unit };
function result(flowCall: unknown) {
  return flowCall as Promise<StoreResult>;
}

function useUnits() {
  const store = useStore();
  const property = store.property.selected as Unit;
  const units: Unit[] = store.property.items;
  return { store, property, units };
}

function AttachedToSection({ candidates }: { candidates: Unit[] }) {
  const t = useTranslations('common');
  const { units } = useUnits();

  if (!candidates.length) {
    return null;
  }

  return (
    <Section label={t('Part of')}>
      <SelectField
        label={t('Part of')}
        name="parentId"
        hideLabel
        values={[
          {
            id: NO_PARENT,
            value: NO_PARENT,
            label: t('Not part of another property')
          },
          ...candidates.map((unit) => ({
            id: unit._id,
            value: unit._id,
            label: [...parentPath(unit, units), unit.name].join(' › '),
            renderIcon: () => (
              <PropertyIcon
                type={unit.type}
                className="size-4"
                aria-hidden="true"
              />
            )
          }))
        ]}
      />
    </Section>
  );
}

const IncludedProperties = observer(function IncludedProperties() {
  const t = useTranslations('common');
  const queryClient = useQueryClient();
  const { store, property, units } = useUnits();
  const [selected, setSelected] = useState<string[]>([]);
  const [openPicker, setOpenPicker] = useState(false);
  const [openNew, setOpenNew] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

  if (!canHaveChildren(property.type)) {
    return null;
  }

  const rows = childUnits(property._id, units).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const selectedRows = selected.filter((id) =>
    rows.some(({ _id }) => _id === id)
  );
  const allSelected = rows.length > 0 && selectedRows.length === rows.length;
  const candidates = attachCandidates(property, units);

  const toggle = (id: string, checked: boolean) =>
    setSelected((ids) =>
      checked ? [...ids, id] : ids.filter((selectedId) => selectedId !== id)
    );

  const onAttach = async (ids: string[]) => {
    const { status } = await result(store.property.attach(property._id, ids));
    if (status !== 200) {
      toast.error(
        status === 422
          ? t('These properties cannot be attached to this one')
          : t('Something went wrong')
      );
      return false;
    }
    queryClient.invalidateQueries({ queryKey: [QueryKeys.PROPERTIES] });
    return true;
  };

  const onDetach = async () => {
    const { status } = await result(
      store.property.detach(property._id, selectedRows)
    );
    if (status !== 200) {
      return toast.error(t('Something went wrong'));
    }
    setSelected([]);
    queryClient.invalidateQueries({ queryKey: [QueryKeys.PROPERTIES] });
  };

  return (
    <Section label={t('Includes')}>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setOpenNew(true)}
        >
          <LuCirclePlus className="size-4" aria-hidden="true" />
          {t('Add a property')}
        </Button>
        <Button
          variant="outline"
          className="gap-2 ml-auto"
          disabled={!selectedRows.length}
          onClick={() => setOpenConfirm(true)}
        >
          <LuUnlink className="size-4" aria-hidden="true" />
          {t('{count, plural, =0 {Detach} other {Detach (#)}}', {
            count: selectedRows.length
          })}
        </Button>
        {candidates.length ? (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setOpenPicker(true)}
          >
            <LuLink className="size-4" aria-hidden="true" />
            {t('Attach existing properties')}
          </Button>
        ) : null}
      </div>

      {rows.length ? (
        <Table containerClassName="max-h-96 rounded-md border">
          <TableCaption className="sr-only">
            {t('Properties attached to {name}', { name: property.name })}
          </TableCaption>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow className="text-nowrap">
              <TableHead className="w-7">
                <Checkbox
                  checked={
                    allSelected
                      ? true
                      : selectedRows.length
                        ? 'indeterminate'
                        : false
                  }
                  onCheckedChange={(checked) =>
                    setSelected(
                      checked === true ? rows.map(({ _id }) => _id) : []
                    )
                  }
                  aria-label={t('Select all attached properties')}
                />
              </TableHead>
              <TableHead>{t('Name')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead className="text-right">{t('Base rent')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row._id}
                data-state={
                  selectedRows.includes(row._id) ? 'selected' : undefined
                }
              >
                <TableCell>
                  <Checkbox
                    checked={selectedRows.includes(row._id)}
                    onCheckedChange={(checked) =>
                      toggle(row._id, checked === true)
                    }
                    aria-label={t('Select {name}', { name: row.name })}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <PropertyIcon
                      type={row.type}
                      className="size-4"
                      aria-hidden="true"
                    />
                    <Link href={`/properties/${row._id}`}>{row.name}</Link>
                  </div>
                </TableCell>
                <TableCell>
                  <PropertyStatusBadge property={row} />
                </TableCell>
                <TableCell className="text-right">
                  {row.availableForRent ? (
                    <NumberFormat
                      value={row.price}
                      withColor={undefined}
                      debitColor={undefined}
                      creditColor={undefined}
                      className={undefined}
                    />
                  ) : (
                    <>
                      <span aria-hidden="true">—</span>
                      <span className="sr-only">{t('Non-rental')}</span>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t('No property is attached to this one')}
        </p>
      )}

      <NewPropertyDialog
        open={openNew}
        setOpen={setOpenNew}
        parent={property}
        withDetails={false}
      />
      <PropertyPicker
        open={openPicker}
        setOpen={setOpenPicker}
        candidates={candidates}
        onAttach={onAttach}
      />
      <ConfirmDialog
        title={t(
          '{count, plural, one {Detach # property from {parent}?} other {Detach # properties from {parent}?}}',
          { count: selectedRows.length, parent: property.name }
        )}
        subTitle={t(
          '{count, plural, one {It will no longer be part of {parent}. Its leases do not change.} other {They will no longer be part of {parent}. Their leases do not change.}}',
          { count: selectedRows.length, parent: property.name }
        )}
        open={openConfirm}
        setOpen={setOpenConfirm}
        onConfirm={onDetach}
      >
        {null}
      </ConfirmDialog>
    </Section>
  );
});

// One form for the parent, saved by the button at the bottom. Attaching and
// detaching act at once: their buttons are type="button" and their dialogs
// render outside the <form>.
const PropertyStructure = observer(function PropertyStructure() {
  const t = useTranslations('common');
  const queryClient = useQueryClient();
  const { store, property, units } = useUnits();
  const candidates = parentCandidates(property._id, property.type, units);

  const onSubmit = async ({ parentId }: { parentId: string }) => {
    const { status, data } = await result(
      store.property.update({
        ...toJS(store.property.selected),
        parentId: parentId === NO_PARENT ? null : parentId
      })
    );
    if (status !== 200) {
      return toast.error(
        status === 422
          ? t('This property cannot be attached to the selected property')
          : t('Something went wrong')
      );
    }
    store.property.setSelected(data);
    queryClient.invalidateQueries({ queryKey: [QueryKeys.PROPERTIES] });
  };

  return (
    <Formik
      // starts over from the saved value once it is saved
      key={`${property._id}-${property.parentId ?? NO_PARENT}`}
      initialValues={{ parentId: property.parentId || NO_PARENT }}
      onSubmit={onSubmit}
    >
      <Form autoComplete="off">
        <AttachedToSection candidates={candidates} />
        <IncludedProperties />
        {candidates.length ? <SubmitButton label={t('Save')} /> : null}
      </Form>
    </Formik>
  );
});

export default PropertyStructure;
