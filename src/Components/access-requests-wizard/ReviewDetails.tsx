import React from 'react';
import {
  Grid,
  GridItem,
  Stack,
  StackItem,
  Content,
  ContentVariants,
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
        <StackItem className="pf-v6-u-mb-md">
          <Grid>
            <GridItem sm={12} md={2}>
              <Content
                component={ContentVariants.h4}
                className="access-requests-bold-text"
              >
                Account name
              </Content>
            </GridItem>
            <GridItem sm={12} md={10}>
              <Content component={ContentVariants.p}>
                {data.accountName}
              </Content>
            </GridItem>
          </Grid>
        </StackItem>
        <StackItem className="pf-v6-u-mb-md">
          <Grid>
            <GridItem sm={12} md={2}>
              <Content
                component={ContentVariants.h4}
                className="access-requests-bold-text"
              >
                Account number
              </Content>
            </GridItem>
            <GridItem sm={12} md={10}>
              <Content component={ContentVariants.p}>
                {data.accountNumber}
              </Content>
            </GridItem>
          </Grid>
        </StackItem>
        <StackItem>
          <Grid>
            <GridItem sm={12} md={2}>
              <Content
                component={ContentVariants.h4}
                className="access-requests-bold-text"
              >
                Access duration
              </Content>
            </GridItem>
          </Grid>
        </StackItem>
        <StackItem>
          <Grid>
            <GridItem sm={12} md={2}>
              <Content component={ContentVariants.h4}>From</Content>
            </GridItem>
            <GridItem sm={12} md={10}>
              <Content component={ContentVariants.p}>{data.accessFrom}</Content>
            </GridItem>
          </Grid>
        </StackItem>
        <StackItem className="pf-v6-u-mb-md">
          <Grid>
            <GridItem sm={12} md={2}>
              <Content component={ContentVariants.h4}>To</Content>
            </GridItem>
            <GridItem sm={12} md={10}>
              <Content component={ContentVariants.p}>{data.accessTo}</Content>
            </GridItem>
          </Grid>
        </StackItem>
        <StackItem>
          <Grid>
            <GridItem sm={12} md={2}>
              <Content
                component={ContentVariants.h4}
                className="access-requests-bold-text"
              >
                Roles
              </Content>
            </GridItem>
            <GridItem sm={12} md={10}>
              <Content component={ContentVariants.p}>
                {data.selectedRoles?.[0]}
              </Content>
            </GridItem>
          </Grid>
        </StackItem>
        {data.selectedRoles?.slice(1).map((role: string) => (
          <StackItem key={role}>
            <Grid>
              <GridItem sm={12} md={2}>
                <Content component={ContentVariants.h4}></Content>
              </GridItem>
              <GridItem sm={12} md={10}>
                <Content component={ContentVariants.p}>{role}</Content>
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
