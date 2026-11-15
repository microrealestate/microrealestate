import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@microrealestate/commonui/components/ui/select';
import { toast } from '@microrealestate/commonui/components/ui/sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useStore } from '@/providers/StoreProvider';
import { QueryKeys } from '@/utils/restcalls';
import { isAllSelected } from '../MultiSelection';
import SelectionBar from '../SelectionBar';
import {
  NO_PARENT,
  parentCandidates,
  parentPath,
  type Unit
} from './composition';
import PropertyIcon from './PropertyIcon';

type StoreResult = { status: number };
function result(flowCall: unknown) {
  return flowCall as Promise<StoreResult>;
}

export default function PropertyMoveBar({
  units,
  selected,
  selectableIds,
  onSelectAll,
  onDone,
  onCancel
}: {
  units: Unit[];
  selected: Set<string>;
  selectableIds: string[];
  onSelectAll: () => void;
  onDone: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('common');
  const store = useStore();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState('');
  const [isMoving, setIsMoving] = useState(false);

  const moving = useMemo(
    () => units.filter(({ _id }) => selected.has(_id)),
    [units, selected]
  );
  const destinations = useMemo(() => {
    const allowed = moving.map(
      (unit) =>
        new Set(
          parentCandidates(unit._id, unit.type, units).map(({ _id }) => _id)
        )
    );
    return units.filter(
      ({ _id }) => !selected.has(_id) && allowed.every((ids) => ids.has(_id))
    );
  }, [moving, units, selected]);
  const attached = moving.filter(({ parentId }) => !!parentId);

  const onMove = async () => {
    setIsMoving(true);
    try {
      let status = 200;
      if (target === NO_PARENT) {
        // one call per current parent: detaching is scoped to a parent
        const byParent = new Map<string, string[]>();
        for (const { _id, parentId } of attached) {
          if (parentId) {
            byParent.set(parentId, [...(byParent.get(parentId) ?? []), _id]);
          }
        }
        for (const [parentId, ids] of byParent) {
          ({ status } = await result(store.property.detach(parentId, ids)));
          if (status !== 200) break;
        }
      } else {
        ({ status } = await result(
          store.property.attach(
            target,
            moving.map(({ _id }) => _id)
          )
        ));
      }
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PROPERTIES] });
      if (status !== 200) {
        toast.error(
          status === 422
            ? t('These properties cannot be attached to this one')
            : t('Something went wrong')
        );
        return;
      }
      onDone();
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <SelectionBar
      dataCy="moveBar"
      label={
        moving.length
          ? t(
              '{count, plural, one {# of {total} properties} other {# of {total} properties}}',
              {
                count: moving.length,
                total: selectableIds.length
              }
            )
          : t('Tick the properties to move')
      }
      onClose={onCancel}
      closeLabel={t('Cancel')}
      closeDisabled={isMoving}
      onSelectAll={onSelectAll}
      allSelected={isAllSelected(selected, selectableIds)}
    >
      {moving.length ? (
        <div className="flex basis-full gap-2">
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="min-w-0 flex-1" aria-label={t('Move to')}>
              <SelectValue placeholder={t('Move to')} />
            </SelectTrigger>
            <SelectContent>
              {destinations.length ? null : (
                <SelectGroup>
                  <SelectLabel className="font-normal text-muted-foreground">
                    {t('No property can include all the selected ones.')}
                  </SelectLabel>
                </SelectGroup>
              )}
              {destinations.map((unit) => (
                <SelectItem key={unit._id} value={unit._id}>
                  <span className="flex items-center gap-2">
                    <PropertyIcon
                      type={unit.type}
                      className="size-4"
                      aria-hidden="true"
                    />
                    {[...parentPath(unit, units), unit.name].join(' › ')}
                  </span>
                </SelectItem>
              ))}
              {attached.length ? (
                <SelectItem value={NO_PARENT}>
                  {t('Not part of another property')}
                </SelectItem>
              ) : null}
            </SelectContent>
          </Select>
          <Button
            className="shrink-0"
            onClick={onMove}
            disabled={!target || isMoving}
            data-cy="moveProperties"
          >
            {t('Move')}
          </Button>
        </div>
      ) : null}
    </SelectionBar>
  );
}
