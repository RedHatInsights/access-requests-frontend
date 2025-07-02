import React from 'react';
import {
  Grid,
  GridItem,
  Stack,
  StackItem,
  Text,
  TextVariants,
} from '@patternfly/react-core';
import './review-details.scss';
import { useReviewDetails } from './hooks/useReviewDetails';

interface ReviewData {
  accountName: string;
  accountNumber: string;
  accessFrom: string;
  accessTo: string;
  selectedRoles: string[];
}

interface ReviewDetailsDisplayProps {
  data: ReviewData;
}

// Pure presentation component - perfect for Storybook
export const ReviewDetailsDisplay: React.FC<ReviewDetailsDisplayProps> = ({
  data,
}) => {
  return (
    <React.Fragment>
      <Stack className="accessRequests">
        <StackItem className="pf-v5-u-mb-md">
          <Grid>
            <GridItem sm={12} md={2}>
              <Text
                component={TextVariants.h4}
                className="access-requests-bold-text"
              >
                Account name
              </Text>
            </GridItem>
            <GridItem sm={12} md={10}>
              <Text component={TextVariants.p}>{data.accountName}</Text>
            </GridItem>
          </Grid>
        </StackItem>
        <StackItem className="pf-v5-u-mb-md">
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
              <Text component={TextVariants.p}>{data.accountNumber}</Text>
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
              <Text component={TextVariants.p}>{data.accessFrom}</Text>
            </GridItem>
          </Grid>
        </StackItem>
        <StackItem className="pf-v5-u-mb-md">
          <Grid>
            <GridItem sm={12} md={2}>
              <Text component={TextVariants.h4}>To</Text>
            </GridItem>
            <GridItem sm={12} md={10}>
              <Text component={TextVariants.p}>{data.accessTo}</Text>
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
              <Text component={TextVariants.p}>{data.selectedRoles?.[0]}</Text>
            </GridItem>
          </Grid>
        </StackItem>
        {data.selectedRoles?.slice(1).map((role: string) => (
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

interface ReviewDetailsProps {
  targetAccount?: any;
  start?: any;
  end?: any;
  roles?: any;
  isLoading?: any;
  error?: any;
  onClose?: any;
}

// Connected component for use in forms
const ReviewDetails: React.FC<ReviewDetailsProps> = () => {
  const { data } = useReviewDetails();

  return <ReviewDetailsDisplay data={data} />;
};

export default ReviewDetails;
