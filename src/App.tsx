import React from 'react';
import { Bullseye, Spinner } from '@patternfly/react-core';
import ErroReducerCatcher from './Components/ErrorReducerCatcher';
import useUserData from './Hooks/useUserData';
import Routing from './Routing';
import { IntlMessagesProvider, useChromeLocale } from './shared/i18n';

import './index.css';

const App: React.FC = () => {
  const userData = useUserData();
  const locale = useChromeLocale();

  if (!userData.ready) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  return (
    <IntlMessagesProvider locale={locale}>
      <ErroReducerCatcher>
        <Routing userData={userData} />
      </ErroReducerCatcher>
    </IntlMessagesProvider>
  );
};

export default App;
