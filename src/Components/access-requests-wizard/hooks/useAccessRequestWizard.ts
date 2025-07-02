import React from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/redux';
import apiInstance from '../../../Helpers/apiInstance';
import {
  ACCESS_FROM,
  ACCESS_TO,
  ACCOUNT_NUMBER,
  ORG_ID,
  SELECTED_ROLES,
} from '../schema';

// Global variable declarations
declare const API_BASE: string;
declare const insights: any;

interface User {
  first_name: string;
  last_name: string;
  username: string;
  [key: string]: any;
}

interface RequestDetails {
  target_account: string;
  target_org: string;
  start_date: string;
  end_date: string;
  roles: Array<{ display_name: string; [key: string]: any }>;
  errors?: Array<{ detail: string }>;
  [key: string]: any;
}

interface ErrorState {
  title: string;
  description: string;
}

interface FormValues {
  [ACCOUNT_NUMBER]: string;
  [ORG_ID]: string;
  [ACCESS_FROM]: string;
  [ACCESS_TO]: string;
  [SELECTED_ROLES]: string[];
  [key: string]: any;
}

interface UseAccessRequestWizardProps {
  requestId?: string;
  variant: 'create' | 'edit';
  onClose: (shouldRefresh: boolean) => void;
}

interface UseAccessRequestWizardReturn {
  cancelWarningVisible: boolean;
  setCancelWarningVisible: (visible: boolean) => void;
  error: ErrorState | undefined;
  setError: (error: ErrorState | undefined) => void;
  initialValues: FormValues | undefined;
  isLoading: boolean;
  isSubmitting: boolean;
  user: User | undefined;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
  onCloseCancelWarning: () => void;
  clearError: () => void;
}

const invalidAccountTitle = 'Invalid Account number';

export const useAccessRequestWizard = ({
  requestId,
  variant,
  onClose,
}: UseAccessRequestWizardProps): UseAccessRequestWizardReturn => {
  const dispatch = useDispatch();
  const isEdit = variant === 'edit';

  const [cancelWarningVisible, setCancelWarningVisible] =
    React.useState<boolean>(false);
  const [error, setError] = React.useState<ErrorState>();
  const [initialValues, setInitialValues] = React.useState<FormValues>();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [user, setUser] = React.useState<User>();

  // Load user data and request details (if editing)
  React.useEffect(() => {
    setIsLoading(true);

    const userPromise = insights.chrome.auth.getUser();
    const detailsPromise =
      isEdit && requestId
        ? apiInstance.get(
            `${API_BASE}/cross-account-requests/${requestId}/?query_by=user_id`,
            { headers: { Accept: 'application/json' } }
          )
        : Promise.resolve(true);

    Promise.all([userPromise, detailsPromise])
      .then(([userResponse, details]: [any, any]) => {
        // Handle user data
        if (userResponse?.identity?.user) {
          setUser(userResponse.identity.user);
        } else {
          throw new Error(
            "Couldn't get current user. Make sure you're logged in"
          );
        }

        // Handle request details for edit mode
        if (
          isEdit &&
          details &&
          typeof details === 'object' &&
          details !== true
        ) {
          // responseDataInterceptor returns data directly
          const requestDetails = details as RequestDetails;

          if (requestDetails.errors && requestDetails.errors.length > 0) {
            throw new Error(
              requestDetails.errors.map((e) => e.detail).join('\n')
            );
          }

          if (requestDetails.target_account) {
            setInitialValues({
              [ACCOUNT_NUMBER]: requestDetails.target_account,
              [ORG_ID]: requestDetails.target_org,
              [ACCESS_FROM]: requestDetails.start_date,
              [ACCESS_TO]: requestDetails.end_date,
              [SELECTED_ROLES]: requestDetails.roles.map(
                (role) => role.display_name
              ),
            });
          } else {
            throw new Error(`Could not fetch details for request ${requestId}`);
          }
        }

        setIsLoading(false);
      })
      .catch((err: Error) => {
        setIsLoading(false);
        dispatch(
          addNotification({
            variant: 'danger',
            title: 'Could not load access request',
            description: err.message,
          })
        );
      });
  }, [isEdit, requestId, dispatch]);

  const onSubmit = React.useCallback(
    (values: FormValues) => {
      setIsSubmitting(true);

      const body = {
        target_account: values[ACCOUNT_NUMBER],
        start_date: values[ACCESS_FROM],
        end_date: values[ACCESS_TO],
        target_org: values[ORG_ID],
        roles: values[SELECTED_ROLES],
      };

      setInitialValues(values);

      const apiCall = isEdit
        ? apiInstance.put(
            `${API_BASE}/cross-account-requests/${requestId}/`,
            body,
            {
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
            }
          )
        : apiInstance.post(`${API_BASE}/cross-account-requests/`, body, {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          });

      apiCall
        .then((res: any) => {
          // responseDataInterceptor returns data directly
          if (res.errors && res.errors.length > 0) {
            throw new Error(res.errors[0].detail);
          }

          dispatch(
            addNotification({
              variant: 'success',
              title: `${isEdit ? 'Edited' : 'Created'} access request`,
              description: res.request_id,
            })
          );

          onClose(true);
        })
        .catch((err: any) => {
          const errors = err.errors || [];
          const errorMessage =
            errors[0]?.message || errors[0]?.detail || err.message;

          const isInvalidAccount = /Account .* does not exist/.test(
            errorMessage
          );

          setError({
            title: isInvalidAccount
              ? invalidAccountTitle
              : `Could not ${variant} access request`,
            description: isInvalidAccount
              ? 'Please return to Step 1: Request details and input a new account number for your request.'
              : errorMessage,
          });

          setIsSubmitting(false);
        });
    },
    [isEdit, requestId, variant, onClose, dispatch]
  );

  const onCancel = React.useCallback(() => {
    setCancelWarningVisible(true);
  }, []);

  const onCloseCancelWarning = React.useCallback(() => {
    setCancelWarningVisible(false);
    onClose(false);
  }, [onClose]);

  const clearError = React.useCallback(() => {
    setError(undefined);
  }, []);

  return {
    cancelWarningVisible,
    setCancelWarningVisible,
    error,
    setError,
    initialValues,
    isLoading,
    isSubmitting,
    user,
    onSubmit,
    onCancel,
    onCloseCancelWarning,
    clearError,
  };
};
