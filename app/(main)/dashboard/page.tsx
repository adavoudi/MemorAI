"use client";

import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Heading, Flex } from "@aws-amplify/ui-react";
import StatsCard from "@/components/dashboard/StatsCard";
import ProgressChart from "@/components/dashboard/ProgressChart";
import { FaBook, FaFire, FaCheckCircle } from "react-icons/fa";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "@/hooks/auth";

// Initialize the Amplify Data client
const client = generateClient<Schema>();

export default function DashboardPage() {
  const { user } = useAuthenticator((context) => [context.user]);

  // State to hold the fetched data
  const [firstName, setFirstName] = useState("there");
  const [deckCount, setDeckCount] = useState(0);
  const [learnedCardsCount, setLearnedCardsCount] = useState(0);
  const [reviewsToday, setReviewsToday] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      // Fetch user profile to get the first name
      const userProfilePromise = client.models.User.get({ owner: user.userId });

      // Fetch all decks for the user to get a count
      const decksPromise = client.models.Deck.list({
        filter: { owner: { eq: user.userId } },
      });

      // Fetch "learned" cards (e.g., interval > 21 days)
      const learnedCardsPromise = client.models.Card.list({
        filter: {
          owner: { eq: user.userId },
          srsInterval: { gt: 21 },
        },
      });

      // Fetch today's stats for the "Reviews Today" card
      const today = new Date().toISOString().split("T")[0];
      const todayStatsPromise = client.models.DailyStats.get({
        owner: user.userId,
        date: today,
      });

      // Run all promises concurrently for better performance
      const [
        userProfileResult,
        decksResult,
        learnedCardsResult,
        todayStatsResult,
      ] = await Promise.all([
        userProfilePromise,
        decksPromise,
        learnedCardsPromise,
        todayStatsPromise,
      ]);

      if (userProfileResult.data) {
        setFirstName(userProfileResult.data.firstName);
      }
      setDeckCount(decksResult.data.length);
      setLearnedCardsCount(learnedCardsResult.data.length);
      if (todayStatsResult.data) {
        setReviewsToday(todayStatsResult.data.reviewsCompleted);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <Flex direction="column" gap="large">
      <Heading level={2}>Welcome back, {firstName}!</Heading>

      <Flex gap="medium" wrap="wrap">
        <StatsCard
          title="Cards Learned"
          value={learnedCardsCount}
          icon={FaCheckCircle}
        />
        <StatsCard title="Reviews Today" value={reviewsToday} icon={FaFire} />
        <StatsCard title="Decks" value={deckCount} icon={FaBook} />
      </Flex>

      <ProgressChart />
    </Flex>
  );
}
