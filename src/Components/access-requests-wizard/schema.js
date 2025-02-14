import React from 'react';
import { capitalize } from '@patternfly/react-core';
import validatorTypes from '@data-driven-forms/react-form-renderer/validator-types';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import InputHelpPopover from '../common/InputHelpPopover';

export const FIRST_NAME = 'first-name';
export const LAST_NAME = 'last-name';
export const ORG_ID = 'org-id';
export const ACCESS_FROM = 'start';
export const ACCESS_TO = 'end';
export const SELECTED_ROLES = 'selected-roles';

export default (isEdit, variant) => ({
  fields: [
    {
      component: 'wizard',
      name: 'wizard',
      isDynamic: true,
      inModal: true,
      showTitles: true,
      className: 'accessRequests',
      title: `${capitalize(variant)} request`,
      fields: [
        {
          name: 'details',
          nextStep: 'select-roles',
          title: 'Request details',
          fields: [
            {
              component: 'set-name',
              name: 'name',
              validate: [
                {
                  type: validatorTypes.REQUIRED,
                },
              ],
            },
            {
              component: componentTypes.TEXT_FIELD,
              isRequired: true,
              label: 'Organization ID',
              placeholder: 'Example, 1234567',
              isDisabled: isEdit,
              FormGroupProps: {
                labelIcon: (
                  <InputHelpPopover
                    bodyContent={
                      <p>
                        This is the org ID of the account that you would like to
                        receive read access to
                      </p>
                    }
                    field="organization ID"
                  />
                ),
              },
              helperText: 'Enter the organization ID you would like access to',
              name: ORG_ID,
              validate: [{ type: 'validate-org-id' }],
            },
            {
              name: 'access-duration',
              component: 'access-duration',
              label: 'Access duration',
              isRequired: true,
            },
            {
              name: ACCESS_FROM,
              component: componentTypes.TEXT_FIELD,
              hideField: true,
              isRequired: true,
              validate: [
                (value) =>
                  value?.length > 0 ? undefined : 'Invalid start date',
              ],
            },
            {
              name: ACCESS_TO,
              component: componentTypes.TEXT_FIELD,
              hideField: true,
              isRequired: true,
              validate: [
                (value) => (value?.length > 0 ? undefined : 'Invalid end date'),
              ],
            },
          ],
        },
        {
          name: 'select-roles',
          nextStep: 'review-details',
          title: 'Select roles',
          StepTemplate: (props) => props.formFields,
          fields: [
            {
              component: 'select-roles',
              name: SELECTED_ROLES,
              validate: [
                (value) =>
                  value?.length > 0 ? undefined : 'No roles selected',
              ],
            },
          ],
        },
        {
          name: 'review-details',
          title: 'Review details',
          fields: [
            {
              component: 'review-details',
              name: 'review-details',
            },
          ],
        },
      ],
    },
  ],
});
