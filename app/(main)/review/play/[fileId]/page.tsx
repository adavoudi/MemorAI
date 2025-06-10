"use client";
import { useState } from "react";
import { Flex, Heading, Text, Button, useTheme } from "@aws-amplify/ui-react";
import AudioPlayer from "@/components/review/AudioPlayer";
import SrsFeedback, { FeedbackLevel } from "@/components/review/SrsFeedback";
import { FlashcardData } from "@/components/deck/Flashcard";
import "@/hooks/auth";

// --- Enhanced Mock Data Structure ---
// Each subtitle is now linked to a card and its side (front/back)
interface TimedSubtitle {
  cardId: string;
  side: "front" | "back";
  text: string;
  start: number; // in seconds
  end: number;
}
interface ReviewCard extends FlashcardData {}

const mockSession = {
  audioSrc: "/audio/mock-review.mp3", // Make sure you have a dummy mp3 in your /public/audio folder
  cards: [
    { id: "c1", front: "Good morning", back: "Guten Morgen" },
    { id: "c2", front: "Thank you", back: "Danke schön" },
  ],
  subtitles: [
    { cardId: "c1", side: "front", text: "Good morning", start: 1, end: 2.5 },
    { cardId: "c1", side: "back", text: "Guten Morgen", start: 3, end: 4.5 },
    { cardId: "c2", side: "front", text: "Thank you", start: 5.5, end: 7 },
    { cardId: "c2", side: "back", text: "Danke schön", start: 7.5, end: 9 },
  ] as TimedSubtitle[],
};
// --- End Mock Data ---

export default function PlayReviewPage({
  params,
}: {
  params: { fileId: string };
}) {
  const { tokens } = useTheme();
  const [currentTime, setCurrentTime] = useState(0);
  const [isReviewComplete, setIsReviewComplete] = useState(false);
  const [feedback, setFeedback] = useState<{ [cardId: string]: FeedbackLevel }>(
    {}
  );

  const handleFeedbackSelect = (cardId: string, level: FeedbackLevel) => {
    setFeedback((prev) => ({
      ...prev,
      [cardId]: level,
    }));
  };

  const handleSubmitAllFeedback = () => {
    // Fictional API call
    console.log("Submitting all feedback:", feedback);
    alert("Feedback saved successfully!");
    // Optionally navigate away, e.g., router.push('/review');
  };

  const canSubmit = mockSession.cards.length === Object.keys(feedback).length;

  return (
    <Flex direction="column" gap="large" paddingBottom="10rem">
      {" "}
      {/* Padding to avoid overlap with player */}
      <Heading level={2} textAlign="center">
        {isReviewComplete ? "Review Your Cards" : "Listen and Read Along"}
      </Heading>
      {/* --- Conditional Rendering: Listening View vs. Feedback View --- */}
      {!isReviewComplete ? (
        // 1. Listening View: Display all text and highlight the active part
        <Flex direction="column" gap="medium" as="article">
          {mockSession.subtitles.map((sub, index) => {
            const isActive = currentTime >= sub.start && currentTime < sub.end;
            return (
              <Text
                key={index}
                fontSize="large"
                textAlign={sub.side === "front" ? "left" : "right"}
                color={
                  isActive
                    ? tokens.colors.font.primary
                    : tokens.colors.font.tertiary
                }
                fontWeight={isActive ? "bold" : "normal"}
                // transition="color 0.2s ease-in-out"
              >
                {sub.text}
              </Text>
            );
          })}
        </Flex>
      ) : (
        // 2. Feedback View: Show each card and its feedback component
        <Flex direction="column" gap="large">
          {mockSession.cards.map((card) => (
            <Flex
              key={card.id}
              direction="column"
              gap="medium"
              padding="medium"
              border={`1px solid ${tokens.colors.border.secondary}`}
              borderRadius="medium"
            >
              <Flex justifyContent="space-between">
                <Text fontWeight="bold">{card.front}</Text>
                <Text>{card.back}</Text>
              </Flex>
              <SrsFeedback
                onFeedbackSubmit={(level) =>
                  handleFeedbackSelect(card.id, level)
                }
                currentSelection={feedback[card.id]} // Pass current selection for visual state
              />
            </Flex>
          ))}
          <Button
            variation="primary"
            size="large"
            onClick={handleSubmitAllFeedback}
            isDisabled={!canSubmit}
          >
            Submit All Feedback
          </Button>
        </Flex>
      )}
      {/* The player is always present until feedback is submitted */}
      {!isReviewComplete && (
        <AudioPlayer
          audioSrc={mockSession.audioSrc}
          onTimeUpdate={setCurrentTime}
          onEnded={() => setIsReviewComplete(true)}
        />
      )}
    </Flex>
  );
}
