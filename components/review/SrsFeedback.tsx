"use client";

import { Flex, Button, Heading } from "@aws-amplify/ui-react";

export type FeedbackLevel = "Again" | "Hard" | "Good" | "Easy";

interface SrsFeedbackProps {
  onFeedbackSubmit: (feedback: FeedbackLevel) => void;
}

export default function SrsFeedback({ onFeedbackSubmit }: SrsFeedbackProps) {
  const feedbackOptions: {
    level: FeedbackLevel;
    variation: "destructive" | "warning" | "primary" | "success";
  }[] = [
    { level: "Again", variation: "destructive" },
    { level: "Hard", variation: "warning" },
    { level: "Good", variation: "primary" },
    { level: "Easy", variation: "success" },
  ];

  return (
    <Flex direction="column" alignItems="center" gap="medium">
      <Heading level={4}>How well did you remember?</Heading>
      <Flex gap="medium">
        {feedbackOptions.map(({ level, variation }) => (
          <Button
            key={level}
            // variation={variation}
            onClick={() => onFeedbackSubmit(level)}
          >
            {level}
          </Button>
        ))}
      </Flex>
    </Flex>
  );
}
