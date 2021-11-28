import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles((theme) => ({
  title: {
    fontSize: 18,
  },
  subTitle: {
    fontSize: '95%',
  },
  amount: {
    fontSize: 18,
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  credit: {
    color: theme.palette.success.dark,
  },
  debit: {
    color: theme.palette.warning.dark,
  },
  sent: {
    fontSize: '95%',
  },
  stepButtonHidden: {
    visibility: 'hidden',
  },
  stepContent: {
    marginTop: 0,
  },
  stepConnector: {
    padding: 0,
  },
}));
