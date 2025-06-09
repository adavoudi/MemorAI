"use client";
import { useState } from "react";
import { Flex, Heading, Text } from "@aws-amplify/ui-react";
import AudioPlayer from "@/components/review/AudioPlayer";
import SrsFeedback, { FeedbackLevel } from "@/components/review/SrsFeedback";

// Mock data for a single review session
const mockSession = {
  audioSrc: "/audio/mock-review.mp3", // Path to a dummy mp3 in your /public folder
  subtitles: [
    { text: "Good morning", start: 1, end: 2.5 },
    { text: "Guten Morgen", start: 3, end: 4.5 },
    { text: "Thank you", start: 5.5, end: 7 },
    { text: "Danke schön", start: 7.5, end: 9 },
  ],
  cardIds: ["c1", "c2"], // IDs of cards in this review
};

export default function PlayReviewPage({
  params,
}: {
  params: { fileId: string };
}) {
  const [isReviewComplete, setIsReviewComplete] = useState(false);

  // This would be called when the <audio> element's `onEnded` event fires
  // For simplicity, we'll simulate it after a delay in a real player component
  // In our AudioPlayer component, we could pass this function as a prop.
  const handleReviewComplete = () => setIsReviewComplete(true);

  const handleFeedback = (feedback: FeedbackLevel) => {
    // Fictional API call:
    // await submitSrsFeedback({ fileId: params.fileId, feedback: feedback });
    console.log(`Feedback submitted: ${feedback}`);
    alert(`Feedback "${feedback}" saved!`);
    // Maybe navigate away or show a summary
  };

  return (
    <Flex
      direction="column"
      gap="large"
      height="calc(100vh - 10rem)"
      justifyContent="center"
    >
      <Heading level={2} textAlign="center">
        Review Session
      </Heading>

      {/* Subtitle would be displayed inside the AudioPlayer */}

      {!isReviewComplete ? (
        <SrsFeedback onFeedbackSubmit={handleFeedback} />
      ) : (
        <Text>
          Listen to the audio. Feedback options will appear when it's done.
        </Text>
      )}

      {/* The AudioPlayer is fixed to the bottom of the screen */}
      <AudioPlayer
        audioSrc={mockSession.audioSrc}
        subtitles={mockSession.subtitles}
      />
    </Flex>
  );
}
