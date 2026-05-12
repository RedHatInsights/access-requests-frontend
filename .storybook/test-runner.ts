import type { TestRunnerConfig } from '@storybook/test-runner';
import { getViolations, injectAxe } from 'axe-playwright';
import type { Result, NodeResult } from 'axe-core';
import type { Page } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

const isEnabled = (value: string | undefined): boolean => ['1', 'true', 'yes'].includes((value || '').toLowerCase());

const shouldTakeContrastScreenshots = isEnabled(process.env.STORYBOOK_CONTRAST_SCREENSHOTS);
const screenshotDir = process.env.STORYBOOK_A11Y_SCREENSHOT_DIR || 'storybook-a11y-screenshots';

const getStoryIdFromUrl = (urlString: string): string => {
  try {
    const url = new URL(urlString);
    return url.searchParams.get('id') || 'unknown-story';
  } catch {
    return 'unknown-story';
  }
};

const formatContrastDebugLine = (node: NodeResult): string => {
  const selector = Array.isArray(node?.target) ? node.target.join(', ') : 'unknown-selector';
  const checks = [...(node?.any || []), ...(node?.all || [])];
  const contrastCheck = checks.find((check) => check?.id === 'color-contrast');
  const data = contrastCheck?.data || {};

  const foreground = data.fgColor || data.foregroundColor || 'unknown';
  const background = data.bgColor || data.backgroundColor || 'unknown';
  const ratio = data.contrastRatio || data.contrast || 'unknown';
  const expected = data.expectedContrastRatio || data.expected || 'unknown';

  return `selector=${selector} fg=${foreground} bg=${background} ratio=${ratio} expected=${expected}`;
};

const getViolationSelectors = (violations: Result[]): string[] => {
  const selectors = new Set<string>();
  for (const violation of violations) {
    for (const node of violation?.nodes || []) {
      if (Array.isArray(node?.target)) {
        for (const selector of node.target) {
          if (typeof selector === 'string' && selector.trim()) {
            selectors.add(selector);
          }
        }
      }
    }
  }
  return Array.from(selectors);
};

const setStorybookTheme = async (page: Page, enableDarkMode: boolean): Promise<void> => {
  await page.evaluate((isDarkMode: boolean) => {
    document.documentElement.classList.toggle('pf-v6-theme-dark', isDarkMode);

    // Axe can miscompute contrast when effective backgrounds are transparent.
    // Force explicit page surfaces so checks resolve background consistently.
    const explicitBackground = isDarkMode ? '#151515' : '#ffffff';
    document.documentElement.style.backgroundColor = explicitBackground;
    document.body.style.backgroundColor = explicitBackground;

    const storyRoot = document.getElementById('storybook-root');
    if (storyRoot) {
      (storyRoot as HTMLElement).style.backgroundColor = explicitBackground;
    }
  }, enableDarkMode);
};

