import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/redux';
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
  Wizard,
} from '@patternfly/react-core';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import SelectRoles from './SelectRoles';
import ReviewDetails from './ReviewDetails';
import AccessDuration from './AccessDuration';
import SetName from './SetName';
import apiInstance from '../../Helpers/apiInstance';
import schemaBuilder, {
  ACCESS_FROM,
  ACCESS_TO,
  ACCOUNT_NUMBER,
  ORG_ID,
  SELECTED_ROLES,
} from './schema';

const invalidAccountTitle = 'Invalid Account number';

const FormTemplate = (props) => (
  <Pf4FormTemplate {...props} showFormControls={false} />
);

export const mapperExtension = {
  'set-name': SetName,
  'access-duration': AccessDuration,
  'select-roles': SelectRoles,
  'review-details': ReviewDetails,
};

const AccessRequestsWizard = ({ requestId, variant, onClose }) => {
  const dispatch = useDispatch();
  const isEdit = variant === 'edit';
  const schema = useRef(schemaBuilder(isEdit, variant));
  const [cancelWarningVisible, setCancelWarningVisible] = useState(false);
  const [error, setError] = React.useState();
  const [initialValues, setInitialValues] = React.useState();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [user, setUser] = React.useState();

  // We need to be logged in (and see the username) which is an async request.
  // If we're editing we also need to fetch the roles
  React.useEffect(() => {
    setIsLoading(true);
    const userPromise = insights.chrome.auth.getUser();
    const detailsPromise = isEdit
      ? apiInstance.get(
          `${API_BASE}/cross-account-requests/${requestId}/?query_by=user_id`,
          {
            headers: { Accept: 'application/json' },
          }
        )
      : new Promise((res) => res(true));
    Promise.all([userPromise, detailsPromise])
      .then(([user, details]) => {
        if (user && user.identity && user.identity.user) {
          setUser(user.identity.user);
        } else {
          throw Error("Couldn't get current user. Make sure you're logged in");
        }
        if (isEdit) {
          if (details.errors) {
            throw Error(details.errors.map((e) => e.detail).join('\n'));
          }
          if (details && details.target_account) {
            setInitialValues({
              [ACCOUNT_NUMBER]: details.target_account,
              [ORG_ID]: details.target_org,
              [ACCESS_FROM]: details.start_date,
              [ACCESS_TO]: details.end_date,
              [SELECTED_ROLES]: details.roles.map((role) => role.display_name),
            });
          } else {
            throw Error(`Could not fetch details for request ${requestId}`);
          }
        }
        setIsLoading(false);
      })
      .catch((err) => {
        dispatch(
          addNotification({
            variant: 'danger',
            title: 'Could not load access request',
            description: err.message,
          })
        );
      });
  }, []);

  const onSubmit = (values) => {
    setIsSubmitting(true);
    // https://cloud.redhat.com/docs/api-docs/rbac#operations-CrossAccountRequest-createCrossAccountRequests
    const body = {
      target_account: values[ACCOUNT_NUMBER],
      start_date: values[ACCESS_FROM],
      end_date: values[ACCESS_TO],
      target_org: values[ORG_ID],
      roles: values[SELECTED_ROLES],
    };
    setInitialValues(values);
    apiInstance[isEdit ? 'put' : 'post'](
      `${API_BASE}/cross-account-requests/${isEdit ? `/${requestId}/` : ''}`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    )
      .then((res) => {
        if (res.errors && res.errors.length > 0) {
          throw Error(res.errors[0].detail);
        }
        dispatch(
          addNotification({
            variant: 'success',
            title: `${isEdit ? 'Edited' : 'Created'} access request`,
            description: res.request_id,
          })
        );
        onClose(true);
      })
      .catch(({ errors = [] }) => {
        const isInvalidAccount = /Account .* does not exist/.test(
          errors[0]?.message || errors[0]?.detail
        );
        setError({
          title: isInvalidAccount
            ? invalidAccountTitle
            : `Could not ${variant} access request`,
          description: isInvalidAccount
            ? 'Please return to Step 1: Request details and input a new account number for your request.'
            : errors[0]?.message || errors[0]?.detail,
        });
        setIsSubmitting(false);
      });
  };

  const validatorMapper = {
    'validate-account': () => (value) =>
      value && !error ? undefined : 'Please enter a valid account number',
    'validate-org-id': () => (value) =>
      value && !error ? undefined : 'Please enter a valid organization ID',
    'validate-duration': () => (value) => value?.length > 0,
  };

  if (cancelWarningVisible) {
    return (
      <Modal
        title="Exit request creation?"
        variant="small"
        titleIconVariant="warning"
        isOpen
        onClose={() => {
          setCancelWarningVisible(false);
          onClose(false);
        }}
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
  } else if (error || isLoading || isSubmitting) {
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
                        {error.title || 'An error occured'}
                      </Title>
                      <EmptyStateBody>{error.description}</EmptyStateBody>
                      {error.title !== invalidAccountTitle && (
                        <Button variant="primary" onClick={() => setError()}>
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
  } else {
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
        onCancel={() => setCancelWarningVisible(true)}
      />
    );
  }
};

AccessRequestsWizard.propTypes = {
  requestId: PropTypes.string,
  variant: PropTypes.any,
  onClose: PropTypes.func,
};

export default AccessRequestsWizard;
