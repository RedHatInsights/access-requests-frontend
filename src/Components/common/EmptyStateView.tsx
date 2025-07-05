import React from 'react';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
} from '@patternfly/react-core';

interface EmptyStateViewProps {
  /** The title text to display */
  title: string;
  /** The descriptive body text */
  description?: string;
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
  variant = 'sm',
  headingLevel = 'h2',
  actions,
}: EmptyStateViewProps): React.ReactElement {
  return (
    <EmptyState headingLevel={headingLevel} titleText={title} variant={variant}>
      {description && <EmptyStateBody>{description}</EmptyStateBody>}
      {actions && <EmptyStateFooter>{actions}</EmptyStateFooter>}
    </EmptyState>
  );
}

export default EmptyStateView;
