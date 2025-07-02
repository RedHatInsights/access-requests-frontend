import React from 'react';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';

interface UseFormFieldProps {
  name: string; // Required by useFieldApi
  [key: string]: any; // Additional props from data-driven-forms
}

interface UseFormFieldReturn {
  // Form state and values
  value: any;
  onChange: (value: any) => void;
  formValues: Record<string, any>;

  // Form API methods
  getState: () => any;
  change: (field: string, value: any) => void;
}

export const useFormField = (props: UseFormFieldProps): UseFormFieldReturn => {
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();
  const values = formOptions.getState().values;

  const onChange = React.useCallback(
    (newValue: any) => {
      input.onChange(newValue);
    },
    [input]
  );

  return {
    // Form state and values
    value: input.value,
    onChange,
    formValues: values,

    // Form API methods
    getState: formOptions.getState,
    change: formOptions.change,
  };
};
