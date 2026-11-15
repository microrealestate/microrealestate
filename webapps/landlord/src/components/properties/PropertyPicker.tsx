import { Button } from '@microrealestate/commonui/components/ui/button';
import { Checkbox } from '@microrealestate/commonui/components/ui/checkbox';
import { Input } from '@microrealestate/commonui/components/ui/input';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useMemo, useState } from 'react';
import ResponsiveDialog from '../ResponsiveDialog';
import type { Unit } from './composition';
import PropertyIcon from './PropertyIcon';
import types from './types';

const NORMALIZE_REGEX = /\s|\.|-/gi;

function normalize(text: string) {
  return text.toLowerCase().replace(NORMALIZE_REGEX, '');
}

export default function PropertyPicker({
  open,
  setOpen,
  candidates,
  onAttach
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  candidates: Unit[];
  onAttach: (ids: string[]) => Promise<boolean>;
}) {
  const t = useTranslations('common');
  const id = useId();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSearch('');
      setSelected([]);
    }
  }, [open]);

  const visible = useMemo(() => {
    const cleaned = normalize(search);
    return [...candidates]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter(({ name }) => !cleaned || normalize(name).includes(cleaned));
  }, [candidates, search]);

  const typeLabel = (kind: Unit['type']) => {
    const type = types.find(({ id }) => id === kind);
    return type ? t(type.labelId) : '';
  };

  const toggle = (unitId: string, checked: boolean) =>
    setSelected((ids) =>
      checked ? [...ids, unitId] : ids.filter((id) => id !== unitId)
    );

  const onSubmit = async () => {
    setIsLoading(true);
    try {
      if (await onAttach(selected)) {
        setOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      isLoading={isLoading}
      title={t('Attach existing properties')}
      renderHeader={undefined}
      renderContent={() => (
        <div className="space-y-3 pt-4">
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('Search')}
            aria-label={t('Search a property')}
          />
          <fieldset>
            <legend className="sr-only">
              {t('Properties that can be attached')}
            </legend>
            <ul className="max-h-72 overflow-y-auto space-y-1">
              {visible.map((unit) => {
                const checkboxId = `${id}-${unit._id}`;
                return (
                  <li key={unit._id}>
                    <label
                      htmlFor={checkboxId}
                      className="flex items-center gap-3 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
                    >
                      <Checkbox
                        id={checkboxId}
                        checked={selected.includes(unit._id)}
                        onCheckedChange={(checked) =>
                          toggle(unit._id, checked === true)
                        }
                      />
                      <PropertyIcon
                        type={unit.type}
                        className="size-4"
                        aria-hidden="true"
                      />
                      <span className="flex-1">{unit.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {typeLabel(unit.type)}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
          {!visible.length ? (
            <p className="text-sm text-muted-foreground">
              {t('No property matches your search')}
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {t(
              '{count, plural, =0 {No property selected} one {# property selected} other {# properties selected}}',
              {
                count: selected.length
              }
            )}
          </p>
        </div>
      )}
      renderFooter={() => (
        <>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('Cancel')}
          </Button>
          <Button onClick={onSubmit} disabled={!selected.length}>
            {t('{count, plural, =0 {Attach} other {Attach (#)}}', {
              count: selected.length
            })}
          </Button>
        </>
      )}
    />
  );
}
