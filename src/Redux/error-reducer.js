import { API_ERROR } from './action-types';

const setErrorState = (_, { payload }) => ({
  errorCode: payload,
});

const errorReducer = {
  [API_ERROR]: setErrorState,
};

export default errorReducer;
