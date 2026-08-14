import React, { Fragment } from 'react';
import { Bullseye, Spinner } from '@patternfly/react-core';
import ErroReducerCatcher from './Components/ErrorReducerCatcher';
import useUserData from './Hooks/useUserData';
import Routing from './Routing';

import './index.css';

const App: React.FC = () => {
  const userData = useUserData();

  if (!userData.ready) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  return (
    <Fragment>
      <ErroReducerCatcher>
        <Routing userData={userData} />
      </ErroReducerCatcher>
    </Fragment>
  );
};

export default App;
