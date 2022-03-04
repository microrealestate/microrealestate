import { memo, useMemo } from 'react';

const { Typography, useTheme, Box } = require('@material-ui/core');

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
    <Box display="flex" alignItems="center">
      {Icon && (
        <Box display="flex" alignItems="center" mr={0.5}>
          <Icon fontSize={fontSize} className={className} style={iconStyle} />
        </Box>
      )}

      <Typography fontSize={fontSize} className={className} {...props}>
        {children}
      </Typography>
    </Box>
  );
};

export default memo(IconTypography);
