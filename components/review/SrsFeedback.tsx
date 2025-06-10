"use client";

import { Flex, Button } from "@aws-amplify/ui-react";

export type FeedbackLevel = "Again" | "Hard" | "Good" | "Easy";

interface SrsFeedbackProps {
  onFeedbackSubmit: (feedback: FeedbackLevel) => void;
  currentSelection?: FeedbackLevel; // Optional prop for visual feedback
}

export default function SrsFeedback({
  onFeedbackSubmit,
  currentSelection,
}: SrsFeedbackProps) {
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
    <Flex gap="medium" justifyContent="center">
      {feedbackOptions.map(({ level, variation }) => (
        <Button
          key={level}
          // Use 'menu' variation for selected, or keep its original color
          // variation={currentSelection === level ? 'menu' : variation}
          // You could also manage opacity or borders for a different effect
          style={{
            opacity: currentSelection && currentSelection !== level ? 0.5 : 1,
          }}
          onClick={() => onFeedbackSubmit(level)}
        >
          {level}
        </Button>
      ))}
    </Flex>
  );
}
