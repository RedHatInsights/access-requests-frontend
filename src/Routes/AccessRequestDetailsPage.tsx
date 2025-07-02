import React, { useContext } from 'react';
import {
  capitalize,
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
} from '@patternfly/react-core';
import {
  Dropdown,
  DropdownItem,
  KebabToggle,
} from '@patternfly/react-core/deprecated';
import { Link } from 'react-router-dom';
import { Provider } from 'react-redux';
import MUARolesTable from '../Components/mua-roles-table/MUARolesTable';
import { RegistryContext } from '../store';
import CancelRequestModal from '../Components/CancelRequestModal';
import AccessRequestWizard from '../Components/access-requests-wizard/AccessRequestsWizard';
import { getLabelProps } from '../Helpers/getLabelProps';
import { getInternalActions } from '../Helpers/getActions';
import { StatusLabel } from '../Helpers/getActions';
import { useAccessRequestDetails } from './hooks/useAccessRequestDetails';

interface BaseAccessRequestDetailsPageProps {
  isInternal: boolean;
}

const BaseAccessRequestDetailsPage: React.FC<
  BaseAccessRequestDetailsPageProps
> = ({ isInternal }) => {
  const {
    request,
    requestId,
    openModal,
    setOpenModal,
    onModalClose,
    isDropdownOpen,
    setIsDropdownOpen,
    requestDisplayProps,
  } = useAccessRequestDetails({ isInternal });

  // Get actions for dropdown
  const actions = getInternalActions(
    request?.status || 'pending',
    requestId,
    setOpenModal
  );

  return (
    <React.Fragment>
      <PageSection variant="light">
        <Breadcrumb>
          <BreadcrumbItem
            render={() => (
              <Link to="..">{!isInternal && 'Red Hat '}Access Requests</Link>
            )}
          />
          <BreadcrumbItem>{requestId}</BreadcrumbItem>
        </Breadcrumb>
        <Flex direction={{ default: 'column', md: 'row' }}>
          <FlexItem grow={{ default: 'grow' }}>
            <Title headingLevel="h1" size="2xl" className="pf-v5-u-pt-md">
              {requestId}
            </Title>
          </FlexItem>
          {isInternal && actions.items.length > 0 && (
            <FlexItem alignSelf={{ default: 'alignSelfFlexEnd' }}>
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
                disabled={actions.disable}
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
                    <div className="pf-v5-u-pb-md">
                      {isInternal ? (
                        <div>
                          <label>
                            <b>Request status</b>
                          </label>
                          <br />
                          <Label
                            className="pf-v5-u-mt-sm"
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
                      <div className="pf-v5-u-pb-md" key={key}>
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
        <AccessRequestWizard
          variant="edit"
          requestId={requestId}
          onClose={onModalClose}
        />
      )}
    </React.Fragment>
  );
};

interface AccessRequestDetailsPageProps {
  /**
   * Determines the view type for the access request details page.
   * - `true`: Internal view for Red Hat employees (shows actions, status management)
   * - `false`: External view for customers (read-only, shows decision status)
   *
   * Optional because this component serves dual purposes:
   * 1. Standalone app (determines view from route context)
   * 2. Federated module consumed by RBAC UI (explicit prop control)
   */
  isInternal?: boolean;
}

/**
 * This component is a federated module used in https://github.com/RedHatInsights/insights-rbac-ui
 * Try not to break RBAC.
 */
const AccessRequestDetailsPage: React.FC<AccessRequestDetailsPageProps> = ({
  isInternal = false,
}) => {
  const { getRegistry } = useContext(RegistryContext);

  return (
    <Provider store={(getRegistry as any)().getStore()}>
      <BaseAccessRequestDetailsPage isInternal={isInternal} />
    </Provider>
  );
};

export default AccessRequestDetailsPage;
