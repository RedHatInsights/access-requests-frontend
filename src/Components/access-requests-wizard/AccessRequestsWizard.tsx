import React, { useRef } from 'react';
import {
  Bullseye,
  Button,
  capitalize,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Modal,
  ModalVariant,
  Spinner,
  Title,
} from '@patternfly/react-core';
import { Wizard } from '@patternfly/react-core/deprecated';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import SelectRoles from './SelectRoles';
import ReviewDetails from './ReviewDetails';
import AccessDuration from './AccessDuration';
import SetName from './SetName';
import schemaBuilder from './schema';
import { useAccessRequestWizard } from './hooks/useAccessRequestWizard';

const invalidAccountTitle = 'Invalid Account number';

const FormTemplate: React.FC<any> = (props) => (
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
    'validate-account': () => (value: any) =>
      value && !error ? undefined : 'Please enter a valid account number',
    'validate-org-id': () => (value: any) =>
      value && !error ? undefined : 'Please enter a valid organization ID',
    'validate-duration': () => (value: any) => value?.length > 0,
  };

  // Cancel warning modal
  if (cancelWarningVisible) {
    return (
      <Modal
        title="Exit request creation?"
        variant="small"
        titleIconVariant="warning"
        isOpen
        onClose={onCloseCancelWarning}
        actions={[
          <Button
            key="confirm"
            variant="primary"
            onClick={() => onClose(false)}
          >
            Exit
          </Button>,
          <Button
            key="cancel"
            variant="link"
            onClick={() => setCancelWarningVisible(false)}
          >
            Stay
          </Button>,
        ]}
      >
        All inputs will be discarded.
      </Modal>
    );
  }

  // Loading, error, or submitting states
  if (error || isLoading || isSubmitting) {
    return (
      <Modal
        isOpen
        variant={ModalVariant.large}
        showClose={false}
        className="accessRequests"
        hasNoBodyWrapper
        aria-describedby="wiz-modal-description"
        aria-labelledby="wiz-modal-title"
      >
        <Wizard
          className="accessRequests"
          title={`${capitalize(variant)} request`}
          steps={[
            {
              name: 'status',
              component: isLoading ? (
                <Bullseye>
                  <Spinner />
                </Bullseye>
              ) : (
                <EmptyState>
                  {isSubmitting ? (
                    <>
                      <EmptyStateIcon icon={() => <Spinner size="lg" />} />
                      <Title headingLevel="h2" size="lg">
                        Submitting access request
                      </Title>
                      <Button variant="link" onClick={() => onClose(true)}>
                        Close
                      </Button>
                    </>
                  ) : (
                    <>
                      <EmptyStateIcon
                        icon={ExclamationCircleIcon}
                        color="#C9190B"
                      />
                      <Title headingLevel="h2" size="lg">
                        {error?.title || 'An error occurred'}
                      </Title>
                      <EmptyStateBody>{error?.description}</EmptyStateBody>
                      {error?.title !== invalidAccountTitle && (
                        <Button variant="primary" onClick={clearError}>
                          Return to Step 1
                        </Button>
                      )}
                    </>
                  )}
                </EmptyState>
              ),
              isFinishedStep: true,
            },
          ]}
          onClose={() => onClose(true)}
        />
      </Modal>
    );
  }

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
        'first-name': user?.first_name,
        'last-name': user?.last_name,
      }}
      onCancel={onCancel}
    />
  );
};

export default AccessRequestsWizard;
