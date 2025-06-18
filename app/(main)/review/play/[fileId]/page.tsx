"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Flex,
  Heading,
  Text,
  Button,
  useTheme,
  Loader,
  Alert,
  View,
  Message, // Import the Message component
} from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import { downloadData, getUrl } from "aws-amplify/storage";
import { useRouter } from "next/navigation";

import AudioPlayer from "@/components/review/AudioPlayer";
import SrsFeedback, { FeedbackLevel } from "@/components/review/SrsFeedback";
import type { Schema } from "@/amplify/data/resource";
import { calculateSrsUpdate } from "@/utils/srs";
import "@/hooks/auth";

// --- Data Structures & Types ---
type FullCard = Schema["Card"]["type"];
interface PollyMark {
  time: number;
  type: "sentence" | "word";
  value: string;
}
interface TimedSubtitle {
  cardId: string;
  side: "front" | "back";
  text: string;
  start: number;
  end: number;
}
interface ReviewCard {
  id: string;
  front: string;
  back: string;
}
interface ReviewSessionData {
  audioSrc: string;
  cards: ReviewCard[];
  subtitles: TimedSubtitle[];
}

// --- Amplify Client & Helper Functions (No Changes) ---
const client = generateClient<Schema>();
// (parseCardData and mapPollyMarksToSubtitles functions remain the same)
const parseCardData = (
  cardIds: string[],
  frontText: string,
  backText: string
): ReviewCard[] => {
  const frontTexts = frontText.split("\n");
  const backTexts = backText.split("\n");
  if (
    cardIds.length !== frontTexts.length ||
    cardIds.length !== backTexts.length
  ) {
    console.error("Mismatch in card data arrays.");
    return [];
  }
  return cardIds.map((id, index) => ({
    id,
    front: frontTexts[index],
    back: backTexts[index],
  }));
};
const mapPollyMarksToSubtitles = (
  pollyMarksText: string,
  cards: ReviewCard[]
): TimedSubtitle[] => {
  const pollyMarks: PollyMark[] = pollyMarksText
    .split("\n")
    .filter((l) => l.trim() !== "")
    .map((l) => JSON.parse(l));
  const relevantMarks = pollyMarks.filter((mark) => mark.type === "sentence");
  const cardSideQueue: {
    cardId: string;
    side: "front" | "back";
    text: string;
  }[] = [];
  cards.forEach((card) => {
    cardSideQueue.push({ cardId: card.id, side: "front", text: card.front });
    cardSideQueue.push({ cardId: card.id, side: "back", text: card.back });
  });
  let nextCardSideIndex = 0;
  return relevantMarks.map((currentMark, i) => {
    const expectedCardSide = cardSideQueue[nextCardSideIndex];
    let cardId = `system-${i}`;
    let side: "front" | "back" = "front";
    if (
      expectedCardSide &&
      currentMark.value.trim() === expectedCardSide.text.trim()
    ) {
      cardId = expectedCardSide.cardId;
      side = expectedCardSide.side;
      nextCardSideIndex++;
    }
    const startTime = currentMark.time / 1000;
    const endTime =
      i + 1 < relevantMarks.length
        ? relevantMarks[i + 1].time / 1000
        : startTime + 5;
    return {
      cardId,
      side,
      text: currentMark.value,
      start: startTime,
      end: endTime,
    };
  });
};

