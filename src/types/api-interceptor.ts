// Utility types for API responses with responseDataInterceptor
// The responseDataInterceptor from @redhat-cloud-services/frontend-components-utilities
// extracts response.data and returns it directly, so promises resolve with just the data

export interface ApiError {
  detail: string;
}

// Base interface for API responses that may contain errors
export interface BaseApiResponse {
  errors?: ApiError[];
}

// Utility type to properly type intercepted API calls
export type InterceptedApiResponse<T = BaseApiResponse> = T;
