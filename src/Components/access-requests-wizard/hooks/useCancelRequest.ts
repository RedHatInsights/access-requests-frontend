import React from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/redux';
import apiInstance from '../../../Helpers/apiInstance';

// Global variable declaration
declare const API_BASE: string;

interface UseCancelRequestProps {
  requestId: string;
  onClose: (isChanged: boolean) => void;
}

interface UseCancelRequestReturn {
  isLoading: boolean;
  onCancel: () => void;
}

export const useCancelRequest = ({
  requestId,
  onClose,
}: UseCancelRequestProps): UseCancelRequestReturn => {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const dispatch = useDispatch();

  const onCancel = () => {
    setIsLoading(true);

    apiInstance
      .patch(
        `${API_BASE}/cross-account-requests/${requestId}/`,
        { status: 'cancelled' },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      )
      .then((res: any) => {
        // responseDataInterceptor returns data directly, not full AxiosResponse
        if (res.errors && res.errors.length > 0) {
          throw Error(
            res.errors.map((e: { detail: string }) => e.detail).join('\n')
          );
        }

        onClose(true);
        dispatch(
          addNotification({
            variant: 'success',
            title: 'Request cancelled successfully',
          })
        );
      })
      .catch((err: Error) => {
        console.error(err);
        setIsLoading(false);
        dispatch(
          addNotification({
            variant: 'danger',
            title: 'Could not cancel request',
            description: err.message,
          })
        );
      });
  };

  return {
    isLoading,
    onCancel,
  };
};
