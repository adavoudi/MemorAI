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

export interface ReviewFile {
  id: string;
  phrases: string[]; // Just the front text for display
  cardCount: number;
  createdAt: string; // ISO date string
}

interface ReviewFileItemProps {
  file: ReviewFile;
}

export default function ReviewFileItem({ file }: ReviewFileItemProps) {
  const router = useRouter();

  return (
    <Card variation="outlined">
      <Flex direction="column" gap="medium">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading level={5}>
            Review Session from {new Date(file.createdAt).toLocaleDateString()}
          </Heading>
          <Badge variation="info">{file.cardCount} cards</Badge>
        </Flex>
        <Text isTruncated>Contains: {file.phrases.join(", ")}</Text>
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
