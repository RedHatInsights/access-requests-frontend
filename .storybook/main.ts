import { createMainConfig } from '@redhat-cloud-services/hcc-storybook-hub/main-config';

export default createMainConfig({
  staticDirs: ['../static'],
  msw: false,
  extraAddons: ['storybook-addon-mock-date'],
});