const checkContrastForMode = async (page: Page, isDarkMode: boolean): Promise<Result[]> => {
  await setStorybookTheme(page, isDarkMode);
  return await getViolations(page, '#storybook-root', {
    runOnly: {
      type: 'rule',
      values: ['color-contrast']
    }
  });
};

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page) {
    const storyId = getStoryIdFromUrl(page.url()).replace(/[^a-z0-9-_]/gi, '_');

    // Check contrast in light mode
    const lightModeViolations = await checkContrastForMode(page, false);

    // Check contrast in dark mode
    const darkModeViolations = await checkContrastForMode(page, true);

    // Combine violations from both modes
    const hasLightModeViolations = lightModeViolations.length > 0;
    const hasDarkModeViolations = darkModeViolations.length > 0;

    if (!hasLightModeViolations && !hasDarkModeViolations) {
      return;
    }

    // Log violations for each mode
    if (hasLightModeViolations) {
      console.error(
        `[storybook-contrast] mode=light story=${storyId} violations=${lightModeViolations.length}`
      );
      const firstViolation = lightModeViolations[0];
      for (const node of firstViolation.nodes || []) {
        console.error(`[storybook-contrast] ${formatContrastDebugLine(node)}`);
      }
    }

    if (hasDarkModeViolations) {
      console.error(
        `[storybook-contrast] mode=dark story=${storyId} violations=${darkModeViolations.length}`
      );
      const firstViolation = darkModeViolations[0];
      for (const node of firstViolation.nodes || []) {
        console.error(`[storybook-contrast] ${formatContrastDebugLine(node)}`);
      }
    }

    // Handle screenshots and error reporting
    const allViolations = [...lightModeViolations, ...darkModeViolations];
    const failingSelectors = getViolationSelectors(allViolations);

    if (!shouldTakeContrastScreenshots) {
      throw new Error(
        `Color contrast check failed: ${lightModeViolations.length} light mode and ${darkModeViolations.length} dark mode violation(s) detected. Run with STORYBOOK_CONTRAST_SCREENSHOTS=true to capture screenshots.`
      );
    }

    const screenshotBasePath = path.join(screenshotDir, `${storyId}-${Date.now()}`);
    let screenshotPaths: string[] = [];

      // Take screenshots for light mode violations
      if (hasLightModeViolations) {
        await setStorybookTheme(page, false);
        const lightNormalPath = `${screenshotBasePath}-light-normal.png`;
        const lightHighlightedPath = `${screenshotBasePath}-light-highlighted.png`;

        await fs.mkdir(path.dirname(lightNormalPath), { recursive: true });
        await page.screenshot({ path: lightNormalPath, fullPage: true });
        screenshotPaths.push(lightNormalPath);

        if (failingSelectors.length > 0) {
          await page.evaluate((selectors: string[]) => {
            for (const selector of selectors) {
              let elements: NodeListOf<HTMLElement>;
              try {
                elements = document.querySelectorAll<HTMLElement>(selector);
              } catch {
                continue;
              }

              elements.forEach((element) => {
                // Force highly visible colors in screenshots for failed contrast nodes.
                element.style.setProperty('color', '#ff0000', 'important');
                element.style.setProperty('background-color', '#0000ff', 'important');
                element.style.setProperty('outline', '3px solid #ffff00', 'important');
                element.style.setProperty('outline-offset', '2px', 'important');
              });
            }
          }, failingSelectors);
          await page.screenshot({ path: lightHighlightedPath, fullPage: true });
          screenshotPaths.push(lightHighlightedPath);
        }
      }

      // Take screenshots for dark mode violations
      if (hasDarkModeViolations) {
        await setStorybookTheme(page, true);
        const darkNormalPath = `${screenshotBasePath}-dark-normal.png`;
        const darkHighlightedPath = `${screenshotBasePath}-dark-highlighted.png`;

        await fs.mkdir(path.dirname(darkNormalPath), { recursive: true });
        await page.screenshot({ path: darkNormalPath, fullPage: true });
        screenshotPaths.push(darkNormalPath);

        if (failingSelectors.length > 0) {
          await page.evaluate((selectors: string[]) => {
            for (const selector of selectors) {
              let elements: NodeListOf<HTMLElement>;
              try {
                elements = document.querySelectorAll<HTMLElement>(selector);
              } catch {
                continue;
              }

              elements.forEach((element) => {
                // Force highly visible colors in screenshots for failed contrast nodes.
                element.style.setProperty('color', '#ff0000', 'important');
                element.style.setProperty('background-color', '#0000ff', 'important');
                element.style.setProperty('outline', '3px solid #ffff00', 'important');
                element.style.setProperty('outline-offset', '2px', 'important');
              });
            }
          }, failingSelectors);
          await page.screenshot({ path: darkHighlightedPath, fullPage: true });
          screenshotPaths.push(darkHighlightedPath);
        }
      }

    const screenshotMessage = screenshotPaths.length > 0
      ? `Screenshots saved to ${screenshotPaths.join(', ')}.`
      : 'No screenshots captured.';

    throw new Error(
      `Color contrast check failed: ${lightModeViolations.length} light mode and ${darkModeViolations.length} dark mode violation(s) detected. ${screenshotMessage}`
    );
  }
};

export default config;
