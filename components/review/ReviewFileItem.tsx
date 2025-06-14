"use client";

import {
  Card,
  Flex,
  Text,
  Badge,
  Button,
  Heading,
} from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import type { Schema } from "@/amplify/data/resource";

// Define the ReviewFile type from the generated schema
type ReviewFile = Schema["ReviewFile"]["type"];

interface ReviewFileItemProps {
  file: ReviewFile;
  // The deck name is passed from the parent component
  // because the file itself only contains the deckId.
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

  return (
    <Card variation="outlined">
      <Flex direction="column" gap="medium">
        <Flex justifyContent="space-between" alignItems="flex-start">
          <Flex direction="column">
            <Heading level={5}>{deckName}</Heading>
            <Text fontSize="small" color="font.secondary">
              Generated on {formattedDate}
            </Text>
          </Flex>
          <Badge variation={file.isListened ? "success" : "info"}>
            {file.isListened ? "Listened" : "Not Listened"}
          </Badge>
        </Flex>
        <Text>Contains {file.cardCount} cards</Text>
        <Button
          variation="primary"
          onClick={() => router.push(`/review/play/${file.id}`)}
        >
          Start Listening
        </Button>
      </Flex>
    </Card>
  );
}
