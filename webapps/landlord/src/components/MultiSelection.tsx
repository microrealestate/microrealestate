import { Checkbox } from '@microrealestate/commonui/components/ui/checkbox';
import { useTranslations } from 'next-intl';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react';

export type MultiSelection = {
  selecting: boolean;
  selected: Set<string>;
  start: () => void;
  stop: () => void;
  toggle: (id: string, checked: boolean) => void;
  setAll: (ids: string[]) => void;
  clear: () => void;
};

const MultiSelectionContext = createContext<MultiSelection>({
  selecting: false,
  selected: new Set(),
  start: () => {},
  stop: () => {},
  toggle: () => {},
  setAll: () => {},
  clear: () => {}
});

export function isAllSelected(selected: Set<string>, ids: string[]) {
  return ids.length > 0 && ids.every((id) => selected.has(id));
}

export function useMultiSelection({
  alwaysOn = false
}: {
  alwaysOn?: boolean;
} = {}): MultiSelection {
  const [selecting, setSelecting] = useState(alwaysOn);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const start = useCallback(() => {
    setSelecting(true);
  }, []);
  const clear = useCallback(() => {
    setSelected(new Set());
  }, []);
  const stop = useCallback(() => {
    setSelecting(false);
    setSelected(new Set());
  }, []);
  const setAll = useCallback((ids: string[]) => {
    setSelected(new Set(ids));
  }, []);
  const toggle = useCallback((id: string, checked: boolean) => {
    setSelected((ids) => {
      const next = new Set(ids);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  return useMemo(
    () => ({ selecting, selected, start, stop, toggle, setAll, clear }),
    [selecting, selected, start, stop, toggle, setAll, clear]
  );
}

export function MultiSelectionProvider({
  value,
  children
}: {
  value: MultiSelection;
  children: ReactNode;
}) {
  return (
    <MultiSelectionContext.Provider value={value}>
      {children}
    </MultiSelectionContext.Provider>
  );
}

export function useMultiSelectionContext() {
  return useContext(MultiSelectionContext);
}

export function useIsSelected(id?: string) {
  const { selecting, selected } = useMultiSelectionContext();
  return selecting && !!id && selected.has(id);
}

export function SelectCheckbox({
  id,
  name,
  controlId,
  disabled
}: {
  id: string;
  name: string;
  controlId?: string;
  disabled?: boolean;
}) {
  const t = useTranslations('common');
  const { selecting, selected, toggle } = useMultiSelectionContext();
  if (!selecting) {
    return null;
  }
  return (
    <Checkbox
      id={controlId}
      checked={selected.has(id)}
      disabled={disabled}
      onCheckedChange={(checked) => toggle(id, checked === true)}
      aria-label={t('Select {name}', { name })}
    />
  );
}
