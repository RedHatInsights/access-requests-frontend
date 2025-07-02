import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import {
  ACCESS_FROM,
  ACCESS_TO,
  ACCOUNT_NUMBER,
  FIRST_NAME,
  LAST_NAME,
  SELECTED_ROLES,
} from '../schema';

interface ReviewData {
  accountName: string;
  accountNumber: string;
  accessFrom: string;
  accessTo: string;
  selectedRoles: string[];
}

interface UseReviewDetailsReturn {
  data: ReviewData;
}

export const useReviewDetails = (): UseReviewDetailsReturn => {
  const formOptions = useFormApi();
  const values = formOptions.getState().values;

  const data: ReviewData = {
    accountName: `${values[FIRST_NAME] || ''} ${
      values[LAST_NAME] || ''
    }`.trim(),
    accountNumber: values[ACCOUNT_NUMBER] || '',
    accessFrom: values[ACCESS_FROM] || '',
    accessTo: values[ACCESS_TO] || '',
    selectedRoles: values[SELECTED_ROLES] || [],
  };

  return { data };
};
