"use client";

import { useEffect, useState } from "react";
import { Collection, Loader, Text, Heading } from "@aws-amplify/ui-react";
import DeckCard from "./DeckCard";
// import { listDecks } from '@/utils/api'; // Fictional API utility

// Mock data and type for demonstration
export interface Deck {
  id: string;
  name: string;
  cardCount: number;
  createdAt: string;
}

const mockDecks: Deck[] = [
  { id: "1", name: "Business Travel", cardCount: 25, createdAt: "2025-06-01" },
  {
    id: "2",
    name: "Restaurant Phrases",
    cardCount: 42,
    createdAt: "2025-05-15",
  },
  {
    id: "3",
    name: "Everyday Greetings",
    cardCount: 15,
    createdAt: "2025-04-20",
  },
];

export default function DeckList() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDecks = async () => {
      setIsLoading(true);
      // Fictional API call:
      // const userDecks = await listDecks();
      // setDecks(userDecks);
      setTimeout(() => {
        // Simulating network delay
        setDecks(mockDecks);
        setIsLoading(false);
      }, 1000);
    };
    fetchDecks();
  }, []);

  const handleDeleteDeck = (deckId: string) => {
    // Fictional API call: await deleteDeck(deckId);
    setDecks(decks.filter((deck) => deck.id !== deckId));
    console.log(`Deleted deck ${deckId}`);
  };

  if (isLoading) {
    return <Loader size="large" />;
  }

  if (decks.length === 0) {
    return (
      <Text>
        You haven't created any decks yet. Start by searching for a phrase!
      </Text>
    );
  }

  return (
    <>
      <Heading level={2} marginBottom="large">
        My Decks
      </Heading>
      <Collection
        type="list"
        items={decks}
        gap="medium"
        direction={{ base: "column", large: "row" }}
        wrap="wrap"
        justifyContent="flex-start"
      >
        {(item, index) => (
          <DeckCard key={index} deck={item} onDelete={handleDeleteDeck} />
        )}
      </Collection>
    </>
  );
}
