import React from 'react';
import { Provider } from 'react-redux';
import { PageSection, Title } from '@patternfly/react-core';
import AccessRequestsTable from '../Components/AccessRequestsTable';
import registry from '../store';
import ErroReducerCatcher from '../Components/ErrorReducerCatcher';

interface AccessRequestsPageProps {
  /**
   * Determines the view type for the access requests table.
   * - `true`: Internal view for Red Hat employees (shows account info, can create requests)
   * - `false`: External view for customers (shows user info, read-only)
   *
   * Optional because this component serves dual purposes:
   * 1. Standalone app (determines view from route context)
   * 2. Federated module consumed by RBAC UI (explicit prop control)
   */
  isInternal?: boolean;
}

const AccessRequestsPage: React.FC<AccessRequestsPageProps> = ({
  isInternal = false,
}) => {
  return (
    <Provider store={registry.getStore()}>
      <ErroReducerCatcher>
        <PageSection variant="light">
          <Title headingLevel="h1" className="pf-v5-u-pb-sm">
            Access Requests
          </Title>
          <p>
            Below is a list of all submitted requests for read only account
            access.
          </p>
        </PageSection>
        <PageSection padding={{ default: 'noPadding' }}>
          <AccessRequestsTable isInternal={isInternal} />
        </PageSection>
      </ErroReducerCatcher>
    </Provider>
  );
};

// This component is a federated module used in https://github.com/RedHatInsights/insights-rbac-ui
// Try not to break RBAC.

export default AccessRequestsPage;
