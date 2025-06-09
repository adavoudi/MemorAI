"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { Heading, Flex } from "@aws-amplify/ui-react";
import StatsCard from "@/components/dashboard/StatsCard";
import ProgressChart from "@/components/dashboard/ProgressChart";
import { FaBook, FaFire, FaCheckCircle } from "react-icons/fa";

export default function DashboardPage() {
  const { user } = useAuthenticator();

  const firstName = user.signInDetails?.loginId || "there";

  return (
    <Flex direction="column" gap="large">
      <Heading level={2}>Welcome back, {firstName}!</Heading>

      <Flex gap="medium" wrap="wrap">
        <StatsCard title="Cards Learned" value={128} icon={FaCheckCircle} />
        <StatsCard title="Current Streak" value={"12 Days"} icon={FaFire} />
        <StatsCard title="Decks" value={3} icon={FaBook} />
      </Flex>

      <ProgressChart />
    </Flex>
  );
}
