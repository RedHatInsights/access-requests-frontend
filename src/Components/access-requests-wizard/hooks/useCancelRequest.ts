import React from 'react';
import apiInstance from '../../../Helpers/apiInstance';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';

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
  const addNotification = useAddNotification();

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
        addNotification({
          variant: 'success',
          title: 'Request cancelled successfully',
        });
      })
      .catch((err: Error) => {
        console.error(err);
        setIsLoading(false);
        addNotification({
          variant: 'danger',
          title: 'Could not cancel request',
          description: err.message,
        });
      });
  };

  return {
    isLoading,
    onCancel,
  };
};
