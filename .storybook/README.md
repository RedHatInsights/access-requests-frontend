# Storybook Decorators

This Storybook setup includes several custom decorators to provide context and mocking for components that depend on the Red Hat Insights platform architecture.

## Available Decorators

### `withMockChrome(config)`

Mocks the Chrome API and global `insights` object that components use for authentication and platform integration.

**Usage:**
```typescript
import { withMockChrome } from '../../../.storybook/preview';

export const MyStory: Story = {
  decorators: [withMockChrome({ bundle: 'iam', isBeta: true })],
  // ... rest of story
};
```

**Config Options:**
- `bundle`: String - Platform bundle ('insights', 'iam', etc.)
- `isBeta`: Boolean - Enable beta features
- `user`: Object - User identity overrides
- `auth`: Object - Authentication method overrides

### `withReduxStore`

Provides Redux store context using the application's registry pattern. Applied globally by default.

**Usage:**
```typescript
import { withReduxStore } from '../../../.storybook/preview';

export const MyStory: Story = {
  decorators: [withReduxStore],
  // ... rest of story
};
```

### `withPermissions(permissions)`

Specialized decorator for testing different user permission contexts.

**Usage:**
```typescript
import { withPermissions } from '../../../.storybook/preview';

export const InternalUserStory: Story = {
  decorators: [withPermissions({ isInternal: true, isOrgAdmin: false })],
  // ... rest of story
};

export const ExternalUserStory: Story = {
  decorators: [withPermissions({ isInternal: false, isOrgAdmin: false })],
  // ... rest of story
};
```

**Permission Options:**
- `isInternal`: Boolean - Red Hat internal user (default: true)
- `isOrgAdmin`: Boolean - Organization administrator (default: false)  
- `username`: String - Mock username (default: 'storybook-user')

### `withFeatureFlags(flags)`

Tests components with different feature flag configurations.

**Usage:**
```typescript
import { withFeatureFlags } from '../../../.storybook/preview';

export const BetaFeatureStory: Story = {
  decorators: [withFeatureFlags({ isBeta: true, bundle: 'iam' })],
  // ... rest of story
};
```

**Flag Options:**
- `isBeta`: Boolean - Enable beta environment features
- `bundle`: String - Platform bundle context

## Default Decorators

These decorators are applied globally to all stories:

1. **Chrome Mock** - Basic Chrome API mocking with default settings
2. **Redux Store** - Provides application Redux store context

## Examples

### Testing Internal vs External Views

Many components in this codebase use the `isInternal` prop to show different interfaces for Red Hat employees vs external users:

```typescript
export const InternalView: Story = {
  decorators: [withPermissions({ isInternal: true })],
  args: { /* story args */ }
};

export const ExternalView: Story = {
  decorators: [withPermissions({ isInternal: false })],  
  args: { /* story args */ }
};
```

### Testing Beta Features

```typescript
export const ProductionMode: Story = {
  decorators: [withFeatureFlags({ isBeta: false })],
  args: { /* story args */ }
};

export const BetaMode: Story = {
  decorators: [withFeatureFlags({ isBeta: true })],
  args: { /* story args */ }
};
```

### Combining Decorators

Decorators can be combined for complex scenarios:

```typescript
export const ComplexScenario: Story = {
  decorators: [
    withPermissions({ isInternal: true, isOrgAdmin: true }),
    withFeatureFlags({ isBeta: true, bundle: 'iam' })
  ],
  args: { /* story args */ }
};
```

## Component Patterns

### Components Using `useChrome`

Components that use the `useChrome` hook will automatically receive the mocked Chrome API from the default decorators.

### Components Using `useUserData`

Components using the `useUserData` hook will receive user data based on the permission context set by decorators.

### Components with `isInternal` Props

Many page-level components accept an `isInternal` prop. Use the permission decorators to test both internal/external views.

### Form Components

Form components using Data Driven Forms (like AccessDuration) work with the default Redux store decorator and don't need additional setup. 