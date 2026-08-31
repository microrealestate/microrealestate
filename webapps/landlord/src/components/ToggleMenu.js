import { Checkbox } from '@microrealestate/commonui/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@microrealestate/commonui/components/ui/popover';
import { useCallback, useMemo } from 'react';

export default function ToggleMenu({
  options,
  selectedIds = [],
  onChange,
  dataCy,
  children
}) {
  const selectedOptions = useMemo(() => {
    return selectedIds
      .map((id) => options.find((option) => option.id === id))
      .filter(Boolean);
  }, [options, selectedIds]);

  const handleToggle = useCallback(
    (option) => () => {
      let newOptions;
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
