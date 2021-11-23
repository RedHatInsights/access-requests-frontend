import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { Routes } from './Routes';
import NotificationPortal from '@redhat-cloud-services/frontend-components-notifications/NotificationPortal';
import ErroReducerCatcher from './Components/ErrorReducerCatcher';

import './index.css';

const App = ({ basename }) => {
  const history = useHistory();
  useEffect(() => {
    insights.chrome.init();

    insights.chrome.identifyApp('access-requests');
    const unregister = insights.chrome.on('APP_NAVIGATION', (event) => {
      if (event?.domEvent?.href) {
        history.push(event?.domEvent?.href.replace(basename), '');
      }
    });
    return () => {
      unregister();
    };
  }, []);

  return (
    <Fragment>
      <NotificationPortal />
      <ErroReducerCatcher>
        <Routes />
      </ErroReducerCatcher>
    </Fragment>
  );
};

App.propTypes = {
  basename: PropTypes.string.isRequired,
};

export default App;
