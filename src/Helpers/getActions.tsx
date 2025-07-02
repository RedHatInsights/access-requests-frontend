import React from 'react';
import { Button, Label } from '@patternfly/react-core';
import { capitalize } from '@patternfly/react-core/dist/esm/helpers/util';
import EditAltIcon from '@patternfly/react-icons/dist/js/icons/edit-alt-icon';
import { getLabelProps, AccessRequestStatus } from './getLabelProps';
import { useStatusUpdate } from './hooks/useStatusUpdate';

interface InternalAction {
  title: string;
  onClick: () => void;
}

interface InternalActionsResult {
  items: InternalAction[];
  disable: boolean;
}

interface SetOpenModalParams {
  type: 'edit' | 'cancel';
  requestId: string;
}

/**
 * Pure utility function that returns action items based on request status
 * @param status - The current status of the request
 * @param requestId - The ID of the request
 * @param setOpenModal - Function to open modal dialogs
 * @returns Object containing action items and disable state
 */
export function getInternalActions(
  status: AccessRequestStatus,
  requestId: string,
  setOpenModal: (params: SetOpenModalParams) => void
): InternalActionsResult {
  const items: InternalAction[] = [];

  if (status === 'pending') {
    items.push({
      title: 'Edit',
      onClick: () => setOpenModal({ type: 'edit', requestId }),
    });
    items.push({
      title: 'Cancel',
      onClick: () => setOpenModal({ type: 'cancel', requestId }),
    });
  }

  return { items, disable: items.length === 0 };
}

interface StatusLabelProps {
  /** The unique identifier of the access request */
  requestId: string;

  /** The current status of the access request */
  status: AccessRequestStatus;

  /**
   * Controls whether action buttons are displayed:
   * - `false` (default): Shows approve/deny buttons for pending requests, edit button for decided requests
   * - `true`: Shows only the status label (read-only mode, typically for internal views)
   */
  hideActions?: boolean;
}

/**
 * Status label component with optional approval/denial actions
 * Business logic is handled by useStatusUpdate hook
 */
export function StatusLabel({
  requestId,
  status: statusProp,
  hideActions = false,
}: StatusLabelProps): React.ReactElement {
  const { status, isEditing, isLoading, setIsEditing, updateStatus } =
    useStatusUpdate({
      requestId,
      initialStatus: statusProp,
    });

  const label = <Label {...getLabelProps(status)}>{capitalize(status)}</Label>;

  // For internal view - just show the label
  if (hideActions) {
    return label;
  }

  return (
    <React.Fragment>
      {isEditing || status === 'pending' ? (
        <React.Fragment>
          <Button
            className="pf-v5-u-mr-md"
            isDisabled={isLoading || status === 'approved'}
            variant="primary"
            onClick={() => updateStatus('approved')}
          >
            Approve
          </Button>
          <Button
            className="pf-v5-u-mr-md"
            isDisabled={isLoading || status === 'denied'}
            variant="danger"
            onClick={() => updateStatus('denied')}
          >
            Deny
          </Button>
        </React.Fragment>
      ) : (
        label
      )}
      {['approved', 'denied'].includes(status) && (
        <Button
          variant="plain"
          aria-label="Edit status"
          onClick={() => setIsEditing(!isEditing)}
        >
          <EditAltIcon />
        </Button>
      )}
    </React.Fragment>
  );
}
