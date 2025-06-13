"use client";

import Link from "next/link";
import {
  Card,
  Flex,
  Heading,
  Text,
  Button,
  Icon,
  Divider,
} from "@aws-amplify/ui-react";
import { MdDelete, MdArrowForward } from "react-icons/md";
import type { Schema } from "@/amplify/data/resource"; // Import the schema type

// Define the Deck type based on the schema for props
type Deck = Schema["Deck"]["type"];

interface DeckCardProps {
  deck: Deck;
  onDelete: (deckId: string) => void;
}

export default function DeckCard({ deck, onDelete }: DeckCardProps) {
  // Format the creation date for display
  const createdAtDate = new Date(deck.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card variation="elevated" width={{ base: "100%", large: "350px" }}>
      <Flex direction="column" gap="small">
        <Heading level={4}>{deck.name}</Heading>
        {/* The live Deck model doesn't have a direct 'cardCount'.
            Instead, we can show other useful info like the creation date. */}
        <Text color="font.secondary" fontSize="small">
          Created on {createdAtDate}
        </Text>
        <Divider marginBlock="small" />
        <Flex justifyContent="space-between" alignItems="center">
          <Link href={`/deck/${deck.id}`} passHref legacyBehavior>
            <Button variation="primary">
              View Deck
              <Icon as={MdArrowForward} />
            </Button>
          </Link>
          <Button
            variation="destructive"
            onClick={() => onDelete(deck.id)}
            aria-label={`Delete deck ${deck.name}`}
          >
            <Icon as={MdDelete} />
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
