import React from 'react';
import { isValidDate } from '@patternfly/react-core';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { ACCESS_FROM, ACCESS_TO } from '../schema';

type ValidationStatus = 'success' | 'error' | 'indeterminate';

interface UseAccessDurationReturn {
  // Form values and state
  startValue: string;
  endValue: string;
  currentStartValue: string;
  currentEndValue: string;

  // Validation functions
  startValidator: (date: Date) => string;
  endValidator: (date: Date) => string;
  startCalendarValidator: (date: Date) => string;
  endCalendarValidator: (date: Date) => string;

  // Validation status functions
  getStartDateTodayStatus: () => ValidationStatus;
  getStartDateSixtyDayStatus: () => ValidationStatus;
  getStartDateFormatStatus: () => ValidationStatus;
  getEndDateAfterStartStatus: () => ValidationStatus;
  getEndDateOneYearStatus: () => ValidationStatus;
  getEndDateFormatStatus: () => ValidationStatus;

  // Date utility functions
  dateFormat: (date: Date) => string;
  dateParse: (date: string) => Date;
  isCorrectFormat: (date: string) => boolean;

  // Event handlers
  onStartChange: (
    e: React.FormEvent<HTMLInputElement>,
    str: string,
    date?: Date
  ) => void;
  onEndChange: (
    e: React.FormEvent<HTMLInputElement>,
    str: string,
    date?: Date
  ) => void;
  onStartBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  onEndBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const useAccessDuration = (): UseAccessDurationReturn => {
  const formOptions = useFormApi();
  const values = formOptions.getState().values;
  const [startDate, setStartDate] = React.useState<Date | undefined>();
  const [currentStartValue, setCurrentStartValue] = React.useState<string>('');
  const [currentEndValue, setCurrentEndValue] = React.useState<string>('');

  // Sync current values with form values on mount and updates
  React.useEffect(() => {
    setCurrentStartValue(values[ACCESS_FROM] || '');
    setCurrentEndValue(values[ACCESS_TO] || '');
  }, [values[ACCESS_FROM], values[ACCESS_TO]]);

  const maxStartDate = new Date();
  maxStartDate.setDate(maxStartDate.getDate() + 60);

  const dateFormat = (date: Date): string =>
    date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

  const isCorrectFormat = (date: string): boolean =>
    /^([0]?[1-9]|[1][0-2])\/([0]?[1-9]|[1|2][0-9]|[3][0|1])\/([0-9]{4})$/.test(
      date
    );

  const dateParse = (date: string): Date => {
    const split = date.split('/');
    if (!isCorrectFormat(date)) {
      return new Date(''); // Return invalid date for invalid format
    }
    const month = split[0].padStart(2, '0');
    const day = split[1].padStart(2, '0');
    const year = split[2].padStart(4, '0');
    return new Date(`${year}-${month}-${day}T00:00:00`);
  };

  // Helper function for safe parsing that can return undefined
  const safeDataParse = (date: string): Date | undefined => {
    const split = date.split('/');
    if (!isCorrectFormat(date)) {
      return undefined;
    }
    const month = split[0].padStart(2, '0');
    const day = split[1].padStart(2, '0');
    const year = split[2].padStart(4, '0');
    return new Date(`${year}-${month}-${day}T00:00:00`);
  };

  const startValidator = (date: Date): string => {
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

  const endValidator = (date: Date): string => {
    if (startDate && isValidDate(startDate)) {
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
  const startCalendarValidator = (date: Date): string => {
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

  const endCalendarValidator = (date: Date): string => {
    if (!isValidDate(date) || !startDate || !isValidDate(startDate)) return '';

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
  const getStartDateTodayStatus = (): ValidationStatus => {
    const startValue = currentStartValue || values[ACCESS_FROM];
    if (!startValue || !isCorrectFormat(startValue)) return 'indeterminate';

    const parsedDate = safeDataParse(startValue);
    if (!parsedDate) return 'indeterminate';

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const dateStart = new Date(parsedDate);
    dateStart.setHours(0, 0, 0, 0);

    return dateStart >= todayStart ? 'success' : 'error';
  };

  const getStartDateSixtyDayStatus = (): ValidationStatus => {
    const startValue = currentStartValue || values[ACCESS_FROM];
    if (!startValue || !isCorrectFormat(startValue)) return 'indeterminate';

    const parsedDate = safeDataParse(startValue);
    if (!parsedDate) return 'indeterminate';

    return parsedDate <= maxStartDate ? 'success' : 'error';
  };

  const getStartDateFormatStatus = (): ValidationStatus => {
    const startValue = currentStartValue || values[ACCESS_FROM];
    if (!startValue) return 'indeterminate';

    return isCorrectFormat(startValue) ? 'success' : 'error';
  };

  const getEndDateAfterStartStatus = (): ValidationStatus => {
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

    const parsedEndDate = safeDataParse(endValue);
    const parsedStartDate = safeDataParse(startValue);

    if (!parsedEndDate || !parsedStartDate) return 'indeterminate';

    return parsedEndDate > parsedStartDate ? 'success' : 'error';
  };

  const getEndDateOneYearStatus = (): ValidationStatus => {
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

    const parsedEndDate = safeDataParse(endValue);
    const parsedStartDate = safeDataParse(startValue);

    if (!parsedEndDate || !parsedStartDate) return 'indeterminate';

    const maxToDate = new Date(parsedStartDate);
    maxToDate.setFullYear(maxToDate.getFullYear() + 1);

    return parsedEndDate <= maxToDate ? 'success' : 'error';
  };

  const getEndDateFormatStatus = (): ValidationStatus => {
    const endValue = currentEndValue || values[ACCESS_TO];
    if (!endValue) return 'indeterminate';

    return isCorrectFormat(endValue) ? 'success' : 'error';
  };

  const onStartChange = (
    _e: React.FormEvent<HTMLInputElement>,
    str: string,
    date?: Date
  ) => {
    setStartDate(date ? new Date(date) : undefined);
    formOptions.change(ACCESS_FROM, str);
    setCurrentStartValue(str);

    if (date && isValidDate(date) && !startValidator(date)) {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + 7);
      formOptions.change(ACCESS_TO, dateFormat(newDate));
    }
  };

  const onEndChange = (
    _e: React.FormEvent<HTMLInputElement>,
    str: string,
    date?: Date
  ) => {
    formOptions.change(ACCESS_TO, str);
    setCurrentEndValue(str);

    if (date && isValidDate(date) && !endValidator(date)) {
      if (startDate && startValidator(startDate)) {
        formOptions.change(ACCESS_FROM, '');
      }
    }
  };

  const onStartBlur = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => {
    if (value && !isCorrectFormat(value)) {
      // Invalid format - user will see validation in helper text
    } else {
      // Run validation on properly formatted dates
      const parsedDate = safeDataParse(value);
      if (parsedDate) {
        startValidator(parsedDate);
      }
    }
  };

  const onEndBlur = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => {
    if (value && !isCorrectFormat(value)) {
      // Invalid format - user will see validation in helper text
    } else {
      // Run end date validation
      const parsedDate = safeDataParse(value);
      if (parsedDate) {
        endValidator(parsedDate);
      }
    }
  };

  return {
    // Form values and state
    startValue: values[ACCESS_FROM],
    endValue: values[ACCESS_TO],
    currentStartValue,
    currentEndValue,

    // Validation functions
    startValidator,
    endValidator,
    startCalendarValidator,
    endCalendarValidator,

    // Validation status functions
    getStartDateTodayStatus,
    getStartDateSixtyDayStatus,
    getStartDateFormatStatus,
    getEndDateAfterStartStatus,
    getEndDateOneYearStatus,
    getEndDateFormatStatus,

    // Date utility functions
    dateFormat,
    dateParse,
    isCorrectFormat,

    // Event handlers
    onStartChange,
    onEndChange,
    onStartBlur,
    onEndBlur,
  };
};
