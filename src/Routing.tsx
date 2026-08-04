import React, { Suspense, lazy, useMemo, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import {
  Bullseye,
  Spinner,
  Switch as ToggleSwitch,
} from '@patternfly/react-core';
import { UserData } from './Hooks/useUserData';
import MissingPage from '@patternfly/react-component-groups/dist/dynamic/MissingPage';
import pathnames from './pathnames';

const AccessRequestsPage = lazy(() => import('./Routes/AccessRequestsPage'));
const AccessRequestDetailsPage = lazy(
  () => import('./Routes/AccessRequestDetailsPage')
);

interface RouteType {
  path?: string;
  element: React.ComponentType;
  childRoutes?: RouteType[];
  elementProps?: Record<string, unknown>;
}

const renderRoutes = (routes: RouteType[] = []) =>
  routes.map(({ path, element: Element, childRoutes, elementProps }) => (
    <Route key={path} path={path} element={<Element {...elementProps} />}>
      {renderRoutes(childRoutes)}
    </Route>
  ));

const isDev = process.env.NODE_ENV !== 'production';

export const Routing = ({ userData }: { userData: UserData }) => {
  const [isInternal, setIsInternal] = useState(userData.isInternal);

  const routes = [
    {
      path: pathnames.accessRequests.route,
      element: AccessRequestsPage,
      elementProps: { isInternal },
    },
    {
      path: pathnames.accessRequestsDetail.route,
      element: AccessRequestDetailsPage,
      elementProps: { isInternal },
    },
  ];

  const renderedRoutes = useMemo(() => renderRoutes(routes), [routes]);

  return (
    <Suspense
      fallback={
        <Bullseye>
          <Spinner size="xl" />
        </Bullseye>
      }
    >
      {isDev && (
        <ToggleSwitch
          className="pf-v6-u-p-sm"
          id="toggle-view"
          label={isInternal ? 'Internal view' : 'External view'}
          checked={isInternal}
          onChange={() => setIsInternal((prev) => !prev)}
        />
      )}
      <Routes>
        {renderedRoutes}
        {/* Catch all unmatched routes */}
        <Route path="*" element={<MissingPage />} />
      </Routes>
    </Suspense>
  );
};

export default Routing;
