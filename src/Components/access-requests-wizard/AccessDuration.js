import React from 'react';
import {
  DatePicker,
  FormGroup,
  HelperText,
  HelperTextItem,
  isValidDate,
  Split,
  SplitItem,
  ValidatedOptions,
} from '@patternfly/react-core';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import InputHelpPopover from '../common/InputHelpPopover';
import { ACCESS_FROM, ACCESS_TO } from './schema';

const AccessDuration = () => {
  const formOptions = useFormApi();
  const values = formOptions.getState().values;
  const [startDate, setStartDate] = React.useState();
  const [currentStartValue, setCurrentStartValue] = React.useState('');
  const [currentEndValue, setCurrentEndValue] = React.useState('');

  // Sync current values with form values on mount and updates
  React.useEffect(() => {
    setCurrentStartValue(values[ACCESS_FROM] || '');
    setCurrentEndValue(values[ACCESS_TO] || '');
  }, [values[ACCESS_FROM], values[ACCESS_TO]]);

  const maxStartDate = new Date();
  maxStartDate.setDate(maxStartDate.getDate() + 60);

  const dateFormat = (date) =>
    date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

  const isCorrectFormat = (date) =>
    /^([0]?[1-9]|[1][0-2])\/([0]?[1-9]|[1|2][0-9]|[3][0|1])\/([0-9]{4})$/.test(
      date
    );

  const dateParse = (date) => {
    const split = date.split('/');
    if (!isCorrectFormat(date)) {
      return undefined;
    }
    const month = split[0].padStart(2, '0');
    const day = split[1].padStart(2, '0');
    const year = split[2].padStart(4, '0');
    return new Date(`${year}-${month}-${day}T00:00:00`);
  };

  const startValidator = (date) => {
    if (isValidDate(date)) {
      // Check if date is before today (start of day)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);

      if (dateStart < todayStart) {
        const message = 'Start date must be today or later';
        return message;
      }
      if (date > maxStartDate) {
        const message = 'Start date must be within 60 days of today';
        return message;
      }
    }
    return '';
  };

  const endValidator = (date) => {
    if (isValidDate(startDate)) {
      if (startDate > date) {
        const message = 'End date must be after start date';
        return message;
      }

      const maxToDate = new Date(startDate);
      maxToDate.setFullYear(maxToDate.getFullYear() + 1);
      const message = 'Access duration may not be longer than one year';
      return date > maxToDate ? message : '';
    }
    return '';
  };

  // Calendar validator functions for PatternFly DatePicker
  // These disable invalid dates in the calendar dropdown
  const startCalendarValidator = (date) => {
    if (!isValidDate(date)) return '';

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);

    if (dateStart < todayStart) {
      return 'Date is in the past';
    }
    if (date > maxStartDate) {
      return 'Date is beyond 60-day limit';
    }
    return '';
  };

  const endCalendarValidator = (date) => {
    if (!isValidDate(date) || !isValidDate(startDate)) return '';

    if (date <= startDate) {
      return 'Date must be after start date';
    }

    const maxToDate = new Date(startDate);
    maxToDate.setFullYear(maxToDate.getFullYear() + 1);

    if (date > maxToDate) {
      return 'Date exceeds one year limit';
    }
    return '';
  };

  // Helper functions to determine validation rule status
  const getStartDateTodayStatus = () => {
    const startValue = currentStartValue || values[ACCESS_FROM];
    if (!startValue || !isCorrectFormat(startValue)) return 'indeterminate';

    const parsedDate = dateParse(startValue);
    if (!parsedDate) return 'indeterminate';

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const dateStart = new Date(parsedDate);
    dateStart.setHours(0, 0, 0, 0);

    return dateStart >= todayStart ? 'success' : 'error';
  };

  const getStartDateSixtyDayStatus = () => {
    const startValue = currentStartValue || values[ACCESS_FROM];
    if (!startValue || !isCorrectFormat(startValue)) return 'indeterminate';

    const parsedDate = dateParse(startValue);
    if (!parsedDate) return 'indeterminate';

    return parsedDate <= maxStartDate ? 'success' : 'error';
  };

  const getStartDateFormatStatus = () => {
    const startValue = currentStartValue || values[ACCESS_FROM];
    if (!startValue) return 'indeterminate';

    return isCorrectFormat(startValue) ? 'success' : 'error';
  };

  const getEndDateAfterStartStatus = () => {
    const endValue = currentEndValue || values[ACCESS_TO];
    const startValue = currentStartValue || values[ACCESS_FROM];

    if (
      !endValue ||
      !isCorrectFormat(endValue) ||
      !startValue ||
      !isCorrectFormat(startValue)
    ) {
      return 'indeterminate';
    }

    const parsedEndDate = dateParse(endValue);
    const parsedStartDate = dateParse(startValue);

    if (!parsedEndDate || !parsedStartDate) return 'indeterminate';

    return parsedEndDate > parsedStartDate ? 'success' : 'error';
  };

  const getEndDateOneYearStatus = () => {
    const endValue = currentEndValue || values[ACCESS_TO];
    const startValue = currentStartValue || values[ACCESS_FROM];

    if (
      !endValue ||
      !isCorrectFormat(endValue) ||
      !startValue ||
      !isCorrectFormat(startValue)
    ) {
      return 'indeterminate';
    }

    const parsedEndDate = dateParse(endValue);
    const parsedStartDate = dateParse(startValue);

    if (!parsedEndDate || !parsedStartDate) return 'indeterminate';

    const maxToDate = new Date(parsedStartDate);
    maxToDate.setFullYear(maxToDate.getFullYear() + 1);

    return parsedEndDate <= maxToDate ? 'success' : 'error';
  };

  const getEndDateFormatStatus = () => {
    const endValue = currentEndValue || values[ACCESS_TO];
    if (!endValue) return 'indeterminate';

    return isCorrectFormat(endValue) ? 'success' : 'error';
  };

  const onStartChange = (_e, str, date) => {
    setStartDate(date ? new Date(date) : undefined);
    // Allow user to continue typing - only clear if completely invalid on blur
    formOptions.change(ACCESS_FROM, str);

    // Update local state to trigger re-render and update validation status
    setCurrentStartValue(str);

    if (isValidDate(date) && !startValidator(date)) {
      date.setDate(date.getDate() + 7);
      formOptions.change(ACCESS_TO, dateFormat(date));
    }
  };

  const onEndChange = (_e, str, date) => {
    // Allow user to continue typing - only validate on blur
    formOptions.change(ACCESS_TO, str);

    // Update local state to trigger re-render and update validation status
    setCurrentEndValue(str);

    if (isValidDate(date) && !endValidator(date)) {
      // Only auto-clear start date if there's a validation error with start date
      if (startValidator(startDate)) {
        formOptions.change(ACCESS_FROM, '');
      }
    }
  };

  return (
    <FormGroup
      label="Access duration"
      isRequired
      labelIcon={
        <InputHelpPopover
          bodyContent={
            <div>
              This is the time frame you would like to be granted read access to
              accounts.
            </div>
          }
          field="access duration"
        />
      }
    >
      <Split hasGutter>
        <SplitItem>
          <DatePicker
            aria-label="Start date"
            placeholder="mm/dd/yyyy"
            value={values[ACCESS_FROM]}
            dateFormat={dateFormat}
            dateParse={dateParse}
            onChange={onStartChange}
            validators={[startCalendarValidator]}
            inputProps={{
              onBlur: ({ target: { value } }) => {
                // Don't clear invalid input - let user see what they typed to correct it
                if (value && !isCorrectFormat(value)) {
                  // Invalid format - user will see validation in helper text
                } else {
                  // Run validation on properly formatted dates
                  const parsedDate = dateParse(value);
                  if (parsedDate) {
                    startValidator(parsedDate);
                  }
                }
              },
              validated: ValidatedOptions.default, // Always show default since we have dynamic validation list
            }}
          />
        </SplitItem>
        <SplitItem className="pf-v5-u-mt-sm">to</SplitItem>
        <SplitItem>
          <DatePicker
            aria-label="End date"
            placeholder="mm/dd/yyyy"
            value={values[ACCESS_TO]}
            dateFormat={dateFormat}
            dateParse={dateParse}
            onChange={onEndChange}
            validators={[endCalendarValidator]}
            inputProps={{
              onBlur: ({ target: { value } }) => {
                // Don't clear invalid input - let user see what they typed to correct it
                if (value && !isCorrectFormat(value)) {
                  // Invalid format - user will see validation in helper text
                } else {
                  // Run end date validation
                  const parsedDate = dateParse(value);
                  if (parsedDate) {
                    endValidator(parsedDate);
                  }
                }
              },
              validated: ValidatedOptions.default, // Always show default since we have dynamic validation list
            }}
          />
        </SplitItem>
      </Split>

      {/* Dynamic validation rules helper text with icons */}
      <HelperText
        component="ul"
        aria-label="Validation rules for access duration"
        className="pf-v5-u-mt-md"
      >
        <HelperTextItem
          variant={getStartDateFormatStatus()}
          component="li"
          hasIcon
        >
          Start date must be in mm/dd/yyyy format
        </HelperTextItem>
        <HelperTextItem
          variant={getStartDateTodayStatus()}
          component="li"
          hasIcon
        >
          Start date must be today or later
        </HelperTextItem>
        <HelperTextItem
          variant={getStartDateSixtyDayStatus()}
          component="li"
          hasIcon
        >
          Start date must be within 60 days of today
        </HelperTextItem>
        <HelperTextItem
          variant={getEndDateFormatStatus()}
          component="li"
          hasIcon
        >
          End date must be in mm/dd/yyyy format
        </HelperTextItem>
        <HelperTextItem
          variant={getEndDateAfterStartStatus()}
          component="li"
          hasIcon
        >
          End date must be after start date
        </HelperTextItem>
        <HelperTextItem
          variant={getEndDateOneYearStatus()}
          component="li"
          hasIcon
        >
          Access duration may not be longer than one year
        </HelperTextItem>
      </HelperText>
    </FormGroup>
  );
};

export default AccessDuration;
