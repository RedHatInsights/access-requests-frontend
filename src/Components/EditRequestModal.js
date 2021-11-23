import React from 'react';
import {
  Form,
  FormGroup,
  TextInput,
  Split,
  SplitItem,
  Popover,
  DatePicker,
  Title,
  Spinner,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Button,
  Modal,
  Wizard,
  WizardContextConsumer,
} from '@patternfly/react-core';
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import { capitalize } from '@patternfly/react-core/dist/esm/helpers/util';
import { isValidDate } from '@patternfly/react-core/dist/esm/components/CalendarMonth';
import { useDispatch } from 'react-redux';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/redux';
import MUARolesTable from './MUARolesTable';
import PropTypes from 'prop-types';
import apiInstance from '../Helpers/apiInstance';

const nameHelperText =
  'Customers will be able to see this information as part of your request';
const helperTexts = {
  'first name': nameHelperText,
  'last name': nameHelperText,
  'account number':
    'This is the account number that you would like to receive read access to',
  'access duration':
    'This is the time frame you would like to be granted read access to accounts',
};
const invalidAccountTitle = 'Invalid Account number';
const getLabelIcon = (field) => (
  <Popover bodyContent={<p>{helperTexts[field]}</p>}>
    <button
      type="button"
      aria-label={`More info for ${field}`}
      onClick={(e) => e.preventDefault()}
      aria-describedby="form-name"
      className="pf-c-form__group-label-help"
    >
      <HelpIcon noVerticalAlign />
    </button>
  </Popover>
);

const today = new Date();
today.setDate(today.getDate() - 1);
const maxStartDate = new Date();
maxStartDate.setDate(maxStartDate.getDate() + 60);
const dateFormat = (date) =>
  date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
const dateParse = (date) => {
  const split = date.split('/');
  if (split.length !== 3) {
    return new Date();
  }
  let month = split[0].padStart(2, '0');
  let day = split[1].padStart(2, '0');
  let year = split[2].padStart(4, '0');
  return new Date(`${year}-${month}-${day}T00:00:00`);
};
const RequestDetailsForm = ({
  user = {},
  targetAccount,
  setTargetAccount,
  start,
  setStart,
  end,
  setEnd,
  disableAccount,
  isLoading,
  error,
}) => {
  let [startDate, setStartDate] = React.useState();
  const [validatedAccount, setValidatedAccount] = React.useState(
    error ? 'error' : 'default'
  );

  // https://github.com/RedHatInsights/insights-rbac/blob/master/rbac/api/cross_access/model.py#L49
  const startValidator = (date) => {
    if (isValidDate(date)) {
      if (date < today) {
        setEnd('');
        return 'Start date must be today or later';
      }
      if (date > maxStartDate) {
        setEnd('');
        return 'Start date must be within 60 days of today';
      }
    }

    return '';
  };

  const endValidator = (date) => {
    if (isValidDate(startDate)) {
      if (startDate > date) {
        return 'End date must be after from date';
      }
    }

    const maxToDate = new Date(startDate);
    maxToDate.setFullYear(maxToDate.getFullYear() + 1);
    if (date > maxToDate) {
      return 'Access duration may not be longer than one year';
    }

    return '';
  };

  const onStartChange = (str, date) => {
    setStartDate(new Date(date));
    setStart(str);
    if (isValidDate(date) && !startValidator(date)) {
      date.setDate(date.getDate() + 7);
      setEnd(dateFormat(date));
    } else {
      setEnd('');
    }
  };

  const onEndChange = (str, date) => {
    if (endValidator(date)) {
      setEnd('');
    } else {
      setEnd(str);
    }
  };

  return (
    <Form onSubmit={(ev) => ev.preventDefault()} isDisabled={isLoading}>
      <Title headingLevel="h2">Request details</Title>
      <Split hasGutter>
        <SplitItem isFilled>
          <FormGroup label="First name" labelIcon={getLabelIcon('first name')}>
            <TextInput id="first-name" value={user.first_name} isDisabled />
          </FormGroup>
        </SplitItem>
        <SplitItem isFilled>
          <FormGroup label="Last name" labelIcon={getLabelIcon('last name')}>
            <TextInput id="last-name" value={user.last_name} isDisabled />
          </FormGroup>
        </SplitItem>
      </Split>
      <FormGroup
        label="Account number"
        isRequired
        labelIcon={getLabelIcon('account number')}
        helperText="Enter the account number you would like access to"
        helperTextInvalid="Please enter a valid account number"
        validated={validatedAccount}
      >
        <TextInput
          id="account-number"
          value={targetAccount}
          onChange={(val) => {
            setTargetAccount(val);
            setValidatedAccount('default');
          }}
          isRequired
          placeholder="Example, 8675309"
          validated={validatedAccount}
          isDisabled={disableAccount}
        />
      </FormGroup>
      <FormGroup
        label="Access duration"
        isRequired
        labelIcon={getLabelIcon('access duration')}
      >
        <Split>
          <SplitItem>
            <DatePicker
              width="300px"
              aria-label="Start date"
              value={start}
              dateFormat={dateFormat}
              dateParse={dateParse}
              placeholder="mm/dd/yyyy"
              onChange={onStartChange}
              validators={[startValidator]}
            />
          </SplitItem>
          <SplitItem style={{ padding: '6px 12px 0 12px' }}>to</SplitItem>
          <SplitItem>
            <DatePicker
              width="300px"
              aria-label="End date"
              value={end}
              dateFormat={dateFormat}
              dateParse={dateParse}
              placeholder="mm/dd/yyyy"
              onChange={onEndChange}
              validators={[endValidator]}
              rangeStart={start}
            />
          </SplitItem>
        </Split>
      </FormGroup>
    </Form>
  );
};

