import React from 'react';
import { Button, Label } from '@patternfly/react-core';
import { useDispatch } from 'react-redux';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/redux';
import { getLabelProps } from './getLabelProps';
import EditAltIcon from '@patternfly/react-icons/dist/js/icons/edit-alt-icon';
import { capitalize } from '@patternfly/react-core/dist/esm/helpers/util';
import PropTypes from 'prop-types';
import apiInstance from './apiInstance';

export function getInternalActions(status, requestId, setOpenModal) {
  const items = [];
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

// https://marvelapp.com/prototype/257je526/screen/74764732
export function StatusLabel({ requestId, status: statusProp, hideActions }) {
  const [status, setStatus] = React.useState(statusProp);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const dispatch = useDispatch();

  function onClick(newStatus) {
    setIsLoading(true);
    apiInstance
      .patch(
        `${API_BASE}/cross-account-requests/${requestId}/`,
        { status: newStatus },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      )
      .then((res) => {
        if (res.errors && res.errors.length > 0) {
          throw Error(res.errors.map((e) => e.detail).join('\n'));
        }
        dispatch(
          addNotification({
            variant: 'success',
            title: `Request ${newStatus} successfully`,
          })
        );
        setStatus(newStatus);
        setIsEditing(false);
        setIsLoading(false);
      })
      .catch((err) => {
        dispatch(
          addNotification({
            variant: 'danger',
            title: `There was an error ${
              newStatus === 'approved' ? 'approving' : 'denying'
            } your request`,
            description: err.message,
          })
        );
        setIsLoading(false);
      });
  }

  const label = <Label {...getLabelProps(status)}>{capitalize(status)}</Label>;

  // For internal view
  if (hideActions) {
    return label;
  }

  return (
    <React.Fragment>
      {isEditing || status === 'pending' ? (
        <React.Fragment>
          <Button
            className="pf-u-mr-md"
            isDisabled={isLoading || status === 'approved'}
            variant="primary"
            onClick={() => onClick('approved')}
          >
            Approve
          </Button>
          <Button
            className="pf-u-mr-md"
            isDisabled={isLoading || status === 'denied'}
            variant="danger"
            onClick={() => onClick('denied')}
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

StatusLabel.propTypes = {
  requestId: PropTypes.string,
  status: PropTypes.any,
  hideActions: PropTypes.any,
};
