import React from 'react';
import CheckCircleIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import ErrorCircleOIcon from '@patternfly/react-icons/dist/js/icons/error-circle-o-icon';
import PendingIcon from '@patternfly/react-icons/dist/js/icons/in-progress-icon';
import ClockIcon from '@patternfly/react-icons/dist/js/icons/history-icon';

// Define the possible status values
export type AccessRequestStatus =
  | 'pending'
  | 'approved'
  | 'denied'
  | 'cancelled'
  | 'expired';

// Define PatternFly label colors - matching actual PatternFly types
export type LabelColor =
  | 'blue'
  | 'cyan'
  | 'green'
  | 'orange'
  | 'purple'
  | 'red'
  | 'grey'
  | 'gold';

export interface LabelProps {
  color?: LabelColor;
  icon?: React.ReactElement;
}

/**
 * Pure utility function that returns PatternFly Label props based on access request status
 * @param status - The access request status
 * @returns Object containing color and icon for PatternFly Label component
 */
export function getLabelProps(status: AccessRequestStatus): LabelProps {
  let color: LabelColor | undefined = undefined;
  let icon: React.ReactElement | undefined = undefined;

  switch (status) {
    case 'pending':
      color = 'blue';
      icon = React.createElement(PendingIcon);
      break;
    case 'approved':
      color = 'green';
      icon = React.createElement(CheckCircleIcon);
      break;
    case 'denied':
      color = 'red';
      icon = React.createElement(ExclamationCircleIcon);
      break;
    case 'cancelled':
      color = 'orange';
      icon = React.createElement(ErrorCircleOIcon);
      break;
    case 'expired':
      color = 'grey';
      icon = React.createElement(ClockIcon);
      break;
    default:
      // Return undefined values for unknown status
      break;
  }

  return { color, icon };
}
