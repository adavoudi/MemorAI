"use client";

import { Card, Flex, Text, Button } from "@aws-amplify/ui-react";
import type { Schema } from "@/amplify/data/resource"; // Import the schema type

// Define the Card type from the generated schema
type CardData = Schema["Card"]["type"];

interface FlashcardProps {
  card: CardData;
  onEdit: (card: CardData) => void;
}

export default function Flashcard({ card, onEdit }: FlashcardProps) {
  return (
    <Card variation="outlined">
      <Flex justifyContent="space-between" alignItems="center">
        <Flex direction="column" gap="xs">
          <Text color="font.secondary">English</Text>
          {/* Use the correct property 'frontText' from the schema */}
          <Text fontSize="large" fontWeight="bold">
            {card.frontText}
          </Text>
        </Flex>
        <Flex direction="column" gap="xs" textAlign="right">
          <Text color="font.secondary">German</Text>
          {/* Use the correct property 'backText' from the schema */}
          <Text fontSize="large">{card.backText}</Text>
        </Flex>
        <Button variation="link" onClick={() => onEdit(card)}>
          Edit
        </Button>
      </Flex>
    </Card>
  );
}