RequestDetailsForm.propTypes = {
  user: PropTypes.any,
  targetAccount: PropTypes.any,
  setTargetAccount: PropTypes.any,
  start: PropTypes.any,
  setStart: PropTypes.any,
  end: PropTypes.any,
  setEnd: PropTypes.any,
  disableAccount: PropTypes.any,
  isLoading: PropTypes.any,
  error: PropTypes.any,
};

// Can't use CSS with @redhat-cloud-services/frontend-components-config because it's scoped to <main> content
// rather than Modal content...
const spaceUnderStyle = { paddingBottom: '16px' };
const ReviewStep = ({
  targetAccount,
  start,
  end,
  roles,
  isLoading,
  error,
  onClose,
}) => {
  let content = null;
  if (isLoading) {
    content = (
      <EmptyState>
        <EmptyStateIcon icon={() => <Spinner size="lg" />} />
        <Title headingLevel="h2" size="lg">
          Submitting access request
        </Title>
        <Button variant="link" onClick={onClose}>
          Close
        </Button>
      </EmptyState>
    );
  } else if (error) {
    const context = React.useContext(WizardContextConsumer);
    content = (
      <EmptyState>
        <EmptyStateIcon icon={ExclamationCircleIcon} color="#C9190B" />
        <Title headingLevel="h2" size="lg">
          {error.title}
        </Title>
        <EmptyStateBody>{error.description}</EmptyStateBody>
        {error.title === invalidAccountTitle && (
          <Button variant="primary" onClick={() => context.goToStepById(1)}>
            Return to Step 1
          </Button>
        )}
      </EmptyState>
    );
  } else {
    content = (
      <React.Fragment>
        <Title headingLevel="h2" style={spaceUnderStyle}>
          Review details
        </Title>
        <table>
          <tr>
            <td style={spaceUnderStyle}>
              <b>Account number</b>
            </td>
            <td style={spaceUnderStyle}>{targetAccount}</td>
          </tr>
          <tr>
            <td style={{ paddingRight: '32px' }}>
              <b>Access duration</b>
            </td>
            <td></td>
          </tr>
          <tr>
            <td>From</td>
            <td>{start}</td>
          </tr>
          <tr>
            <td style={spaceUnderStyle}>To</td>
            <td style={spaceUnderStyle}>{end}</td>
          </tr>
          <tr>
            <td>
              <b>Roles</b>
            </td>
            <td>{roles[0]}</td>
          </tr>
          {roles.slice(1).map((role) => (
            <tr key={role}>
              <td></td>
              <td>{role}</td>
            </tr>
          ))}
        </table>
      </React.Fragment>
    );
  }

  return <React.Fragment>{content}</React.Fragment>;
};

ReviewStep.propTypes = {
  targetAccount: PropTypes.any,
  start: PropTypes.any,
  end: PropTypes.any,
  roles: PropTypes.any,
  isLoading: PropTypes.any,
  error: PropTypes.any,
  onClose: PropTypes.any,
};

