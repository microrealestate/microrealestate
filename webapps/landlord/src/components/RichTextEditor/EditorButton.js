import { Button } from '@material-ui/core';
import { hexToRgb } from '../../styles/styles';
import { withStyles } from '@material-ui/core/styles';

const StyledButton = withStyles((theme) => ({
  root: {
    minWidth: 36,
    fontSize: 18,
    borderRadius: 0,
    '&.selected': {
      fontWeight: 'bold',
      backgroundColor: `rgba(${hexToRgb(theme.palette.primary.main)},${
        theme.palette.action.activatedOpacity
      })`,
    },
  },
}))(Button);

const EditorButton = ({
  iconType,
  selected = false,
  disabled = false,
  onClick,
}) => {
  return (
    <StyledButton
      size="small"
      className={selected ? 'selected' : ''}
      disabled={disabled}
      onClick={onClick}
    >
      <i className={iconType}></i>
    </StyledButton>
  );
};

export default EditorButton;
