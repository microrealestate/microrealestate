import { memo, useMemo } from 'react';

const { Grid, Typography, useTheme } = require('@material-ui/core');

const IconTypography = ({
  Icon,
  children,
  fontSize = 'medium',
  className,
  ...props
}) => {
  const theme = useTheme();

  const iconStyle = useMemo(() => {
    const iconStyle = {};
    if (props.color === 'textSecondary') {
      iconStyle.color = theme.palette.text.secondary;
    }
    return iconStyle;
  }, [props.color, theme.palette.text.secondary]);

  return (
    <Grid container wrap="nowrap" alignItems="center" spacing={1}>
      {Icon && (
        <Grid item>
          <Icon fontSize={fontSize} className={className} style={iconStyle} />
        </Grid>
      )}
      <Grid item>
        <Typography fontSize={fontSize} className={className} {...props}>
          {children}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default memo(IconTypography);
