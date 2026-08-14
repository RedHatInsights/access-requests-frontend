# access-requests-frontend

This package is the source for TAM tool for Red Hatters to request access to accounts in order to debug their data. Designs can be found [here.](https://marvelapp.com/prototype/257je526/screens)

Since most components are only slightly tweaked between the requester (aka internal) and approver (aka external) views an `isInternal` flag is passed around to control visibility.

The list and details pages are exported as federated modules for use in [rbac-ui.](https://github.com/RedHatInsights/insights-rbac-ui)

## Storybook

Interactive component documentation and stories are available on Chromatic:

- **Master branch**: https://master--686501da56bb357ec8c2a222.chromatic.com
- **Feature branches**: https://`<branch-name>`--686501da56bb357ec8c2a222.chromatic.com

Stories are automatically deployed on:
- ✅ Pushes to `master`
- ✅ Pull requests from [@RedHatInsights/experience-ui-committers](https://github.com/orgs/RedHatInsights/teams/experience-ui-committers) team members
- ✅ Pull requests from RedHatInsights organization admins

## Developing

1. `npm install`

### [Insights-standalone](https://github.com/RedHatInsights/insights-standalone)
2. `npm start`

### OR [Insights Proxy](https://github.com/RedHatInsights/insights-proxy)
2. `SPANDX_CONFIG="$(pwd)/insights-inventory-frontend/config/spandx.config.js" bash insights-proxy/scripts/run.sh`
3. `npm run start:frontend`

### OR [Webpack Proxy](https://github.com/RedHatInsights/frontend-components/tree/master/packages/config#useproxy)
2. `npm run start:proxy` or on beta env: `BETA=true npm run start:proxy`

### Testing
We are using [jest](https://www.npmjs.com/package/jest) and [react-testing](https://www.npmjs.com/package/@testing-library/react)

