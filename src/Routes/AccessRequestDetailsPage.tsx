import React, { useContext } from 'react';
import { Provider } from 'react-redux';
import { RegistryContext } from '../store';
import { useAccessRequestDetails } from './hooks/useAccessRequestDetails';
import { AccessRequestDetailsPageView } from '../Components/AccessRequestDetailsPageView';

const BaseAccessRequestDetailsPage: React.FC<{
  isInternal: boolean;
}> = ({ isInternal }) => {
  const {
    request,
    requestId,
    openModal,
    setOpenModal,
    onModalClose,
    isDropdownOpen,
    setIsDropdownOpen,
    requestDisplayProps,
  } = useAccessRequestDetails({ isInternal });

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleActionClick = (params: {
    type: 'edit' | 'cancel';
    requestId: string;
  }) => {
    setOpenModal({ type: params.type });
  };

  return (
    <AccessRequestDetailsPageView
      isInternal={isInternal}
      request={request}
      requestId={requestId}
      requestDisplayProps={requestDisplayProps}
      isDropdownOpen={isDropdownOpen}
      openModal={openModal}
      onDropdownToggle={handleDropdownToggle}
      onModalClose={onModalClose}
      onActionClick={handleActionClick}
    />
  );
};

interface AccessRequestDetailsPageProps {
  /**
   * Determines the view type for the access request details page.
   * - `true`: Internal view for Red Hat employees (shows actions, status management)
   * - `false`: External view for customers (read-only, shows decision status)
   *
   * Optional because this component serves dual purposes:
   * 1. Standalone app (determines view from route context)
   * 2. Federated module consumed by RBAC UI (explicit prop control)
   */
  isInternal?: boolean;
}

/**
 * This component is a federated module used in https://github.com/RedHatInsights/insights-rbac-ui
 * Try not to break RBAC.
 */
const AccessRequestDetailsPage: React.FC<AccessRequestDetailsPageProps> = ({
  isInternal = false,
}) => {
  const { getRegistry } = useContext(RegistryContext);

  return (
    <Provider store={(getRegistry as any)().getStore()}>
      <BaseAccessRequestDetailsPage isInternal={isInternal} />
    </Provider>
  );
};

export default AccessRequestDetailsPage;
