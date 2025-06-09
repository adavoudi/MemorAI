"use client";

import { Card, Flex, Text, Button } from "@aws-amplify/ui-react";

export interface FlashcardData {
  id: string;
  front: string; // e.g., English
  back: string; // e.g., German
}

interface FlashcardProps {
  card: FlashcardData;
  onEdit: (card: FlashcardData) => void;
}

export default function Flashcard({ card, onEdit }: FlashcardProps) {
  return (
    <Card variation="outlined">
      <Flex justifyContent="space-between" alignItems="center">
        <Flex direction="column" gap="xs">
          <Text color="font.secondary">English</Text>
          <Text fontSize="large" fontWeight="bold">
            {card.front}
          </Text>
        </Flex>
        <Flex direction="column" gap="xs" textAlign="right">
          <Text color="font.secondary">German</Text>
          <Text fontSize="large">{card.back}</Text>
        </Flex>
        <Button variation="link" onClick={() => onEdit(card)}>
          Edit
        </Button>
      </Flex>
    </Card>
  );
}
