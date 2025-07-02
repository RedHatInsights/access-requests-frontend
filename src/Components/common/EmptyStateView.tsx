import React from 'react';
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { ComponentClass } from 'react';

interface EmptyStateViewProps {
  /** The title text to display */
  title: string;
  /** The descriptive body text */
  description?: string;
  /** The icon component to display */
  icon?: ComponentClass | React.ComponentType;
  /** Optional icon color */
  iconColor?: string;
  /** Size variant of the empty state */
  variant?: 'xs' | 'sm' | 'lg' | 'xl' | 'full';
  /** Heading level for the title */
  headingLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /** Optional action buttons or elements to display in footer */
  actions?: React.ReactElement | React.ReactElement[];
}

/**
 * Pure presentational component for consistent empty states throughout the application.
 * Provides a standardized way to display empty states with icons, titles, descriptions, and actions.
 */
export function EmptyStateView({
  title,
  description,
  icon,
  iconColor,
  variant = 'sm',
  headingLevel = 'h2',
  actions,
}: EmptyStateViewProps): React.ReactElement {
  return (
    <EmptyState variant={variant}>
      <EmptyStateHeader
        titleText={title}
        icon={
          icon ? <EmptyStateIcon icon={icon} color={iconColor} /> : undefined
        }
        headingLevel={headingLevel}
      />
      {description && <EmptyStateBody>{description}</EmptyStateBody>}
      {actions && <EmptyStateFooter>{actions}</EmptyStateFooter>}
    </EmptyState>
  );
}

export default EmptyStateView;
