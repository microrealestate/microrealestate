import { Box, IconButton } from '@material-ui/core';
import { memo, useCallback, useState } from 'react';

import ArrowLeftIcon from '@material-ui/icons/ArrowLeft';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import { DatePicker } from '@material-ui/pickers';
import moment from 'moment';

const MonthPicker = ({ value, onChange }) => {
  const [selectedPeriod, setSelectedPeriod] = useState(value);

  const _onPeriodChange = useCallback(
    (period) => {
      setSelectedPeriod(period);
      onChange(period);
    },
    [onChange]
  );

  const _onNextMonth = useCallback(() => {
    const newPeriod = moment(selectedPeriod).add(1, 'months');
    _onPeriodChange(newPeriod);
  }, [selectedPeriod, _onPeriodChange]);

  const _onPreviousMonth = useCallback(() => {
    const newPeriod = moment(selectedPeriod).subtract(1, 'months');
    _onPeriodChange(newPeriod);
  }, [selectedPeriod, _onPeriodChange]);

  return (
    <Box display="flex" alignItems="center">
      <IconButton onClick={_onPreviousMonth} aria-label="previous month">
        <ArrowLeftIcon />
      </IconButton>
      <DatePicker
        autoOk
        views={['month']}
        value={selectedPeriod}
        onChange={_onPeriodChange}
        size="small"
        format="MMMM YYYY"
        style={{
          width: 130,
        }}
      />
      <IconButton onClick={_onNextMonth} aria-label="next month" size="small">
        <ArrowRightIcon />
      </IconButton>
    </Box>
  );
};

export default memo(MonthPicker);
