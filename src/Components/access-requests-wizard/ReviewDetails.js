import React from 'react';
import {
  Grid,
  GridItem,
  Stack,
  StackItem,
  Text,
  TextVariants,
} from '@patternfly/react-core';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import PropTypes from 'prop-types';
import {
  ACCESS_FROM,
  ACCESS_TO,
  ACCOUNT_NUMBER,
  SELECTED_ROLES,
} from './schema';
import './review-details.scss';

const ReviewDetails = () => {
  const formOptions = useFormApi();
  const values = formOptions.getState().values;

  return (
    <React.Fragment>
      <Stack className="accessRequests">
        <StackItem className="pf-u-mb-md">
          <Grid>
            <GridItem sm={12} md={2}>
              <Text
                component={TextVariants.h4}
                className="access-requests-bold-text"
              >
                Account number
              </Text>
            </GridItem>
            <GridItem sm={12} md={10}>
              <Text component={TextVariants.p}>{values[ACCOUNT_NUMBER]}</Text>
            </GridItem>
          </Grid>
        </StackItem>
        <StackItem>
          <Grid>
            <GridItem sm={12} md={2}>
              <Text
                component={TextVariants.h4}
                className="access-requests-bold-text"
              >
                Access duration
              </Text>
            </GridItem>
          </Grid>
        </StackItem>
        <StackItem>
          <Grid>
            <GridItem sm={12} md={2}>
              <Text component={TextVariants.h4}>From</Text>
            </GridItem>
            <GridItem sm={12} md={10}>
              <Text component={TextVariants.p}>{values[ACCESS_FROM]}</Text>
            </GridItem>
          </Grid>
        </StackItem>
        <StackItem className="pf-u-mb-md">
          <Grid>
            <GridItem sm={12} md={2}>
              <Text component={TextVariants.h4}>To</Text>
            </GridItem>
            <GridItem sm={12} md={10}>
              <Text component={TextVariants.p}>{values[ACCESS_TO]}</Text>
            </GridItem>
          </Grid>
        </StackItem>
        <StackItem>
          <Grid>
            <GridItem sm={12} md={2}>
              <Text
                component={TextVariants.h4}
                className="access-requests-bold-text"
              >
                Roles
              </Text>
            </GridItem>
            <GridItem sm={12} md={10}>
              <Text component={TextVariants.p}>
                {values[SELECTED_ROLES]?.[0]}
              </Text>
            </GridItem>
          </Grid>
        </StackItem>
        {values[SELECTED_ROLES]?.slice(1).map((role) => (
          <StackItem key={role}>
            <Grid>
              <GridItem sm={12} md={2}>
                <Text component={TextVariants.h4}></Text>
              </GridItem>
              <GridItem sm={12} md={10}>
                <Text component={TextVariants.p}>{role}</Text>
              </GridItem>
            </Grid>
          </StackItem>
        ))}
      </Stack>
    </React.Fragment>
  );
};

ReviewDetails.propTypes = {
  targetAccount: PropTypes.any,
  start: PropTypes.any,
  end: PropTypes.any,
  roles: PropTypes.any,
  isLoading: PropTypes.any,
  error: PropTypes.any,
  onClose: PropTypes.any,
};

export default ReviewDetails;
