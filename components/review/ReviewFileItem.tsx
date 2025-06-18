"use client";

import {
  Card,
  Flex,
  Text,
  Badge,
  Button,
  Heading,
  Loader,
  View,
  Icon,
  Grid,
  Divider,
} from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import type { Schema } from "@/amplify/data/resource";
import { useState } from "react";
import { MdExpandMore, MdExpandLess } from "react-icons/md";

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
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Helper function to render text split by newlines
  const renderTextLines = (text: string | null | undefined) => {
    if (!text) return <Text color="font.tertiary">Not available</Text>;
    return text.split("\n").map((line, index) => (
      <Text key={index} as="p" fontSize="small">
        {line}
      </Text>
    ));
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

        {/* --- Start: New Collapsible Section --- */}
        {!isProcessing && (file.cardsFrontText || file.cardsBackText) && (
          <>
            <Divider />
            <View>
              <Button
                variation="link"
                onClick={() => setIsExpanded(!isExpanded)}
                padding="0"
              >
                <Flex alignItems="center">
                  <Text fontWeight="bold">
                    {isExpanded ? "Hide" : "Show"} Card Details
                  </Text>
                  <Icon as={isExpanded ? MdExpandLess : MdExpandMore} />
                </Flex>
              </Button>

              {isExpanded && (
                <Grid templateColumns="1fr 1fr" gap="large" marginTop="medium">
                  <Flex direction="column" gap="small">
                    <Heading level={6}>Fronts</Heading>
                    {renderTextLines(file.cardsFrontText)}
                  </Flex>
                  <Flex direction="column" gap="small">
                    <Heading level={6}>Backs</Heading>
                    {renderTextLines(file.cardsBackText)}
                  </Flex>
                </Grid>
              )}
            </View>
          </>
        )}
        {/* --- End: New Collapsible Section --- */}

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