const EditRequestModal = ({ requestId, variant, onClose }) => {
  const isEdit = variant === 'edit';
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState();
  const [user, setUser] = React.useState();
  const [targetAccount, setTargetAccount] = React.useState();
  const [start, setStart] = React.useState();
  const [end, setEnd] = React.useState();
  const [roles, setRoles] = React.useState([]);
  const [warnClose, setWarnClose] = React.useState(false);
  const [step, setStep] = React.useState(1);
  const dispatch = useDispatch();
  const isDirty = Boolean(targetAccount || start || end || roles.length > 0);

  // We need to be logged in (and see the username) which is an async request.
  // If we're editing we also need to fetch the roles
  React.useEffect(() => {
    const userPromise = window.insights.chrome.auth.getUser();
    const detailsPromise = isEdit
      ? apiInstance.get(`${API_BASE}/cross-account-requests/${requestId}/`, {
          headers: { Accept: 'application/json' },
        })
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
            setTargetAccount(details.target_account);
            setStart(details.start_date);
            setEnd(details.end_date);
            setRoles(details.roles.map((role) => role.display_name));
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

  const onSave = () => {
    setIsLoading(true);
    // https://cloud.redhat.com/docs/api-docs/rbac#operations-CrossAccountRequest-createCrossAccountRequests
    const body = {
      target_account: targetAccount,
      start_date: start,
      end_date: end,
      roles,
    };
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
      .catch((err) => {
        const isInvalidAccount = /Account .* does not exist/.test(err.message);
        setError({
          title: isInvalidAccount
            ? invalidAccountTitle
            : `Could not ${variant} access request`,
          description: isInvalidAccount
            ? 'Please return to Step 1: Request details and input a new account number for your request.'
            : err.message,
        });
        setIsLoading(false);
      });
  };

  const step1Complete = [targetAccount, start, end].every(Boolean);
  const step2Complete = roles.length > 0;
  const steps = [
    {
      id: 1,
      name: 'Request details',
      component: (
        <RequestDetailsForm
          user={user}
          targetAccount={targetAccount}
          setTargetAccount={setTargetAccount}
          start={start}
          setStart={setStart}
          end={end}
          setEnd={setEnd}
          disableAccount={isEdit}
          isLoading={isLoading}
          error={error}
        />
      ),
      enableNext: step1Complete,
    },
    {
      id: 2,
      name: 'Select roles',
      component: <MUARolesTable roles={roles} setRoles={setRoles} />,
      enableNext: step2Complete,
      canJumpTo: step1Complete,
    },
    {
      id: 3,
      name: 'Review details',
      component: (
        <ReviewStep
          targetAccount={targetAccount}
          start={start}
          end={end}
          roles={roles}
          isLoading={isLoading}
          error={error}
          setError={setError}
          onClose={() => onClose(false)}
        />
      ),
      canJumpTo: step1Complete && step2Complete,
      enableNext: !isLoading,
      nextButtonText: 'Finish',
    },
  ];

  const titleId = `${variant}-request`;
  const descriptionId = `${variant} request`;
  return (
    <React.Fragment>
      <Modal
        variant="large"
        style={{ height: '900px' }}
        showClose={false}
        hasNoBodyWrapper
        isOpen={!warnClose}
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
      >
        <Wizard
          titleId={titleId}
          descriptionId={descriptionId}
          title={capitalize(variant) + ' request'}
          steps={steps}
          onClose={() => (isDirty ? setWarnClose(true) : onClose(false))}
          onSave={onSave}
          startAtStep={step}
          onNext={({ id }) => {
            setError();
            setStep(id);
          }}
          onBack={({ id }) => {
            setError();
            setStep(id);
          }}
          onGoToStep={({ id }) => {
            setError();
            setStep(id);
          }}
        />
      </Modal>
      {warnClose && (
        <Modal
          title="Exit request creation?"
          variant="small"
          titleIconVariant="warning"
          isOpen
          onClose={() => setWarnClose(false)}
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
              onClick={() => setWarnClose(false)}
            >
              Stay
            </Button>,
          ]}
        >
          All inputs will be discarded.
        </Modal>
      )}
    </React.Fragment>
  );
};

EditRequestModal.propTypes = {
  requestId: PropTypes.string,
  variant: PropTypes.any,
  onClose: PropTypes.func,
};

export default EditRequestModal;
