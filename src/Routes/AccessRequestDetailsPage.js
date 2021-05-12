import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
  Title,
  Card,
  CardTitle,
  CardBody,
  Flex,
  FlexItem,
  Spinner,
  Label,
  Dropdown,
  DropdownItem,
  KebabToggle,
} from '@patternfly/react-core';
import { capitalize } from '@patternfly/react-core/dist/esm/helpers/util';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, Provider } from 'react-redux';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/redux';
import MUARolesTable from '../Components/MUARolesTable';
import CancelRequestModal from '../Components/CancelRequestModal';
import EditRequestModal from '../Components/EditRequestModal';
import { getLabelProps } from '../Helpers/getLabelProps';
import { getInternalActions, StatusLabel } from '../Helpers/getActions';
import PropTypes from 'prop-types';

const BaseAccessRequestDetailsPage = ({ isInternal }) => {
  const [request, setRequest] = React.useState();
  const { requestId } = useParams();
  const dispatch = useDispatch();
  React.useEffect(() => {
    fetch(`${API_BASE}/cross-account-requests/${requestId}/`)
      .then((res) => res.json())
      .then((res) => {
        if (res.errors) {
          throw Error(res.errors.map((e) => e.detail).join('\n'));
        }
        setRequest(res);
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

  // Modal actions
  const [openModal, setOpenModal] = React.useState({ type: null });
  const onModalClose = () => setOpenModal({ type: null });
  const actions = getInternalActions(
    request && request.status,
    requestId,
    setOpenModal
  );
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const requestDisplayProps = [
    ...(isInternal
      ? ['request_id', 'target_account']
      : ['first_name', 'last_name']),
    'start_date',
    'end_date',
    'created',
  ];
  return (
    <React.Fragment>
      <PageSection variant="light">
        <Breadcrumb>
          <BreadcrumbItem
            render={() => (
              <Link to="../">
                {!isInternal && 'Red Hat '}Access Requests
              </Link>
            )}
          />
          <BreadcrumbItem>{requestId}</BreadcrumbItem>
        </Breadcrumb>
        <Flex direction={{ default: 'column', md: 'row' }}>
          <FlexItem grow={{ default: 'grow' }}>
            <Title headingLevel="h1" size="2xl" className="pf-u-pt-md">
              {requestId}
            </Title>
          </FlexItem>
          {isInternal && actions.items.length > 0 && (
            <FlexItem alignSelf={{ default: 'alignRight' }}>
              <Dropdown
                position="right"
                toggle={
                  <KebabToggle
                    onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
                    id="actions-toggle"
                  />
                }
                isOpen={isDropdownOpen}
                isPlain
                dropdownItems={actions.items.map(({ title, onClick }) => (
                  <DropdownItem
                    key={title}
                    component="button"
                    onClick={onClick}
                  >
                    {title}
                  </DropdownItem>
                ))}
                isDisabled={actions.disable}
              />
            </FlexItem>
          )}
        </Flex>
      </PageSection>
      <PageSection>
        <Flex
          spaceItems={{ xl: 'spaceItemsLg' }}
          direction={{ default: 'column', lg: 'row' }}
        >
          <FlexItem
            flex={{ default: 'flex_1' }}
            alignSelf={{ default: 'alignSelfStretch' }}
          >
            <Card ouiaId="request-details" style={{ height: '100%' }}>
              <CardTitle>
                <Title headingLevel="h2" size="xl">
                  Request details
                </Title>
              </CardTitle>
              <CardBody>
                {!request ? (
                  <Spinner size="xl" />
                ) : (
                  <React.Fragment>
                    <div className="pf-u-pb-md">
                      {isInternal ? (
                        <div>
                          <label>
                            <b>Request status</b>
                          </label>
                          <br />
                          <Label
                            className="pf-u-mt-sm"
                            {...getLabelProps(request.status)}
                          >
                            {capitalize(request.status)}
                          </Label>
                        </div>
                      ) : (
                        <React.Fragment>
                          <label>
                            <b>Request decision</b>
                          </label>
                          <br />
                          <StatusLabel
                            requestId={requestId}
                            status={request.status}
                          />
                        </React.Fragment>
                      )}
                    </div>
                    {requestDisplayProps.map((prop, key) => (
                      <div className="pf-u-pb-md" key={key}>
                        <label>
                          <b>
                            {capitalize(
                              prop.replace(/_/g, ' ').replace('id', 'ID')
                            )}
                          </b>
                        </label>
                        <br />
                        <div>{request[prop]}</div>
                      </div>
                    ))}
                  </React.Fragment>
                )}
              </CardBody>
            </Card>
          </FlexItem>
          <FlexItem
            flex={{ default: 'flex_3' }}
            grow={{ default: 'grow' }}
            alignSelf={{ default: 'alignSelfStretch' }}
          >
            <Card ouiaId="request-roles" style={{ height: '100%' }}>
              <CardTitle>
                <Title headingLevel="h2" size="xl">
                  Roles requested
                </Title>
              </CardTitle>
              <CardBody>
                {!request ? (
                  <Spinner size="xl" />
                ) : (
                  <MUARolesTable roles={request.roles} />
                )}
              </CardBody>
            </Card>
          </FlexItem>
        </Flex>
      </PageSection>
      {openModal.type === 'cancel' && (
        <CancelRequestModal requestId={requestId} onClose={onModalClose} />
      )}
      {openModal.type === 'edit' && (
        <EditRequestModal
          variant="edit"
          requestId={requestId}
          onClose={onModalClose}
        />
      )}
    </React.Fragment>
  );
};

const AccessRequestDetailsPage = ({ getRegistry, ...props }) => (
  <Provider store={getRegistry().getStore()}>
    <BaseAccessRequestDetailsPage {...props} />
  </Provider>
);

AccessRequestDetailsPage.propTypes = {
  getRegistry: PropTypes.func,
};

BaseAccessRequestDetailsPage.propTypes = {
  isInternal: PropTypes.bool,
};

export default AccessRequestDetailsPage;
