import React from 'react';
import {
  DatePicker,
  FormGroup,
  HelperText,
  HelperTextItem,
  Split,
  SplitItem,
  ValidatedOptions,
} from '@patternfly/react-core';
import InputHelpPopover from '../common/InputHelpPopover';
import { useAccessDuration } from './hooks/useAccessDuration';

const AccessDuration: React.FC = () => {
  const {
    startValue,
    endValue,
    dateFormat,
    dateParse,
    onStartChange,
    onEndChange,
    onStartBlur,
    onEndBlur,
    startCalendarValidator,
    endCalendarValidator,
    getStartDateTodayStatus,
    getStartDateSixtyDayStatus,
    getStartDateFormatStatus,
    getEndDateAfterStartStatus,
    getEndDateOneYearStatus,
    getEndDateFormatStatus,
  } = useAccessDuration();

  return (
    <FormGroup
      label="Access duration"
      isRequired
      labelHelp={
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
            value={startValue}
            dateFormat={dateFormat}
            dateParse={dateParse}
            onChange={onStartChange}
            validators={[startCalendarValidator]}
            inputProps={{
              onBlur: onStartBlur,
              validated: ValidatedOptions.default,
            }}
          />
        </SplitItem>
        <SplitItem className="pf-v6-u-mt-sm">to</SplitItem>
        <SplitItem>
          <DatePicker
            aria-label="End date"
            placeholder="mm/dd/yyyy"
            value={endValue}
            dateFormat={dateFormat}
            dateParse={dateParse}
            onChange={onEndChange}
            validators={[endCalendarValidator]}
            inputProps={{
              onBlur: onEndBlur,
              validated: ValidatedOptions.default,
            }}
          />
        </SplitItem>
      </Split>

      {/* Dynamic validation rules helper text with icons */}
      <HelperText
        component="ul"
        aria-label="Validation rules for access duration"
        className="pf-v6-u-mt-md"
      >
        <HelperTextItem
          variant={getStartDateFormatStatus()}
          component="li"
          screenReaderText="Start date format validation"
        >
          Start date must be in mm/dd/yyyy format
        </HelperTextItem>
        <HelperTextItem
          variant={getStartDateTodayStatus()}
          component="li"
          screenReaderText="Start date minimum validation"
        >
          Start date must be today or later
        </HelperTextItem>
        <HelperTextItem
          variant={getStartDateSixtyDayStatus()}
          component="li"
          screenReaderText="Start date maximum validation"
        >
          Start date must be within 60 days of today
        </HelperTextItem>
        <HelperTextItem
          variant={getEndDateFormatStatus()}
          component="li"
          screenReaderText="End date format validation"
        >
          End date must be in mm/dd/yyyy format
        </HelperTextItem>
        <HelperTextItem
          variant={getEndDateAfterStartStatus()}
          component="li"
          screenReaderText="End date ordering validation"
        >
          End date must be after start date
        </HelperTextItem>
        <HelperTextItem
          variant={getEndDateOneYearStatus()}
          component="li"
          screenReaderText="Maximum duration validation"
        >
          Access duration may not be longer than one year
        </HelperTextItem>
      </HelperText>
    </FormGroup>
  );
};

export default AccessDuration;
