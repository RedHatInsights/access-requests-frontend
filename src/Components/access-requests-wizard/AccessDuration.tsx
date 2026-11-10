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
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import InputHelpPopover from '../common/InputHelpPopover';
import { useAccessDuration } from './hooks/useAccessDuration';

const messages = defineMessages({
  label: {
    id: 'accessRequests.wizard.accessDuration.label',
    defaultMessage: 'Access duration',
  },
  popoverBody: {
    id: 'accessRequests.wizard.accessDuration.popoverBody',
    defaultMessage:
      'This is the time frame you would like to be granted read access to accounts.',
  },
  popoverField: {
    id: 'accessRequests.wizard.accessDuration.popoverField',
    defaultMessage: 'access duration',
  },
  startDateAria: {
    id: 'accessRequests.wizard.accessDuration.startDateAria',
    defaultMessage: 'Start date',
  },
  endDateAria: {
    id: 'accessRequests.wizard.accessDuration.endDateAria',
    defaultMessage: 'End date',
  },
  dateSeparator: {
    id: 'accessRequests.wizard.accessDuration.dateSeparator',
    defaultMessage: 'to',
  },
  validationAria: {
    id: 'accessRequests.wizard.accessDuration.validationAria',
    defaultMessage: 'Validation rules for access duration',
  },
  startFormatSr: {
    id: 'accessRequests.wizard.accessDuration.startFormatSr',
    defaultMessage: 'Start date format validation',
  },
  startFormat: {
    id: 'accessRequests.wizard.accessDuration.startFormat',
    defaultMessage: 'Start date must be in mm/dd/yyyy format',
  },
  startMinSr: {
    id: 'accessRequests.wizard.accessDuration.startMinSr',
    defaultMessage: 'Start date minimum validation',
  },
  startMin: {
    id: 'accessRequests.wizard.accessDuration.startMin',
    defaultMessage: 'Start date must be today or later',
  },
  startMaxSr: {
    id: 'accessRequests.wizard.accessDuration.startMaxSr',
    defaultMessage: 'Start date maximum validation',
  },
  startMax: {
    id: 'accessRequests.wizard.accessDuration.startMax',
    defaultMessage: 'Start date must be within 60 days of today',
  },
  endFormatSr: {
    id: 'accessRequests.wizard.accessDuration.endFormatSr',
    defaultMessage: 'End date format validation',
  },
  endFormat: {
    id: 'accessRequests.wizard.accessDuration.endFormat',
    defaultMessage: 'End date must be in mm/dd/yyyy format',
  },
  endOrderSr: {
    id: 'accessRequests.wizard.accessDuration.endOrderSr',
    defaultMessage: 'End date ordering validation',
  },
  endOrder: {
    id: 'accessRequests.wizard.accessDuration.endOrder',
    defaultMessage: 'End date must be after start date',
  },
  maxDurationSr: {
    id: 'accessRequests.wizard.accessDuration.maxDurationSr',
    defaultMessage: 'Maximum duration validation',
  },
  maxDuration: {
    id: 'accessRequests.wizard.accessDuration.maxDuration',
    defaultMessage: 'Access duration may not be longer than one year',
  },
});

const AccessDuration: React.FC = () => {
  const intl = useIntl();
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
      label={<FormattedMessage {...messages.label} />}
      isRequired
      labelHelp={
        <InputHelpPopover
          bodyContent={
            <div>
              <FormattedMessage {...messages.popoverBody} />
            </div>
          }
          field={intl.formatMessage(messages.popoverField)}
        />
      }
    >
      <Split hasGutter>
        <SplitItem>
          <DatePicker
            aria-label={intl.formatMessage(messages.startDateAria)}
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
        <SplitItem className="pf-v6-u-mt-sm">
          <FormattedMessage {...messages.dateSeparator} />
        </SplitItem>
        <SplitItem>
          <DatePicker
            aria-label={intl.formatMessage(messages.endDateAria)}
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
        aria-label={intl.formatMessage(messages.validationAria)}
        className="pf-v6-u-mt-md"
      >
        <HelperTextItem
          variant={getStartDateFormatStatus()}
          component="li"
          screenReaderText={intl.formatMessage(messages.startFormatSr)}
        >
          <FormattedMessage {...messages.startFormat} />
        </HelperTextItem>
        <HelperTextItem
          variant={getStartDateTodayStatus()}
          component="li"
          screenReaderText={intl.formatMessage(messages.startMinSr)}
        >
          <FormattedMessage {...messages.startMin} />
        </HelperTextItem>
        <HelperTextItem
          variant={getStartDateSixtyDayStatus()}
          component="li"
          screenReaderText={intl.formatMessage(messages.startMaxSr)}
        >
          <FormattedMessage {...messages.startMax} />
        </HelperTextItem>
        <HelperTextItem
          variant={getEndDateFormatStatus()}
          component="li"
          screenReaderText={intl.formatMessage(messages.endFormatSr)}
        >
          <FormattedMessage {...messages.endFormat} />
        </HelperTextItem>
        <HelperTextItem
          variant={getEndDateAfterStartStatus()}
          component="li"
          screenReaderText={intl.formatMessage(messages.endOrderSr)}
        >
          <FormattedMessage {...messages.endOrder} />
        </HelperTextItem>
        <HelperTextItem
          variant={getEndDateOneYearStatus()}
          component="li"
          screenReaderText={intl.formatMessage(messages.maxDurationSr)}
        >
          <FormattedMessage {...messages.maxDuration} />
        </HelperTextItem>
      </HelperText>
    </FormGroup>
  );
};

export default AccessDuration;
