import { Checkbox } from '@microrealestate/commonui/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@microrealestate/commonui/components/ui/popover';
import { type ReactNode, useCallback, useMemo } from 'react';

export type ToggleMenuOption = { id: string; label: ReactNode };

type ToggleMenuProps<T extends ToggleMenuOption> = {
  options: T[];
  selectedIds?: string[];
  onChange: (selectedOptions: T[]) => void;
  dataCy?: string;
  children: ReactNode;
};

export default function ToggleMenu<T extends ToggleMenuOption>({
  options,
  selectedIds = [],
  onChange,
  dataCy,
  children
}: ToggleMenuProps<T>) {
  const selectedOptions = useMemo(() => {
    return selectedIds
      .map((id) => options.find((option) => option.id === id))
      .filter((option): option is T => !!option);
  }, [options, selectedIds]);

  const handleToggle = useCallback(
    (option: T) => () => {
      let newOptions: T[];
      if (!option?.id) {
        newOptions = [option];
      } else if (selectedOptions.map(({ id }) => id).includes(option.id)) {
        newOptions = selectedOptions.filter(({ id }) => id !== option.id);
      } else {
        newOptions = [...selectedOptions, option];
      }
      onChange(newOptions);
    },
    [onChange, selectedOptions]
  );

  return (
    <Popover>
      <PopoverTrigger asChild data-cy={dataCy}>
        {children}
      </PopoverTrigger>
      <PopoverContent align="start" className="p-1 m-0">
        <ul>
          {options.map((option) => (
            <li key={option.id}>
              <label
                htmlFor={`toggle-${option.id}`}
                className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-primary/10 cursor-pointer"
              >
                <Checkbox
                  id={`toggle-${option.id}`}
                  checked={selectedIds.includes(option.id)}
                  onCheckedChange={handleToggle(option)}
                />
                <span className="text-sm font-medium">{option.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
