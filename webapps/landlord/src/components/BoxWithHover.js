import { Box, withStyles } from '@material-ui/core';

const StyledBox = withStyles((theme) => ({
  root: {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}))(Box);

export default function BoxWithHover({ children, ...props }) {
  return (
    <Box {...props}>
      <StyledBox>{children}</StyledBox>
    </Box>
  );
}
