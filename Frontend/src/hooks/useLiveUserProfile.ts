import { useEffect, useState } from "react";
import { getUserProfile } from "@utils/index";

export const USER_PROFILE_CHANGED_EVENT = "rexi-user-profile-changed";

export const notifyUserProfileChanged = (user?: any) => {
  window.dispatchEvent(new CustomEvent(USER_PROFILE_CHANGED_EVENT, { detail: user || getUserProfile() }));
};

export const useLiveUserProfile = () => {
  const [user, setUser] = useState<any>(() => getUserProfile());

  useEffect(() => {
    const syncUser = () => {
      setUser(getUserProfile());
    };

    window.addEventListener(USER_PROFILE_CHANGED_EVENT, syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener(USER_PROFILE_CHANGED_EVENT, syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  return user;
};
