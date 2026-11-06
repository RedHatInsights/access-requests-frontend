import React from 'react';
import { Button, Spinner } from '@patternfly/react-core';
import { Modal } from '@patternfly/react-core/deprecated';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { useCancelRequest } from './access-requests-wizard/hooks/useCancelRequest';

const messages = defineMessages({
  title: {
    id: 'accessRequests.cancelRequest.title',
    defaultMessage: 'Cancel request?',
  },
  confirm: {
    id: 'accessRequests.cancelRequest.confirm',
    defaultMessage: 'Yes, cancel request',
  },
  keep: {
    id: 'accessRequests.cancelRequest.keep',
    defaultMessage: 'No, keep request',
  },
  body: {
    id: 'accessRequests.cancelRequest.body',
    defaultMessage:
      'Are you sure you want to cancel this request? This action cannot be undone.',
  },
});

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
  const intl = useIntl();
  return (
    <Modal
      variant="small"
      title={intl.formatMessage(messages.title)}
      isOpen={true}
      onClose={() => onClose(false)}
      actions={[
        <Button
          key="cancel-request"
          variant="danger"
          onClick={onCancel}
          isDisabled={isLoading}
        >
          {isLoading ? (
            <Spinner size="sm" />
          ) : (
            intl.formatMessage(messages.confirm)
          )}
        </Button>,
        <Button key="cancel" variant="link" onClick={() => onClose(false)}>
          {intl.formatMessage(messages.keep)}
        </Button>,
      ]}
    >
      <FormattedMessage {...messages.body} />
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
