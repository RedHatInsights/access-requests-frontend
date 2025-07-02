import React from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/redux';
import apiInstance from '../../Helpers/apiInstance';
import { AccessRequestStatus } from '../../Helpers/getLabelProps';

// Global variable declaration
declare const API_BASE: string;

interface AccessRequestRole {
  id: string;
  display_name: string;
  resource_definitions: any[];
  [key: string]: any;
}

interface AccessRequest {
  request_id: string;
  target_account: string;
  target_org: string;
  first_name: string;
  last_name: string;
  start_date: string;
  end_date: string;
  created: string;
  status: AccessRequestStatus;
  roles: AccessRequestRole[];
  [key: string]: any;
}

interface OpenModal {
  type: 'edit' | 'cancel' | null;
  requestId?: string;
}

interface UseAccessRequestDetailsProps {
  isInternal: boolean;
}

interface UseAccessRequestDetailsReturn {
  request: AccessRequest | undefined;
  requestId: string;
  openModal: OpenModal;
  setOpenModal: (modal: OpenModal) => void;
  onModalClose: () => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  requestDisplayProps: string[];
}

export const useAccessRequestDetails = ({
  isInternal,
}: UseAccessRequestDetailsProps): UseAccessRequestDetailsReturn => {
  const [request, setRequest] = React.useState<AccessRequest>();
  const { requestId } = useParams<{ requestId: string }>();
  const dispatch = useDispatch();

  React.useEffect(() => {
    if (!requestId) return;

    apiInstance
      .get(
        `${API_BASE}/cross-account-requests/${requestId}/${
          isInternal ? '?query_by=user_id' : '?query_by=target_org'
        }`,
        { headers: { Accept: 'application/json' } }
      )
      .then((res: any) => {
        // responseDataInterceptor returns data directly
        if (res.errors && res.errors.length > 0) {
          throw Error(
            res.errors.map((e: { detail: string }) => e.detail).join('\n')
          );
        }
        setRequest(res);
      })
      .catch((err: Error) => {
        dispatch(
          addNotification({
            variant: 'danger',
            title: 'Could not load access request',
            description: err.message,
          })
        );
      });
  }, [requestId, isInternal, dispatch]);

  // Modal state
  const [openModal, setOpenModal] = React.useState<OpenModal>({ type: null });
  const onModalClose = React.useCallback(
    () => setOpenModal({ type: null }),
    []
  );

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = React.useState<boolean>(false);

  // Determine which properties to display based on internal/external view
  const requestDisplayProps = React.useMemo(
    () => [
      ...(isInternal
        ? ['request_id', 'target_account', 'target_org']
        : ['first_name', 'last_name']),
      'start_date',
      'end_date',
      'created',
    ],
    [isInternal]
  );

  return {
    request,
    requestId: requestId || '',
    openModal,
    setOpenModal,
    onModalClose,
    isDropdownOpen,
    setIsDropdownOpen,
    requestDisplayProps,
  };
};
