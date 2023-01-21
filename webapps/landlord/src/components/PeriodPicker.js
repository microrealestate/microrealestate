import { Box, Button, IconButton } from '@material-ui/core';
import { memo, useCallback, useState } from 'react';

import ArrowLeftIcon from '@material-ui/icons/ArrowLeft';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import { DatePicker } from '@material-ui/pickers';
import moment from 'moment';

function CustomDateField({ value, onClick }) {
  return (
    <Button onClick={onClick} size="small">
      <Box fontSize="h6.fontSize">{value}</Box>
    </Button>
  );
}

function PeriodPicker({ value, period, format, onChange }) {
  const [selectedPeriod, setSelectedPeriod] = useState(value);

  const _onPeriodChange = useCallback(
    (period) => {
      setSelectedPeriod(period);
      onChange(period);
    },
    [onChange]
  );

  const _onNextPeriod = useCallback(() => {
    const newPeriod = moment(selectedPeriod).add(1, period);
    _onPeriodChange(newPeriod);
  }, [period, selectedPeriod, _onPeriodChange]);

  const _onPreviousPeriod = useCallback(() => {
    const newPeriod = moment(selectedPeriod).subtract(1, period);
    _onPeriodChange(newPeriod);
  }, [period, selectedPeriod, _onPeriodChange]);

  return (
    <Box display="flex" alignItems="center">
      <DatePicker
        autoOk
        views={[period]}
        value={selectedPeriod}
        onChange={_onPeriodChange}
        format={format}
        allowKeyboardControl={false}
        TextFieldComponent={CustomDateField}
      />

      <IconButton
        onClick={_onPreviousPeriod}
        size="small"
        aria-label="previous period"
      >
        <ArrowLeftIcon />
      </IconButton>
      <IconButton onClick={_onNextPeriod} size="small" aria-label="next period">
        <ArrowRightIcon />
      </IconButton>
    </Box>
  );
}

export default memo(PeriodPicker);
