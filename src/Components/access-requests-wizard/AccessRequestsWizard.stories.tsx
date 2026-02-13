import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  expect,
  screen,
  userEvent,
  waitFor,
  waitForElementToBeRemoved,
} from 'storybook/test';
import { http, HttpResponse } from 'msw';
import AccessRequestsWizard from './AccessRequestsWizard';

const meta: Meta<typeof AccessRequestsWizard> = {
  component: AccessRequestsWizard,
  parameters: {
    layout: 'fullscreen',
    chromatic: { disableSnapshot: true }, // Disable for complex wizard interactions
    msw: {
      handlers: [
        // Mock user authentication
        http.get('/api/chrome-service/v1/user', () => {
          return HttpResponse.json({
            identity: {
              user: {
                first_name: 'John',
                last_name: 'Doe',
                username: 'jdoe',
                is_internal: true,
              },
            },
          });
        }),

        // Mock roles API for SelectRoles step
        http.get('/api/rbac/v1/roles/', () => {
          return HttpResponse.json({
            data: [
              {
                uuid: 'r-1',
                display_name: 'Viewer',
                name: 'viewer',
                description: 'View-only access to resources',
              },
              {
                uuid: 'r-2',
                display_name: 'Editor',
                name: 'editor',
                description: 'Edit access to resources',
              },
              {
                uuid: 'r-3',
                display_name: 'Administrator',
                name: 'admin',
                description: 'Full administrative access',
              },
            ],
            meta: { count: 3 },
          });
        }),

        // Mock account validation success
        http.post('/api/rbac/v1/cross-account-requests/', () => {
          return HttpResponse.json({
            request_id: 'REQ-12345',
            status: 'pending',
          });
        }),

        // Mock existing request for edit mode
        http.get(
          '/api/rbac/v1/cross-account-requests/:requestId/',
          ({ params }) => {
            return HttpResponse.json({
              request_id: params.requestId,
              target_account: '123456789',
              target_org: '987654321',
              start_date: getValidDate(0),
              end_date: getValidDate(8),
              roles: [{ display_name: 'Viewer' }, { display_name: 'Editor' }],
            });
          }
        ),

        // Mock PUT for editing requests
        http.put(
          '/api/rbac/v1/cross-account-requests/:requestId/',
          ({ params }) => {
            return HttpResponse.json({
              request_id: params.requestId,
              status: 'pending',
            });
          }
        ),
      ],
    },
  },
  args: {
    variant: 'create',
    onClose: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic create request wizard in initial state
 */
export const CreateRequest: Story = {
  args: {
    variant: 'create',
    onClose: () => console.log('Wizard closed'),
  },
};

/**
 * Edit existing request wizard with pre-filled data
 */
export const EditRequest: Story = {
  args: {
    variant: 'edit',
    requestId: 'REQ-12345',
    onClose: () => console.log('Wizard closed'),
  },
};

// Helper function to get valid date strings within the 60-day window
const getValidDate = (daysFromToday: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

/**
 * Complete wizard flow simulation - creates a new access request
 * Tests all form steps with valid data entry
 */
export const CompleteCreateFlow: Story = {
  args: {
    variant: 'create',
    onClose: () => console.log('Request created successfully'),
  },
  play: async () => {
    // Use screen since modal is appended to document.body (outside canvasElement)

    // Wait for wizard modal to appear and load
    await waitFor(
      () => {
        expect(
          screen.getByText('Request details', { selector: 'h1' })
        ).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Fill in the account number
    const accountInput = screen.getAllByLabelText(/account number/i)[0];
    await userEvent.clear(accountInput);
    await userEvent.type(accountInput, '123456789');

    // Fill in organization ID
    const orgInput = screen.getAllByLabelText(/organization id/i)[0];
    await userEvent.clear(orgInput);
    await userEvent.type(orgInput, '987654321');

    // Fill in start date
    const startDate = getValidDate(0);
    const startDateInput = screen.getAllByLabelText(/start date/i)[0];
    await userEvent.clear(startDateInput);
    await userEvent.type(startDateInput, startDate);

    // Fill in end date
    const endDate = getValidDate(5);
    const endDateInput = screen.getAllByLabelText(/end date/i)[0];
    await userEvent.clear(endDateInput);
    await userEvent.type(endDateInput, endDate);

    // Proceed to next step
    const nextButton = screen.getByRole('button', { name: /next/i });
    await userEvent.click(nextButton);

    // Step 2: Select Roles
    await waitFor(() => {
      expect(
        screen.getByText('Select roles', { selector: 'h2' })
      ).toBeInTheDocument();
    });

    // Wait for roles to load and select one
    await waitFor(() => {
      expect(screen.getByText('Viewer')).toBeInTheDocument();
    });

    // Select first role
    const checkboxes = screen.getAllByRole('checkbox');
    if (checkboxes.length > 0) {
      await userEvent.click(checkboxes[0]);
    }

    // Proceed to review step
    const nextButton2 = screen.getAllByRole('button', { name: /next/i })[1];
    await userEvent.click(nextButton2);

    // Step 3: Review Details
    await waitFor(() => {
      expect(
        screen.getByText('Review details', { selector: 'h1' })
      ).toBeInTheDocument();
    });

    // Submit the request
    const submitButton = screen.getByRole('button', { name: /submit|create/i });
    await userEvent.click(submitButton);

    // Wait for submission state
    await waitFor(() => {
      expect(
        screen.getByText(/submitting access request/i)
      ).toBeInTheDocument();
    });
  },
};

/**
 * Test the cancel warning modal
 */
export const CancelWarning: Story = {
  args: {
    variant: 'create',
    onClose: () => console.log('Wizard cancelled'),
  },
  play: async () => {
    // Wait for wizard to load
    await waitFor(() => {
      expect(
        screen.getByText('Request details', { selector: 'h1' })
      ).toBeInTheDocument();
    });

    // Fill in some data first
    const accountInput = screen.getByPlaceholderText('Example, 8675309');
    await userEvent.type(accountInput, '123456789');

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    // Should show cancel warning modal
    await waitFor(() => {
      expect(screen.getByText('Exit request creation?')).toBeInTheDocument();
    });

    expect(
      screen.getByText('All inputs will be discarded.')
    ).toBeInTheDocument();

    // Test staying in the wizard
    const stayButton = screen.getByRole('button', { name: /stay/i });
    await userEvent.click(stayButton);

    // Should return to the form
    await waitFor(() => {
      expect(
        screen.getByText('Request details', { selector: 'h1' })
      ).toBeInTheDocument();
    });
  },
};

/**
 * Test loading state
 */
export const LoadingState: Story = {
  parameters: {
    msw: {
      handlers: [
        // Simulate slow user API response
        http.get(
          '/api/rbac/v1/cross-account-requests/:requestId/',
          async (params) => {
            await new Promise((resolve) => setTimeout(resolve, 500));
            return HttpResponse.json({
              request_id: params.requestId,
              target_account: '123456789',
              target_org: '987654321',
              start_date: getValidDate(0),
              end_date: getValidDate(8),
              roles: [{ display_name: 'Viewer' }, { display_name: 'Editor' }],
            });
          }
        ),
      ],
    },
  },
  args: {
    variant: 'edit',
    requestId: 'REQ-12345',
    onClose: () => console.log('Wizard closed'),
  },
  play: async () => {
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'));
  },
};

/**
 * Test error state with invalid account
 */
export const InvalidAccountError: Story = {
  parameters: {
    msw: {
      handlers: [
        // Mock user authentication
        http.get('/api/chrome-service/v1/user', () => {
          return HttpResponse.json({
            identity: {
              user: {
                first_name: 'John',
                last_name: 'Doe',
                username: 'jdoe',
                is_internal: true,
              },
            },
          });
        }),

        // Mock roles API
        http.get('/api/rbac/v1/roles/', () => {
          return HttpResponse.json({
            data: [
              {
                display_name: 'Viewer',
                name: 'viewer',
                description: 'View-only access to resources',
              },
            ],
            meta: { count: 1 },
          });
        }),

        // Mock invalid account error
        http.post('/api/rbac/v1/cross-account-requests/', () => {
          return HttpResponse.json(
            {
              errors: [
                {
                  detail: 'Account 999999999 does not exist',
                  message: 'Account 999999999 does not exist',
                },
              ],
            },
            { status: 400 }
          );
        }),
      ],
    },
  },
  args: {
    variant: 'create',
    onClose: () => console.log('Wizard closed'),
  },
  play: async () => {
    // Wait for wizard to load
    await waitFor(() => {
      expect(
        screen.getByText('Request details', { selector: 'h1' })
      ).toBeInTheDocument();
    });

    // Fill in invalid account details
    const accountInput = screen.getByPlaceholderText('Example, 8675309');
    await userEvent.type(accountInput, '999999999');

    const orgInput = screen.getByPlaceholderText('Example, 1234567');
    await userEvent.type(orgInput, '999999999');

    // Fill in dates
    const startDateInput = screen.getByLabelText('Start date');
    await userEvent.type(startDateInput, getValidDate(0));

    const endDateInput = screen.getByLabelText('End date');
    await userEvent.type(endDateInput, getValidDate(10));

    // Proceed to roles
    const nextButton = screen.getByRole('button', { name: /next/i });
    await userEvent.click(nextButton);

    // Select a role
    await waitFor(() => {
      expect(screen.getByText('Viewer')).toBeInTheDocument();
    });

    const viewerCheckbox = screen.getByRole('checkbox', {
      name: /select row 0/i,
    });
    await userEvent.click(viewerCheckbox);

    const nextButton2 = screen.getAllByRole('button', { name: /next/i })[1];
    await userEvent.click(nextButton2);

    // Submit the request
    await waitFor(() => {
      expect(
        screen.getByText('Review details', { selector: 'h1' })
      ).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);

    // Should show error
    await waitFor(() => {
      expect(screen.getByText('Invalid Account number')).toBeInTheDocument();
    });
  },
};

/**
 * Test edit request flow with pre-filled data
 */
export const EditRequestFlow: Story = {
  args: {
    variant: 'edit',
    requestId: 'REQ-12345',
    onClose: () => console.log('Request edited successfully'),
  },
  play: async () => {
    // Wait for wizard to load with edit data
    await waitFor(() => {
      expect(screen.getByText('Edit request')).toBeInTheDocument();
    });

    // Verify pre-filled data
    await waitFor(() => {
      expect(screen.getByDisplayValue('123456789')).toBeInTheDocument(); // Account number
      expect(screen.getByDisplayValue('987654321')).toBeInTheDocument(); // Org ID
    });

    // Account and org fields should be disabled in edit mode
    const accountInput = screen.getByDisplayValue('123456789');
    expect(accountInput).toBeDisabled();

    const orgInput = screen.getByDisplayValue('987654321');
    expect(orgInput).toBeDisabled();

    // Proceed to roles step
    const nextButton = screen.getByRole('button', { name: /next/i });
    await userEvent.click(nextButton);

    // Verify roles are pre-selected
    await waitFor(() => {
      expect(
        screen.getByText('Select roles', { selector: 'h2' })
      ).toBeInTheDocument();
    });

    // Proceed to review
    const nextButton2 = screen.getAllByRole('button', { name: /next/i })[1];
    await userEvent.click(nextButton2);

    // Submit the edit
    await waitFor(() => {
      expect(
        screen.getByText('Review details', { selector: 'h1' })
      ).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);

    // Wait for submission
    await waitFor(() => {
      expect(screen.getByText('Submitting access request')).toBeInTheDocument();
    });
  },
};
