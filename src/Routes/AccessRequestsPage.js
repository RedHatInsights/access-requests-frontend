import React from 'react';
import { Provider } from 'react-redux';
import { PageSection, Title } from '@patternfly/react-core';
import AccessRequestsTable from '../Components/AccessRequestsTable';
import PropTypes from 'prop-types';
import registry from '../store';
import ErroReducerCatcher from '../Components/ErrorReducerCatcher';

const AccessRequestsPage = ({ isInternal }) => {
  return (
    <Provider store={registry.getStore()}>
      <ErroReducerCatcher>
        <PageSection variant="light">
          <Title headingLevel="h1" className="pf-u-pb-sm">
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
AccessRequestsPage.propTypes = {
  isInternal: PropTypes.bool,
};

export default AccessRequestsPage;
