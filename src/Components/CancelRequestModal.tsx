import React from 'react';
import { Button, Spinner } from '@patternfly/react-core';
import { Modal } from '@patternfly/react-core/deprecated';
import { useCancelRequest } from './access-requests-wizard/hooks/useCancelRequest';

interface CancelRequestModalViewProps {
  isLoading: boolean;
  onCancel: () => void;
  onClose: (isChanged: boolean) => void;
}

export const CancelRequestModalView: React.FC<CancelRequestModalViewProps> = ({
  isLoading,
  onCancel,
  onClose,
}) => {
  return (
    <Modal
      variant="small"
      title="Cancel request?"
      isOpen={true}
      onClose={() => onClose(false)}
      actions={[
        <Button
          key="cancel-request"
          variant="danger"
          onClick={onCancel}
          isDisabled={isLoading}
        >
          {isLoading ? <Spinner size="sm" /> : 'Yes, cancel request'}
        </Button>,
        <Button key="cancel" variant="link" onClick={() => onClose(false)}>
          No, keep request
        </Button>,
      ]}
    >
      Are you sure you want to cancel this request? This action cannot be
      undone.
    </Modal>
  );
};

interface CancelRequestModalProps {
  requestId: string;
  onClose: (isChanged: boolean) => void;
}

const CancelRequestModal: React.FC<CancelRequestModalProps> = ({
  requestId,
  onClose,
}) => {
  const { isLoading, onCancel } = useCancelRequest({ requestId, onClose });

  return (
    <CancelRequestModalView
      isLoading={isLoading}
      onCancel={onCancel}
      onClose={onClose}
    />
  );
};

export default CancelRequestModal;
