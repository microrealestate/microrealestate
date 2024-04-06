import { Alert, AlertTitle } from './ui/alert';
import { AlertTriangleIcon, InfoIcon } from 'lucide-react';
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Typography
} from '@material-ui/core';
import { useCallback, useMemo } from 'react';
import DeleteIcon from '@material-ui/icons/Delete';
import DescriptionOutlinedIcon from '@material-ui/icons/DescriptionOutlined';
import moment from 'moment';
import ScannerOutlinedIcon from '@material-ui/icons/ScannerOutlined';
import useTranslation from 'next-translate/useTranslation';

const DocumentItem = ({ document, onEdit, onDelete, disabled }) => {
  const { t } = useTranslation('common');

  const handleEditClick = useCallback(() => {
    onEdit(document);
  }, [onEdit, document]);

  const handleDeleteClick = useCallback(() => {
    onDelete(document);
  }, [onDelete, document]);

  const expiryMoment = useMemo(() => {
    return document.expiryDate ? moment(document.expiryDate) : null;
  }, [document.expiryDate]);

  const isExpired = useMemo(() => {
    return expiryMoment ? moment().isSameOrAfter(expiryMoment) : false;
  }, [expiryMoment]);

  return (
    <ListItem button divider onClick={handleEditClick}>
      <ListItemText
        id={document._id}
        primary={
          <Box display="flex" flexDirection="column" justifyContent="center">
            <Box display="flex">
              <Box mr={1}>
                {document.type === 'text' ? (
                  <DescriptionOutlinedIcon color="action" />
                ) : (
                  <ScannerOutlinedIcon color="action" />
                )}
              </Box>
              <Typography component="div">{document.name}</Typography>
            </Box>

            {expiryMoment ? (
              <Alert variant={isExpired ? 'warning' : 'default'}>
                {isExpired ? (
                  <AlertTriangleIcon className="h-4 w-4" />
                ) : (
                  <InfoIcon className="h-4 w-4" />
                )}
                <AlertTitle>
                  {isExpired
                    ? t('expired document')
                    : t('expiry {{relativeDate}}', {
                        relativeDate: expiryMoment.fromNow()
                      })}
                </AlertTitle>
              </Alert>
            ) : (
              !!document.description && (
                <Typography variant="caption">
                  {document.description}
                </Typography>
              )
            )}
          </Box>
        }
      />

      <ListItemSecondaryAction>
        <IconButton edge="end" onClick={handleDeleteClick} disabled={disabled}>
          <DeleteIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

export default function DocumentList({
  documents,
  onEdit,
  onDelete,
  disabled = false
}) {
  return (
    <Paper variant="outlined">
      <Box minHeight={200}>
        <List>
          {documents
            ?.sort(({ type: type1 }, { type: type2 }) =>
              type1.localeCompare(type2)
            )
            .map((document) => (
              <DocumentItem
                key={document._id}
                document={document}
                onEdit={onEdit}
                onDelete={onDelete}
                disabled={disabled}
              />
            ))}
        </List>
      </Box>
    </Paper>
  );
}
