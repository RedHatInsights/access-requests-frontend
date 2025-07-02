import React from 'react';

interface UseInputHelpProps {
  headerContent?: React.ReactElement | null;
  bodyContent?: React.ReactElement | null;
  field?: string;
}

interface UseInputHelpReturn {
  ariaLabel: string;
  popoverProps: {
    headerContent: React.ReactElement | null;
    bodyContent: React.ReactElement | null;
  };
  buttonProps: {
    type: 'button';
    'aria-label': string;
    onClick: (e: React.MouseEvent) => void;
    'aria-describedby': string;
    className: string;
  };
}

export const useInputHelp = ({
  headerContent = null,
  bodyContent = null,
  field = 'input',
}: UseInputHelpProps): UseInputHelpReturn => {
  const ariaLabel = `More info for ${field}`;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return {
    ariaLabel,
    popoverProps: {
      headerContent,
      bodyContent,
    },
    buttonProps: {
      type: 'button' as const,
      'aria-label': ariaLabel,
      onClick: handleClick,
      'aria-describedby': 'form-name',
      className: 'pf-v5-c-form__group-label-help',
    },
  };
};
