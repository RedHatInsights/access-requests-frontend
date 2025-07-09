import React from 'react';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import apiInstance from '../apiInstance';
import { AccessRequestStatus } from '../getLabelProps';

// Global variable declaration
declare const API_BASE: string;

interface UseStatusUpdateProps {
  requestId: string;
  initialStatus: AccessRequestStatus;
}

interface UseStatusUpdateReturn {
  status: AccessRequestStatus;
  isEditing: boolean;
  isLoading: boolean;
  setIsEditing: (editing: boolean) => void;
  updateStatus: (newStatus: AccessRequestStatus) => void;
}

export const useStatusUpdate = ({
  requestId,
  initialStatus,
}: UseStatusUpdateProps): UseStatusUpdateReturn => {
  const [status, setStatus] =
    React.useState<AccessRequestStatus>(initialStatus);
  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const addNotification = useAddNotification();

  const updateStatus = React.useCallback(
    (newStatus: AccessRequestStatus) => {
      setIsLoading(true);

      apiInstance
        .patch(
          `${API_BASE}/cross-account-requests/${requestId}/`,
          { status: newStatus },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          }
        )
        .then((res: any) => {
          // responseDataInterceptor returns data directly
          if (res.errors && res.errors.length > 0) {
            throw Error(
              res.errors.map((e: { detail: string }) => e.detail).join('\n')
            );
          }

          addNotification({
            variant: 'success',
            title: `Request ${newStatus} successfully`,
          });

          setStatus(newStatus);
          setIsEditing(false);
          setIsLoading(false);
        })
        .catch((err: Error) => {
          addNotification({
            variant: 'danger',
            title: `There was an error ${
              newStatus === 'approved' ? 'approving' : 'denying'
            } your request`,
            description: err.message,
          });
          setIsLoading(false);
        });
    },
    [requestId, addNotification]
  );

  return {
    status,
    isEditing,
    isLoading,
    setIsEditing,
    updateStatus,
  };
};
