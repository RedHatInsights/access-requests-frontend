import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useEffect, useState } from 'react';

export interface UserData {
  ready: boolean;
  isInternal?: boolean;
  isOrgAdmin?: boolean;
}

const useUserData = () => {
  const chrome = useChrome();
  const [userData, setUserData] = useState<UserData>({
    ready: false,
    isInternal: true,
  });

  useEffect(() => {
    if (chrome && !userData.ready)
      chrome.auth.getUser().then((user) => {
        setUserData({
          ready: true,
          isInternal: user?.identity?.user?.is_internal,
          isOrgAdmin: user?.identity?.user?.is_org_admin,
        });
      });
  }, [chrome, userData.ready]);

  return userData;
};

export default useUserData;
