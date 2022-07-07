import { Redirect, Route, Switch } from 'react-router-dom';
import React, { Suspense, lazy, useContext, useState, useEffect } from 'react';
import {
  Bullseye,
  Spinner,
  Switch as ToggleSwitch,
} from '@patternfly/react-core';

const AccessRequestsPage = lazy(() => import('./Routes/AccessRequestsPage'));
const AccessRequestDetailsPage = lazy(() =>
  import('./Routes/AccessRequestDetailsPage')
);
import { RegistryContext } from './store';
const isDev = process.env.NODE_ENV !== 'production';

export const Routes = () => {
  const { getRegistry } = useContext(RegistryContext);
  const [isInternal, setIsInternal] = useState(true);

  useEffect(() => {
    insights.chrome.init();
    Promise.resolve(insights.chrome.auth.getUser()).then((user) => {
      setIsInternal(user?.identity?.user?.is_internal);
    });
  });

  const AccessRequestDetailsPageWrapper = () => (
    <AccessRequestDetailsPage
      isInternal={isInternal}
      getRegistry={getRegistry}
    />
  );
  const AccessRequestsPageWrapper = () => (
    <AccessRequestsPage isInternal={isInternal} getRegistry={getRegistry} />
  );

  return (
    <Suspense
      fallback={
        <Bullseye>
          <Spinner />
        </Bullseye>
      }
    >
      {isDev && (
        <ToggleSwitch
          id="toggle-view"
          label="Internal view"
          labelOff="External view"
          isChecked={isInternal}
          onChange={() => setIsInternal(!isInternal)}
        />
      )}
      <Switch>
        <Route path="/" exact component={AccessRequestsPageWrapper} />
        <Route
          path="/:requestId"
          exact
          component={AccessRequestDetailsPageWrapper}
        />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    </Suspense>
  );
};
