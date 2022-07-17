import React from 'react';
import {
  DatePicker,
  FormGroup,
  isValidDate,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import InputHelpPopover from '../common/InputHelpPopover';

const AccessDuration = () => {
  const formOptions = useFormApi();
  const values = formOptions.getState().values;
  const [startDate, setStartDate] = React.useState();

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

  const dateParse = (date) => {
    const split = date.split('/');
    if (split.length !== 3) {
      return new Date();
    }
    const month = split[0].padStart(2, '0');
    const day = split[1].padStart(2, '0');
    const year = split[2].padStart(4, '0');
    return new Date(`${year}-${month}-${day}T00:00:00`);
  };

  const startValidator = (date) => {
    if (isValidDate(date)) {
      if (date < today) {
        formOptions.change('end', '');
        return 'Start date must be today or later';
      }
      if (date > maxStartDate) {
        formOptions.change('end', '');
        return 'Start date must be within 60 days of today';
      }
    }

    return '';
  };

  const endValidator = (date) => {
    if (isValidDate(startDate)) {
      if (startDate > date) {
        return 'End date must be after from date';
      }
    }

    const maxToDate = new Date(startDate);
    maxToDate.setFullYear(maxToDate.getFullYear() + 1);
    return date > maxToDate
      ? 'Access duration may not be longer than one year'
      : '';
  };

  const onStartChange = (str, date) => {
    setStartDate(new Date(date));
    formOptions.change('start', str);
    if (isValidDate(date) && !startValidator(date)) {
      date.setDate(date.getDate() + 7);
      formOptions.change('end', dateFormat(date));
    } else {
      formOptions.change('end', '');
    }
  };

  const onEndChange = (str, date) => {
    if (endValidator(date)) {
      formOptions.change('end', '');
    } else {
      formOptions.change('end', str);
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
            value={values['start']}
            dateFormat={dateFormat}
            dateParse={dateParse}
            onChange={onStartChange}
            validators={[startValidator]}
          />
        </SplitItem>
        <SplitItem className="pf-u-mt-sm">to</SplitItem>
        <SplitItem>
          <DatePicker
            aria-label="End date"
            placeholder="mm/dd/yyyy"
            value={values['end']}
            dateFormat={dateFormat}
            dateParse={dateParse}
            onChange={onEndChange}
            validators={[endValidator]}
          />
        </SplitItem>
      </Split>
    </FormGroup>
  );
};

export default AccessDuration;
