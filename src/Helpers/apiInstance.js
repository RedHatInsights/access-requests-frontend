import axios from 'axios';
import {
  // authInterceptor,
  responseDataInterceptor,
  interceptor401,
  interceptor500,
  errorInterceptor,
} from '@redhat-cloud-services/frontend-components-utilities/interceptors';
import registry from '../store';
import { API_ERROR } from '../Redux/action-types';

const interceptor403 = (error) => {
  const store = registry.getStore();
  if (error.response && error.response.status === 403) {
    store.dispatch({ type: API_ERROR, payload: 403 });
  }

  throw error;
};

const apiInstance = axios.create();
// apiInstance.interceptors.request.use(authInterceptor);
apiInstance.interceptors.response.use(responseDataInterceptor);

apiInstance.interceptors.response.use(null, interceptor401);
apiInstance.interceptors.response.use(null, interceptor403);
apiInstance.interceptors.response.use(null, interceptor500);
apiInstance.interceptors.response.use(null, errorInterceptor);

export default apiInstance;
