"use client";

import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

/**
 * This hook checks if a logged-in user has created their profile.
 * If not, it redirects them to the root onboarding page ('/').
 * @returns {boolean} isChecking - True while the check is in progress.
 */
export function useProfileCheck() {
  const { user, authStatus } = useAuthenticator((context) => [
    context.user,
    context.authStatus,
  ]);
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setIsChecking(false);
      return;
    }

    const checkProfile = async () => {
      if (!user?.userId) return;

      const { data: userProfile } = await client.models.User.get({
        owner: user.userId,
      });

      if (!userProfile) {
        // NO profile exists. Force the user back to the root page to complete onboarding.
        router.replace("/");
      } else {
        // Profile exists, user can proceed.
        setIsChecking(false);
      }
    };

    checkProfile();
  }, [user, authStatus, router]);

  return { isChecking };
}
