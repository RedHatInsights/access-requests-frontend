import React from 'react';
import { Modal, Button, Spinner } from '@patternfly/react-core';
import { useDispatch } from 'react-redux';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/redux';
import PropTypes from 'prop-types';
import apiInstance from '../Helpers/apiInstance';

const CancelRequestModal = ({ requestId, onClose }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const dispatch = useDispatch();
  const onCancel = () => {
    setIsLoading(true);
    // https://ci.cloud.redhat.com/docs/api-docs/rbac#operations-CrossAccountRequest-patchCrossAccountRequest
    apiInstance
      .patch(
        `${API_BASE}/cross-account-requests/${requestId}/`,
        { status: 'cancelled' },
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
            title: 'Request cancelled successfully',
          })
        );
        setIsLoading(false);
        onClose(true);
      })
      .catch((err) => {
        dispatch(
          addNotification({
            variant: 'danger',
            title: 'There was an error cancelling your request',
            description: err.message,
          })
        );
        setIsLoading(false);
        onClose(true);
      });
  };
  return (
    <Modal
      title="Cancel request?"
      isOpen
      variant="small"
      onClose={() => onClose(false)}
      actions={[
        <Button key="confirm" variant="danger" onClick={onCancel}>
          Yes, cancel
        </Button>,
        <Button key="cancel" variant="link" onClick={() => onClose(false)}>
          No, keep
        </Button>,
      ]}
    >
      Request <b>{requestId}</b> will be withdrawn.
      {isLoading && <Spinner size="lg" />}
    </Modal>
  );
};

CancelRequestModal.propTypes = {
  requestId: PropTypes.string,
  onClose: PropTypes.func,
};

export default CancelRequestModal;
