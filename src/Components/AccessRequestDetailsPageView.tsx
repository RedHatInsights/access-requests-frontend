import React from 'react';
import { getInternalActions } from '../Helpers/getActions';
import {
  Breadcrumb,
  BreadcrumbItem,
  Card,
  CardBody,
  CardTitle,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  MenuToggle,
  PageSection,
  Spinner,
  Title,
} from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import EllipsisVIcon from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import MUARolesTable from './mua-roles-table/MUARolesTable';
import CancelRequestModal from './CancelRequestModal';
import AccessRequestWizard from './access-requests-wizard/AccessRequestsWizard';
import { RequestDetailsCard } from './RequestDetailsCard';

interface AccessRequestDetailsPageViewProps {
  /** Whether this is the internal (Red Hat employee) view */
  isInternal: boolean;
  /** The request data object */
  request: any;
  /** The request ID */
  requestId: string;
  /** Properties to display in the request details card */
  requestDisplayProps: string[];
  /** Whether the actions dropdown is open */
  isDropdownOpen: boolean;
  /** Current open modal state */
  openModal: { type: 'edit' | 'cancel' | null };
  /** Callback when dropdown toggle is clicked */
  onDropdownToggle: () => void;
  /** Callback when modal is closed */
  onModalClose: () => void;
  /** Callback when actions are clicked */
  onActionClick: (params: {
    type: 'edit' | 'cancel';
    requestId: string;
  }) => void;
}

/**
 * Pure presentational component for the access request details page.
 * Shows the complete page layout with breadcrumbs, actions, and content sections.
 */
export function AccessRequestDetailsPageView({
  isInternal,
  request,
  requestId,
  requestDisplayProps,
  isDropdownOpen,
  openModal,
  onDropdownToggle,
  onModalClose,
  onActionClick,
}: AccessRequestDetailsPageViewProps): React.ReactElement {
  // Get actions for dropdown
  const actions = getInternalActions(
    request?.status || 'pending',
    requestId,
    onActionClick
  );

  return (
    <React.Fragment>
      <PageSection hasBodyWrapper={false}>
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
            <Title headingLevel="h1" size="2xl" className="pf-v6-u-pt-md">
              {requestId}
            </Title>
          </FlexItem>
          {isInternal && actions.items.length > 0 && (
            <FlexItem alignSelf={{ default: 'alignSelfFlexEnd' }}>
              <Dropdown
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    id="actions-toggle"
                    aria-label="kebab dropdown toggle"
                    variant="plain"
                    onClick={onDropdownToggle}
                    isExpanded={isDropdownOpen}
                    isDisabled={actions.disable}
                    icon={<EllipsisVIcon />}
                  />
                )}
                isOpen={isDropdownOpen}
                isPlain
              >
                <DropdownList>
                  {actions.items.map(({ title, onClick }) => (
                    <DropdownItem
                      key={title}
                      component="button"
                      onClick={onClick}
                    >
                      {title}
                    </DropdownItem>
                  ))}
                </DropdownList>
              </Dropdown>
            </FlexItem>
          )}
        </Flex>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <Flex
          spaceItems={{ xl: 'spaceItemsLg' }}
          direction={{ default: 'column', lg: 'row' }}
        >
          <FlexItem
            flex={{ default: 'flex_1' }}
            alignSelf={{ default: 'alignSelfStretch' }}
          >
            <RequestDetailsCard
              isInternal={isInternal}
              request={request}
              requestId={requestId}
              displayProps={requestDisplayProps}
            />
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
}
