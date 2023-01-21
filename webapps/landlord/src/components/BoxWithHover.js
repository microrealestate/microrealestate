import { Box, withStyles } from '@material-ui/core';

const StyledBox = withStyles((theme) => ({
  root: {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}))(Box);

export default function BoxWithHover({ withCursor, children, ...props }) {
  return (
    <StyledBox style={withCursor ? { cursor: 'pointer' } : null}>
      <Box {...props}>{children}</Box>
    </StyledBox>
  );
}
