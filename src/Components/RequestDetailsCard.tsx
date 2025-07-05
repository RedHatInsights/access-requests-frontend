import React from 'react';
import { RequestDetailsCardView } from './RequestDetailsCardView';

interface RequestDetailsCardProps {
  isInternal: boolean;
  request: any;
  requestId: string;
  displayProps: string[];
}

/**
 * Connected component wrapper for RequestDetailsCardView
 */
export function RequestDetailsCard({
  isInternal,
  request,
  requestId,
  displayProps,
}: RequestDetailsCardProps): React.ReactElement {
  return (
    <RequestDetailsCardView
      isInternal={isInternal}
      status={request?.status || 'pending'}
      requestId={requestId}
      displayProps={displayProps}
      requestData={request || {}}
      isLoading={!request}
    />
  );
}