export default function PlayReviewPage({
  params,
}: {
  params: { fileId: string };
}) {
  const { tokens } = useTheme();
  const router = useRouter();

  // --- State Variables ---
  const [sessionData, setSessionData] = useState<ReviewSessionData | null>(
    null
  );
  const [fullCards, setFullCards] = useState<FullCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null); // For permanent page errors

  const [currentTime, setCurrentTime] = useState(0);
  const [isReviewComplete, setIsReviewComplete] = useState(false);
  const [feedback, setFeedback] = useState<{ [cardId: string]: FeedbackLevel }>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- NEW: State for toast message ---
  const [toast, setToast] = useState<{
    message: string;
    colorTheme: "success" | "error";
  } | null>(null);

  // Pagination state (no changes)
  const [currentPage, setCurrentPage] = useState(0);
  const SUBTITLES_PER_PAGE = 10;

  // --- Effects ---

  // NEW: Effect to clear the toast message after a delay
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000); // Hide after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Other effects (useMemo, useEffect for pagination, useEffect for data fetching) remain the same...
  const pagedSubtitles = useMemo(() => {
    if (!sessionData?.subtitles) return [];
    const subtitles = sessionData.subtitles;
    const pages = [];
    for (let i = 0; i < subtitles.length; i += SUBTITLES_PER_PAGE) {
      pages.push(subtitles.slice(i, i + SUBTITLES_PER_PAGE));
    }
    return pages;
  }, [sessionData?.subtitles]);

  useEffect(() => {
    if (!sessionData?.subtitles || sessionData.subtitles.length === 0) return;
    const activeIndex = sessionData.subtitles.findIndex(
      (sub) => currentTime >= sub.start && currentTime < sub.end
    );
    if (activeIndex !== -1) {
      const newCurrentPage = Math.floor(activeIndex / SUBTITLES_PER_PAGE);
      if (newCurrentPage !== currentPage) setCurrentPage(newCurrentPage);
    }
  }, [currentTime, sessionData?.subtitles, currentPage]);

  useEffect(() => {
    const fetchReviewData = async () => {
      if (!params.fileId) {
        setPageError("No file ID provided.");
        setIsLoading(false);
        return;
      }
      try {
        const { data: reviewFile } = await client.models.ReviewFile.get({
          id: params.fileId,
        });
        if (!reviewFile || !reviewFile.s3Path || !reviewFile.subtitleS3Path) {
          throw new Error("Review file or its paths not found.");
        }
        const cardResults = await Promise.all(
          (reviewFile.cardIds as string[]).map((id) =>
            client.models.Card.get({ cardId: id })
          )
        );
        const fetchedCards = cardResults
          .map((res) => res.data)
          .filter(Boolean) as FullCard[];
        setFullCards(fetchedCards);
        const uiCards = fetchedCards.map((c) => ({
          id: c.cardId,
          front: c.frontText,
          back: c.backText,
        }));
        const [audioUrlResult, subtitlesTextResult] = await Promise.all([
          getUrl({ path: reviewFile.s3Path }),
          downloadData({ path: reviewFile.subtitleS3Path }).result,
        ]);
        const subtitlesText = await subtitlesTextResult.body.text();
        const subtitles = mapPollyMarksToSubtitles(subtitlesText, uiCards);
        setSessionData({
          audioSrc: audioUrlResult.url.toString(),
          cards: uiCards,
          subtitles,
        });
      } catch (err: any) {
        console.error("Error fetching review data:", err);
        setPageError(err.message || "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviewData();
  }, [params.fileId]);

  const handleFeedbackSelect = (cardId: string, level: FeedbackLevel) => {
    setFeedback((prev) => ({ ...prev, [cardId]: level }));
  };

  // --- UPDATED: handleSubmitAllFeedback ---
  const handleSubmitAllFeedback = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const updatePromises = [];
      for (const cardId in feedback) {
        const level = feedback[cardId];
        const originalCard = fullCards.find((c) => c.cardId === cardId);
        if (originalCard) {
          const updates = calculateSrsUpdate(level, originalCard);
          updatePromises.push(
            client.models.Card.update({
              cardId: originalCard.cardId,
              ...updates,
            })
          );
        }
      }
      updatePromises.push(
        client.models.ReviewFile.update({
          id: params.fileId,
          isListened: true,
          lastListenedAt: new Date().toISOString(),
        })
      );

      await Promise.all(updatePromises);

      // Show success message instead of alert
      setToast({
        message: "Feedback saved successfully!",
        colorTheme: "success",
      });

      // Navigate away after a short delay to allow user to see the message
      setTimeout(() => router.push("/review"), 1500);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      // Show error message instead of alert
      setToast({
        message: "Failed to save feedback. Please try again.",
        colorTheme: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---
  if (isLoading) {
    return (
      <Flex justifyContent="center" alignItems="center" minHeight="50vh">
        <Loader size="large" />
      </Flex>
    );
  }
  if (pageError) {
    return (
      <Alert variation="error" isDismissible={false}>
        {pageError}
      </Alert>
    );
  }
  if (!sessionData) {
    return <Text>No session data available.</Text>;
  }

  const canSubmit = sessionData.cards.length === Object.keys(feedback).length;

  return (
    <Flex direction="column" gap="large" paddingBottom="10rem">
      <Heading level={2} textAlign="center">
        {isReviewComplete ? "Review Your Cards" : "Listen and Read Along"}
      </Heading>

      {/* Main content views (no changes) */}
      {!isReviewComplete ? (
        <View
          minHeight="200px"
          padding="large"
          border={`1px solid ${tokens.colors.border.secondary}`}
          borderRadius="medium"
          backgroundColor="background.secondary"
        >
          {pagedSubtitles.length > 0 && pagedSubtitles[currentPage] ? (
            <Flex direction="column" gap="medium" as="article">
              {pagedSubtitles[currentPage].map((sub, index) => {
                const isActive =
                  currentTime >= sub.start && currentTime < sub.end;
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
                  >
                    {sub.text}
                  </Text>
                );
              })}
            </Flex>
          ) : (
            <Text>Loading subtitles...</Text>
          )}
        </View>
      ) : (
        <Flex direction="column" gap="large">
          {sessionData.cards.map((card) => (
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
                currentSelection={feedback[card.id]}
              />
            </Flex>
          ))}
          <Button
            variation="primary"
            size="large"
            onClick={handleSubmitAllFeedback}
            isDisabled={!canSubmit || isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit All Feedback"}
          </Button>
        </Flex>
      )}

      {!isReviewComplete && (
        <AudioPlayer
          audioSrc={sessionData.audioSrc}
          onTimeUpdate={setCurrentTime}
          onEnded={() => setIsReviewComplete(true)}
        />
      )}

      {/* --- NEW: Toast Message Display --- */}
      {toast && (
        <View
          position="fixed"
          bottom="8rem" // Positioned above the audio player
          left="50%"
          transform="translateX(-50%)"
          // zIndex={100} // Ensure it's on top
        >
          <Message
            variation="filled"
            colorTheme={toast.colorTheme}
            onDismiss={() => setToast(null)}
          >
            {toast.message}
          </Message>
        </View>
      )}
    </Flex>
  );
}
