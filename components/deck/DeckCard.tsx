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
import { Deck } from "./DeckList"; // Re-using the type

interface DeckCardProps {
  deck: Deck;
  onDelete: (deckId: string) => void;
}

export default function DeckCard({ deck, onDelete }: DeckCardProps) {
  return (
    <Card variation="elevated" width={{ base: "100%", large: "350px" }}>
      <Flex direction="column" gap="small">
        <Heading level={4}>{deck.name}</Heading>
        <Text color="font.secondary">{deck.cardCount} cards</Text>
        <Divider />
        <Flex justifyContent="space-between" alignItems="center">
          <Link href={`/deck/${deck.id}`} passHref legacyBehavior>
            <Button variation="primary">
              View Deck
              <Icon as={MdArrowForward} />
            </Button>
          </Link>
          <Button variation="destructive" onClick={() => onDelete(deck.id)}>
            <Icon as={MdDelete} />
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
