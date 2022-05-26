import {
  Box,
  Button,
  Hidden,
  makeStyles,
  Typography,
  useTheme,
} from '@material-ui/core';

const ShortcutButton = ({ Icon, label, disabled, onClick }) => {
  const theme = useTheme();
  const useStyles = makeStyles((theme) => ({
    root: {
      paddingTop: 10,
      paddingBottom: 10,
      color: theme.palette.info.contrastText,
      backgroundColor: theme.palette.info.main,
      '&:hover': {
        background: theme.palette.info.dark,
      },
    },
  }));
  const classes = useStyles();

  return (
    <>
      <Hidden smDown>
        <Button
          startIcon={<Icon style={{ fontSize: 28 }} />}
          size="large"
          className={classes.root}
          fullWidth
          disabled={!!disabled}
          onClick={onClick}
        >
          <Box minWidth={250} textAlign="left">
            {label}
          </Box>
        </Button>
      </Hidden>
      <Hidden mdUp>
        <Button
          startIcon={<Icon fontSize="small" />}
          className={classes.root}
          fullWidth
          disabled={!!disabled}
          onClick={onClick}
        >
          <Box
            minWidth={200}
            textAlign="left"
            fontSize={theme.typography.caption.fontSize}
          >
            <Typography variant="inherit">{label}</Typography>
          </Box>
        </Button>
      </Hidden>
    </>
  );
};

export default ShortcutButton;
