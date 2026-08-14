import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import NotificationsProvider from '@redhat-cloud-services/frontend-components-notifications/NotificationsProvider';
import registry, { RegistryContext } from './store';
import App from './App';

const AppEntry = () => {
  const chrome = useChrome();

  useEffect(() => {
    chrome.updateDocumentTitle('Access Requests');
  }, []);

  return (
    <RegistryContext.Provider
      value={{
        getRegistry: () => registry,
      }}
    >
      <Provider store={registry.getStore()}>
        <NotificationsProvider>
          <App />
        </NotificationsProvider>
      </Provider>
    </RegistryContext.Provider>
  );
};

export default AppEntry;
