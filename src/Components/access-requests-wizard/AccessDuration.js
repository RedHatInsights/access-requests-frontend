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
  const [endError, setEndError] = React.useState();
  const [startError, setStartError] = React.useState();

  const today = new Date();
  today.setDate(today.getDate() - 1);
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
      if (date < today) {
        const message = 'Start date must be today or later';
        setStartError(message);
        return message;
      }
      if (date > maxStartDate) {
        const message = 'Start date must be within 60 days of today';
        setStartError(message);
        return message;
      }
    }
    setStartError();
    return '';
  };

  const endValidator = (date) => {
    setEndError();
    if (isValidDate(startDate)) {
      if (startDate > date) {
        const message = 'End date must be after start date';
        setEndError(message);
        return message;
      }

      const maxToDate = new Date(startDate);
      maxToDate.setFullYear(maxToDate.getFullYear() + 1);
      const message = 'Access duration may not be longer than one year';
      date > maxToDate && setEndError(message);
      return date > maxToDate ? message : '';
    }
    setEndError();
    return '';
  };

  const onStartChange = (str, date) => {
    setStartDate(date ? new Date(date) : undefined);
    formOptions.change(ACCESS_FROM, isCorrectFormat(str) ? str : '');
    if (isValidDate(date) && !startValidator(date)) {
      date.setDate(date.getDate() + 7);
      formOptions.change(ACCESS_TO, dateFormat(date));
      setEndError();
    }
  };

  const onEndChange = (str, date) => {
    if (endValidator(date) || !isCorrectFormat(str)) {
      formOptions.change(ACCESS_TO, '');
    } else {
      formOptions.change(ACCESS_TO, str);
      startValidator(startDate) &&
        formOptions.change(ACCESS_FROM, '') &&
        setStartError();
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
              This is the org ID of the account that you would like to receive
              read access to
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
            validators={[startValidator]}
            inputProps={{
              onBlur: ({ target: { value } }) => onStartChange(value),
              validated:
                values[ACCESS_FROM] === '' ||
                (values[ACCESS_FROM] && !isCorrectFormat(values[ACCESS_FROM]))
                  ? ValidatedOptions.error
                  : ValidatedOptions.default,
            }}
          />
          {startError || values[ACCESS_FROM] === '' ? (
            <HelperText>
              <HelperTextItem variant="error">
                {values[ACCESS_FROM] === ''
                  ? 'Enter a valid date '
                  : startError}
              </HelperTextItem>
            </HelperText>
          ) : null}
        </SplitItem>
        <SplitItem className="pf-u-mt-sm">to</SplitItem>
        <SplitItem>
          <DatePicker
            aria-label="End date"
            placeholder="mm/dd/yyyy"
            value={values[ACCESS_TO]}
            dateFormat={dateFormat}
            dateParse={dateParse}
            onChange={onEndChange}
            validators={[endValidator]}
            inputProps={{
              onBlur: ({ target: { value } }) => onEndChange(value),
              validated:
                values[ACCESS_TO] === '' ||
                (values[ACCESS_TO] && !isCorrectFormat(values[ACCESS_TO]))
                  ? ValidatedOptions.error
                  : ValidatedOptions.default,
            }}
          />
          {endError || values[ACCESS_TO] === '' ? (
            <HelperText>
              <HelperTextItem variant="error">
                {values[ACCESS_FROM] === '' ? 'Enter a valid date ' : endError}
              </HelperTextItem>
            </HelperText>
          ) : null}
        </SplitItem>
      </Split>
    </FormGroup>
  );
};

export default AccessDuration;
