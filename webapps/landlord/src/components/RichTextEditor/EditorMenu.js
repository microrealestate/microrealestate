import {
  AppBar,
  Box,
  Button,
  FormControlLabel,
  Input,
  Switch,
  Typography,
} from '@material-ui/core';
import { useCallback, useState } from 'react';

import FieldMenu from './FieldMenu';
import FormatMenu from './FormatMenu';
import SaveIcon from '@material-ui/icons/SaveOutlined';
import TableMenu from './TableMenu';
import useTranslation from 'next-translate/useTranslation';

const EditorMenu = ({
  editor,
  title,
  showPrintButton,
  fields,
  saving,
  onChange,
  onClose,
  editable,
}) => {
  const { t } = useTranslation('common');
  const [showFieldMenu, setShowFieldMenu] = useState(fields?.length && true);

  const onTitleChange = useCallback(
    (evt) => {
      onChange(evt.target.value);
    },
    [onChange]
  );

  const onShowFieldMenuChange = useCallback(() => {
    setShowFieldMenu(!showFieldMenu);
  }, [showFieldMenu]);

  return editor ? (
    <>
      <AppBar>
        <Box display="flex" flexDirection="column" m={1}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Box display="flex" alignItems="center">
              <Box width={300}>
                <Input
                  value={title}
                  onChange={onTitleChange}
                  fullWidth
                  readOnly={!editable}
                  name="title"
                />
              </Box>
              <Box color="text.disabled" ml={2}>
                {saving === true && (
                  <Box display="flex" alignItems="center">
                    <SaveIcon fontSize="small" color="inherit" />
                    <Typography
                      variant="caption"
                      color="inherit"
                      component="span"
                      data-cy="savingTextDocument"
                    >
                      {t('Saving')}
                    </Typography>
                  </Box>
                )}
                {saving === false && (
                  <Typography variant="caption" data-cy="savedTextDocument">
                    {t('Saved')}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box display="flex">
              <Button
                variant="contained"
                size="small"
                onClick={onClose}
                data-cy="close"
              >
                {t('Close')}
              </Button>
            </Box>
          </Box>
          <Box display="flex" mb={1}>
            <FormatMenu editor={editor} showPrintButton={showPrintButton} />
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Box display="flex">
              <TableMenu editor={editor} />
            </Box>
            {fields?.length > 0 && (
              <Box display="flex">
                <FormControlLabel
                  control={
                    <Switch
                      color="primary"
                      size="small"
                      checked={showFieldMenu}
                      onChange={onShowFieldMenuChange}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      {t('Computed fields')}
                    </Typography>
                  }
                />
              </Box>
            )}
          </Box>
        </Box>
      </AppBar>
      {showFieldMenu && <FieldMenu editor={editor} fields={fields} />}
    </>
  ) : null;
};

export default EditorMenu;
