import { createContext } from 'react';
import ReducerRegistry, {
  applyReducerHash,
} from '@redhat-cloud-services/frontend-components-utilities/ReducerRegistry';
import errorReducer from './Redux/error-reducer';

export const RegistryContext = createContext({
  getRegistry: () => {},
});

const registry = new ReducerRegistry({}, []);

registry.register({
  errorReducer: applyReducerHash(errorReducer),
});

export default registry;
