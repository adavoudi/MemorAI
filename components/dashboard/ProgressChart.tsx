"use client";

import { useEffect, useState } from "react";
import { Flex, useAuthenticator } from "@aws-amplify/ui-react";
import { Card, Heading, Loader, Text, View } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Initialize the Amplify Data client
const client = generateClient<Schema>();

interface ChartData {
  name: string;
  reviews: number;
}

export default function ProgressChart() {
  const { user } = useAuthenticator((context) => [context.user]);
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchChartData = async () => {
      setIsLoading(true);

      // Get the date for 7 days ago in YYYY-MM-DD format
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Include today, so go back 6 days
      const startDate = sevenDaysAgo.toISOString().split("T")[0];

      // Fetch the last 7 days of stats for the current user
      const { data: dailyStats, errors } = await client.models.DailyStats.list({
        filter: {
          owner: { eq: user.userId },
          date: { ge: startDate }, // 'ge' means greater than or equal to
        },
      });

      if (errors) {
        console.error("Failed to fetch daily stats:", errors);
        setIsLoading(false);
        return;
      }

      // Format the data for the chart
      const formattedData = dailyStats
        .map((stat) => ({
          // Convert '2025-06-13' to 'Fri'
          name: new Date(`${stat.date}T00:00:00`).toLocaleDateString("en-US", {
            weekday: "short",
          }),
          reviews: stat.reviewsCompleted,
        }))
        .sort(
          (a, b) => new Date(a.name).getTime() - new Date(b.name).getTime()
        ); // Ensure correct order

      // To ensure we always show 7 days, we can fill in missing days with 0 reviews
      const fullWeekData: ChartData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const statForDay = formattedData.find((d) => d.name === dayName);
        fullWeekData.push({
          name: dayName,
          reviews: statForDay ? statForDay.reviews : 0,
        });
      }

      setData(fullWeekData);
      setIsLoading(false);
    };

    fetchChartData();
  }, [user]);

  return (
    <Card variation="outlined" padding="large">
      <Heading level={4} marginBottom="medium">
        Reviews This Week
      </Heading>
      {isLoading ? (
        <Flex height="300px" justifyContent="center" alignItems="center">
          <Loader size="large" />
        </Flex>
      ) : data.length === 0 ? (
        <Flex height="300px" justifyContent="center" alignItems="center">
          <Text>No review data available for this week.</Text>
        </Flex>
      ) : (
        <View height="300px" width="100%">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="reviews"
                stroke="#8884d8"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </View>
      )}
    </Card>
  );
}
