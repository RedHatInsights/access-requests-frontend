# access-requests-frontend

TAM (Technical Account Manager) tool for Red Hatters to request access to customer accounts. Provides requester and approver views controlled by an `isInternal` flag. Exported as federated modules consumed by insights-rbac-ui.

## Commands

```bash
npm run dev      # Dev server (fec dev with HMR)
npm run build    # Production build (fec build)
npm run lint     # ESLint (config/ and src/)
npm test         # Jest (--passWithNoTests)
npm run verify   # Full check: build + lint + test
npm run storybook       # Storybook dev (port 6006)
npm run test-storybook  # Storybook interaction tests
```

## Tech Stack

- React 18, TypeScript (strict), Redux
- PatternFly 6 (react-core, react-table, react-component-groups)
- `@data-driven-forms/react-form-renderer` for the access request wizard
- Unleash feature flags (`@unleash/proxy-client-react`)
- Webpack via `fec` (frontend-components-config)
- Module Federation — consumed by `insights-rbac-ui`
- Storybook 9 with MSW for API mocking, deployed to Chromatic

## Architecture

```
src/
  Components/
    AccessRequestsTable.tsx         # Main table view
    AccessRequestDetailsPageView.tsx # Detail view
    CancelRequestModal.tsx          # Cancel dialog
    access-requests-wizard/         # Multi-step wizard (schema-driven via @data-driven-forms)
    common/                         # Shared components (EmptyStateView, etc.)
    mua-roles-table/                # Roles subcomponent
  Helpers/
    apiInstance.js    # Axios instance
    getActions.tsx    # Action button helpers
    getLabelProps.ts  # Status label helpers
  Routes/
    AccessRequestsPage.tsx          # List page (lazy-loaded)
    AccessRequestDetailsPage.tsx    # Detail page (lazy-loaded)
  Redux/
    action-types.js  # Redux action constants
    error-reducer.js # Error reducer
```

Entry points: `entry.js` (prod), `entry-dev.js` (dev), `lib.js` (federated export). Routes in `Routing.tsx` use `React.lazy()`.

App URLs: `/internal/access-requests` and `/iam/user-access/access-requests`

## Testing

- Jest 29 + Testing Library for unit tests
- Playwright E2E in `playwright/e2e/` (stage environment, Vault auth)
- Storybook interaction tests via `@storybook/test-runner`
- Stories co-located with components as `.stories.tsx`

## Conventions

- ESLint with `@redhat-cloud-services/eslint-config-redhat-cloud-services`
- TypeScript ESLint: `no-explicit-any` warn, `no-unused-vars` error
- `isInternal` flag is the core architectural toggle — requester vs approver views
- Wizard uses `@data-driven-forms` schema definitions in `schema.ts`
