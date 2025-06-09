"use client";
import { Button, Flex, Heading, Collection } from "@aws-amplify/ui-react";
import ReviewFileItem, { ReviewFile } from "@/components/review/ReviewFileItem";

const mockReviewFiles: ReviewFile[] = [
  {
    id: "rf1",
    phrases: ["Good morning", "Thank you", "How are you?", "My name is..."],
    cardCount: 7,
    createdAt: "2025-06-09T10:00:00Z",
  },
  {
    id: "rf2",
    phrases: [
      "Where is the station?",
      "A ticket, please.",
      "Is this seat free?",
    ],
    cardCount: 8,
    createdAt: "2025-06-08T11:30:00Z",
  },
];

export default function ReviewPage() {
  const handleGenerate = () => {
    // Fictional API call
    console.log("Generating today's review files...");
    alert("Generation started! The files will appear here shortly.");
  };

  return (
    <Flex direction="column" gap="large">
      <Flex justifyContent="space-between" alignItems="center">
        <Heading level={2}>Daily Review</Heading>
        <Button variation="primary" onClick={handleGenerate}>
          Generate Today's Files
        </Button>
      </Flex>
      <Heading level={4}>Available Sessions</Heading>
      <Collection type="list" items={mockReviewFiles} gap="medium">
        {(item, index) => <ReviewFileItem key={index} file={item} />}
      </Collection>
    </Flex>
  );
}
