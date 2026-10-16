import { AccessRequestStatus, getLabelProps } from '../Helpers/getLabelProps';
import React from 'react';
import {
  capitalize,
  Card,
  CardBody,
  CardTitle,
  Label,
  Spinner,
  Title,
} from '@patternfly/react-core';
import { FormattedMessage, defineMessages } from 'react-intl';
import { StatusLabel } from '../Helpers/getActions';

const messages = defineMessages({
  title: {
    id: 'accessRequests.details.card.title',
    defaultMessage: 'Request details',
  },
  status: {
    id: 'accessRequests.details.card.status',
    defaultMessage: 'Request status',
  },
  decision: {
    id: 'accessRequests.details.card.decision',
    defaultMessage: 'Request decision',
  },
});

interface RequestDetailsCardViewProps {
  /** Whether this is the internal (Red Hat employee) view */
  isInternal: boolean;
  /** The access request status */
  status: AccessRequestStatus;
  /** The request ID (for external StatusLabel) */
  requestId?: string;
  /** The display properties to show */
  displayProps: string[];
  /** The request data object */
  requestData: Record<string, any>;
  /** Whether the component is in loading state */
  isLoading?: boolean;
}

/**
 * Pure presentational component for displaying request details in a card format.
 * Shows different views for internal vs external users.
 */

function formatPropLabel(prop: string): string {
  return capitalize(prop.replace(/_/g, ' ').replace('id', 'ID'));
}

export function RequestDetailsCardView({
  isInternal,
  status,
  requestId,
  displayProps,
  requestData,
  isLoading = false,
}: RequestDetailsCardViewProps): React.ReactElement {
  return (
    <Card ouiaId="request-details" style={{ height: '100%' }}>
      <CardTitle>
        <Title headingLevel="h2" size="xl">
          <FormattedMessage {...messages.title} />
        </Title>
      </CardTitle>
      <CardBody>
        {isLoading ? (
          <Spinner size="xl" />
        ) : (
          <React.Fragment>
            <div className="pf-v6-u-pb-md">
              {isInternal ? (
                <div>
                  <label>
                    <b>
                      <FormattedMessage {...messages.status} />
                    </b>
                  </label>
                  <br />
                  <Label className="pf-v6-u-mt-sm" {...getLabelProps(status)}>
                    {capitalize(status)}
                  </Label>
                </div>
              ) : (
                <React.Fragment>
                  <label>
                    <b>
                      <FormattedMessage {...messages.decision} />
                    </b>
                  </label>
                  <br />
                  <StatusLabel requestId={requestId!} status={status} />
                </React.Fragment>
              )}
            </div>
            {displayProps.map((prop, key) => (
              <div className="pf-v6-u-pb-md" key={key}>
                <label>
                  <b>{formatPropLabel(prop)}</b>
                </label>
                <br />
                <div>{requestData[prop]}</div>
              </div>
            ))}
          </React.Fragment>
        )}
      </CardBody>
    </Card>
  );
}
