import { Box, Hidden, IconButton } from '@material-ui/core';
import { memo, useCallback, useState } from 'react';

import ArrowLeftIcon from '@material-ui/icons/ArrowLeft';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import { DatePicker } from '@material-ui/pickers';
import moment from 'moment';

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
      <Hidden smDown>
        <IconButton
          onClick={_onPreviousPeriod}
          aria-label="previous period"
          size="small"
        >
          <ArrowLeftIcon />
        </IconButton>
      </Hidden>
      <Box width={100}>
        <DatePicker
          autoOk
          views={[period]}
          value={selectedPeriod}
          onChange={_onPeriodChange}
          size="small"
          format={format}
        />
      </Box>
      <Hidden smDown>
        <IconButton
          onClick={_onNextPeriod}
          aria-label="next period"
          size="small"
        >
          <ArrowRightIcon />
        </IconButton>
      </Hidden>
    </Box>
  );
}

export default memo(PeriodPicker);
