import { TextField, type TextFieldProps } from './TextField';

export function NumberField(props: TextFieldProps) {
  return <TextField {...props} type="number" />;
}
