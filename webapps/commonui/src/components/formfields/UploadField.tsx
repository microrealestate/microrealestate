import { useField, useFormikContext } from 'formik';
import { LuPaperclip } from 'react-icons/lu';
import { cn } from '../../utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import FormField from './FormField';

export function UploadField({
  disabled,
  ...props
}: {
  disabled?: boolean;
  name: string;
  label: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const { isSubmitting, setFieldValue } = useFormikContext();
  const [field, _meta, helpers] = useField(props);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFieldValue(
      field.name,
      event.target.files?.length ? event.target.files[0] : null,
      true
    );
  };

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    const element = document.getElementById(props.name);
    if (element) {
      element.click();
    } else {
      console.error('No element found with id', props.name);
    }
  };

  return (
    <FormField {...props}>
      <div className="flex items-center gap-2">
        <Input
          value={field.value?.name ?? ''}
          onClick={handleClick}
          onFocus={() => {
            helpers.setTouched(false, false);
          }}
          className={cn('grow')}
          disabled={disabled || isSubmitting}
          readOnly
        />
        <div>
          <Input
            id={props.name}
            name={props.name}
            type="file"
            onChange={props.onChange || handleChange}
            disabled={disabled}
            className="hidden"
          />
          <Button
            variant="secondary"
            size="icon"
            disabled={disabled}
            onClick={handleClick}
          >
            <LuPaperclip />
          </Button>
        </div>
      </div>
    </FormField>
  );
}
