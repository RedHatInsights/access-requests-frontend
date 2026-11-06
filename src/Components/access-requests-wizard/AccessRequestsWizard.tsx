import React, { useRef } from 'react';
import {
  Bullseye,
  Button,
  capitalize,
  EmptyState,
  EmptyStateBody,
  Spinner,
  Title,
  Wizard,
  WizardStep,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalVariant,
} from '@patternfly/react-core';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import { defineMessages, useIntl } from 'react-intl';
import SelectRoles from './SelectRoles';
import ReviewDetails from './ReviewDetails';
import AccessDuration from './AccessDuration';
import SetName from './SetName';
import schemaBuilder from './schema';
import { useAccessRequestWizard } from './hooks/useAccessRequestWizard';

const messages = defineMessages({
  cancelTitle: {
    id: 'accessRequests.wizard.cancel.title',
    defaultMessage: 'Exit request creation?',
  },
  cancelBody: {
    id: 'accessRequests.wizard.cancel.body',
    defaultMessage: 'All inputs will be discarded.',
  },
  exit: {
    id: 'accessRequests.wizard.cancel.exit',
    defaultMessage: 'Exit',
  },
  stay: {
    id: 'accessRequests.wizard.cancel.stay',
    defaultMessage: 'Stay',
  },
  statusStep: {
    id: 'accessRequests.wizard.statusStep',
    defaultMessage: 'Status',
  },
  submitting: {
    id: 'accessRequests.wizard.submitting',
    defaultMessage: 'Submitting access request',
  },
  close: {
    id: 'accessRequests.wizard.close',
    defaultMessage: 'Close',
  },
  errorTitle: {
    id: 'accessRequests.wizard.errorTitle',
    defaultMessage: 'An error occurred',
  },
  returnToStep1: {
    id: 'accessRequests.wizard.returnToStep1',
    defaultMessage: 'Return to Step 1',
  },
  validateOrgId: {
    id: 'accessRequests.wizard.validation.orgId',
    defaultMessage: 'Please enter a valid organization ID',
  },
  requestTitle: {
    id: 'accessRequests.wizard.requestTitle',
    defaultMessage: '{variant} request',
  },
});

const FormTemplate = (props: Record<string, unknown>) => (
  <Pf4FormTemplate {...props} showFormControls={false} />
);

export const mapperExtension = {
  'set-name': SetName,
  'access-duration': AccessDuration,
  'select-roles': SelectRoles,
  'review-details': ReviewDetails,
};

interface AccessRequestsWizardProps {
  /**
   * The ID of the request to edit.
   * - Required when `variant` is 'edit' (loads existing request data)
   * - Optional when `variant` is 'create' (ignored for new requests)
   */
  requestId?: string;

  /**
   * Determines the wizard behavior:
   * - `'create'`: Creates a new access request (empty form)
   * - `'edit'`: Edits an existing request (pre-fills form with current data)
   */
  variant: 'create' | 'edit';

  /**
   * Callback function called when the wizard is closed.
   * @param shouldRefresh - Whether the parent should refresh data
   *   - `true`: Request was successfully created/edited (refresh needed)
   *   - `false`: User cancelled or closed without changes (no refresh needed)
   */
  onClose: (shouldRefresh: boolean) => void;
}

const AccessRequestsWizard: React.FC<AccessRequestsWizardProps> = ({
  requestId,
  variant,
  onClose,
}) => {
  const isEdit = variant === 'edit';
  const schema = useRef(schemaBuilder(isEdit, variant));
  const intl = useIntl();

  const {
    cancelWarningVisible,
    setCancelWarningVisible,
    error,
    initialValues,
    isLoading,
    isSubmitting,
    user,
    onSubmit,
    onCancel,
    onCloseCancelWarning,
    clearError,
  } = useAccessRequestWizard({
    requestId,
    variant,
    onClose,
  });

  // Validator mapper for form validation
  const validatorMapper = {
    'validate-org-id': () => (value: string) =>
      value && !error ? undefined : intl.formatMessage(messages.validateOrgId),
    'validate-duration': () => (value: string[]) => value?.length > 0,
  };

  // Cancel warning modal
  if (cancelWarningVisible) {
    return (
      <Modal variant="small" isOpen onClose={onCloseCancelWarning}>
        <ModalHeader title={intl.formatMessage(messages.cancelTitle)} />
        <ModalBody>{intl.formatMessage(messages.cancelBody)}</ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={() => onClose(false)}>
            {intl.formatMessage(messages.exit)}
          </Button>
          <Button variant="link" onClick={() => setCancelWarningVisible(false)}>
            {intl.formatMessage(messages.stay)}
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  // Loading, error, or submitting states
  if (error || isLoading || isSubmitting) {
    return (
      <Modal
        isOpen
        variant={ModalVariant.large}
        className="accessRequests"
        aria-describedby="wiz-modal-description"
        aria-labelledby="wiz-modal-title"
      >
        <Wizard
          className="accessRequests"
          title={intl.formatMessage(messages.requestTitle, {
            variant: capitalize(variant),
          })}
          onClose={() => onClose(true)}
        >
          <WizardStep
            name={intl.formatMessage(messages.statusStep)}
            id="status-step"
          >
            {isLoading ? (
              <Bullseye>
                <Spinner />
              </Bullseye>
            ) : (
              <EmptyState>
                {isSubmitting ? (
                  <>
                    <Spinner size="lg" />
                    <Title headingLevel="h2" size="lg">
                      {intl.formatMessage(messages.submitting)}
                    </Title>
                    <Button variant="link" onClick={() => onClose(true)}>
                      {intl.formatMessage(messages.close)}
                    </Button>
                  </>
                ) : (
                  <>
                    <EmptyState
                      icon={ExclamationCircleIcon}
                      titleText={
                        error?.title || intl.formatMessage(messages.errorTitle)
                      }
                    >
                      <EmptyStateBody>{error?.description}</EmptyStateBody>
                      <Button variant="primary" onClick={clearError}>
                        {intl.formatMessage(messages.returnToStep1)}
                      </Button>
                    </EmptyState>
                  </>
                )}
              </EmptyState>
            )}
          </WizardStep>
        </Wizard>
      </Modal>
    );
  }

  const { first_name, last_name } = user || {};

  // Main form renderer
  return (
    <FormRenderer
      schema={schema.current}
      subscription={{ values: true }}
      FormTemplate={FormTemplate}
      componentMapper={{ ...componentMapper, ...mapperExtension }}
      validatorMapper={validatorMapper}
      onSubmit={onSubmit}
      initialValues={{
        ...initialValues,
        'first-name': first_name,
        'last-name': last_name,
        name: first_name && last_name ? `${first_name} ${last_name}` : '',
      }}
      onCancel={onCancel}
    />
  );
};

export default AccessRequestsWizard;
