"use client";

import {
  Card,
  Flex,
  Text,
  Badge,
  Button,
  Heading,
  Loader,
} from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import type { Schema } from "@/amplify/data/resource";

// Define the ReviewFile type from the generated schema
type ReviewFile = Schema["ReviewFile"]["type"];

interface ReviewFileItemProps {
  file: ReviewFile;
  deckName: string;
}

export default function ReviewFileItem({
  file,
  deckName,
}: ReviewFileItemProps) {
  const router = useRouter();

  const formattedDate = new Date(file.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Determine if the file is still being processed
  const isProcessing = file.statusCode && file.statusCode !== "ready";

  const getStatusBadge = () => {
    if (!file.statusCode || file.statusCode === "ready") {
      return (
        <Badge variation={file.isListened ? "success" : "info"}>
          {file.isListened ? "Listened" : "Not Listened"}
        </Badge>
      );
    }
    switch (file.statusCode) {
      case "error":
        return <Badge variation="error">Error</Badge>;
      case "pending":
      case "processing":
        return <Badge variation="warning">Processing</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card variation="outlined" opacity={isProcessing ? 0.7 : 1}>
      <Flex direction="column" gap="medium">
        <Flex justifyContent="space-between" alignItems="flex-start">
          <Flex direction="column">
            <Heading level={5}>{deckName}</Heading>
            <Text fontSize="small" color="font.secondary">
              Generated on {formattedDate}
            </Text>
          </Flex>
          {getStatusBadge()}
        </Flex>

        {/* Conditionally render status or card count */}
        {isProcessing ? (
          <Flex direction="column" gap="small">
            <Flex alignItems="center" gap="small">
              <Loader size="small" />
              <Text fontWeight="bold" textTransform="capitalize">
                {file.statusCode}
              </Text>
            </Flex>
            {file.statusMessage && (
              <Text fontSize="small" color="font.secondary">
                {file.statusMessage}
              </Text>
            )}
          </Flex>
        ) : (
          <Text>Contains {file.cardCount} cards</Text>
        )}

        <Button
          variation="primary"
          onClick={() => router.push(`/review/play/${file.id}`)}
          // Disable the button if the file is not ready
          disabled={isProcessing as boolean}
        >
          Start Listening
        </Button>
      </Flex>
    </Card>
  );
}
