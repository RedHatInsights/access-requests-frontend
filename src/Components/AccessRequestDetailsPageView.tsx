import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
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

// PatternFly layout modifier constants (structural, not user-facing)
const FLEX_GROW = { default: 'grow' } as const;
const ALIGN_SELF_FLEX_END = { default: 'alignSelfFlexEnd' } as const;
const SPACE_ITEMS_LG = { xl: 'spaceItemsLg' } as const;
const FLEX_1 = { default: 'flex_1' } as const;
const FLEX_3 = { default: 'flex_3' } as const;
const ALIGN_SELF_STRETCH = { default: 'alignSelfStretch' } as const;

const detailsMessages = {
  accessRequests: {
    id: 'accessRequests.details.breadcrumb.accessRequests',
    defaultMessage: 'Access Requests',
  },
  redHatPrefix: {
    id: 'accessRequests.details.breadcrumb.redHatPrefix',
    defaultMessage: 'Red Hat ',
  },
  rolesRequested: {
    id: 'accessRequests.details.rolesRequested',
    defaultMessage: 'Roles requested',
  },
  kebabDropdownAria: {
    id: 'accessRequests.details.kebabDropdownAria',
    defaultMessage: 'kebab dropdown toggle',
  },
};

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
  const intl = useIntl();
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
              <Link to="..">
                {!isInternal && (
                  <FormattedMessage {...detailsMessages.redHatPrefix} />
                )}
                {intl.formatMessage(detailsMessages.accessRequests)}
              </Link>
            )}
          />
          <BreadcrumbItem>{requestId}</BreadcrumbItem>
        </Breadcrumb>
        <Flex direction={{ default: 'column', md: 'row' }}>
          <FlexItem grow={FLEX_GROW}>
            <Title headingLevel="h1" size="2xl" className="pf-v6-u-pt-md">
              {requestId}
            </Title>
          </FlexItem>
          {isInternal && actions.items.length > 0 && (
            <FlexItem alignSelf={ALIGN_SELF_FLEX_END}>
              <Dropdown
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    id="actions-toggle"
                    aria-label={intl.formatMessage(
                      detailsMessages.kebabDropdownAria
                    )}
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
          spaceItems={SPACE_ITEMS_LG}
          direction={{ default: 'column', lg: 'row' }}
        >
          <FlexItem flex={FLEX_1} alignSelf={ALIGN_SELF_STRETCH}>
            <RequestDetailsCard
              isInternal={isInternal}
              request={request}
              requestId={requestId}
              displayProps={requestDisplayProps}
            />
          </FlexItem>
          <FlexItem
            flex={FLEX_3}
            grow={FLEX_GROW}
            alignSelf={ALIGN_SELF_STRETCH}
          >
            <Card ouiaId="request-roles" style={{ height: '100%' }}>
              <CardTitle>
                <Title headingLevel="h2" size="xl">
                  {intl.formatMessage(detailsMessages.rolesRequested)}
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
