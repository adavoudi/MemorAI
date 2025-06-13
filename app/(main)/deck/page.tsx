"use client";

import { useEffect, useState, MouseEvent } from "react";
import {
  Collection,
  Text,
  Heading,
  Flex,
  Card,
  TextField,
  Button,
  View,
  useTheme,
} from "@aws-amplify/ui-react";
import DeckCard from "@/components/deck/DeckCard";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "@/hooks/auth";

// Initialize the Amplify Data client
const client = generateClient<Schema>();

// Define the Deck type based on your schema
type Deck = Schema["Deck"]["type"];

export default function DecksPage() {
  const { user } = useAuthenticator((context) => [context.user]);
  const { tokens } = useTheme();
  const [decks, setDecks] = useState<Deck[]>([]);

  // State for the new deck modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Use observeQuery for a real-time, auto-updating list of decks
  useEffect(() => {
    if (!user) return;

    const sub = client.models.Deck.observeQuery().subscribe({
      next: ({ items }) => {
        const sortedDecks = [...items].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setDecks(sortedDecks);
      },
      error: (error) => console.warn(error),
    });

    // Cleanup subscription on component unmount
    return () => sub.unsubscribe();
  }, [user]);

  const handleCreateDeck = async () => {
    const output = await client.queries.translate({ inputText: "hey there!" });
    console.log("Translated:", output);
    if (!newDeckName.trim() || !user) return;

    setIsCreating(true);
    try {
      await client.models.Deck.create({
        name: newDeckName,
        owner: user.userId,
      });
      setNewDeckName(""); // Clear input
      setIsModalOpen(false); // Close modal on success
    } catch (error) {
      console.error("Error creating deck:", error);
    }
    setIsCreating(false);
  };

  const handleDeleteDeck = async (deckId: string) => {
    try {
      await client.models.Deck.delete({ id: deckId });
    } catch (error) {
      console.error("Error deleting deck:", error);
    }
  };

  const stopPropagation = (e: MouseEvent) => e.stopPropagation();

  return (
    <Flex direction="column" gap="xlarge">
      <Flex justifyContent="space-between" alignItems="center">
        <Heading level={2}>My Decks</Heading>
        <Button variation="primary" onClick={() => setIsModalOpen(true)}>
          Create New Deck
        </Button>
      </Flex>

      {decks.length === 0 ? (
        <Text>
          You haven't created any decks yet. Create one above to get started!
        </Text>
      ) : (
        <Collection
          type="list"
          items={decks}
          gap="medium"
          direction="row"
          wrap="wrap"
          justifyContent="flex-start"
        >
          {(item) => (
            <DeckCard
              key={item.id}
              deck={item}
              onDelete={() => handleDeleteDeck(item.id)}
            />
          )}
        </Collection>
      )}

      {/* Modal for Creating a New Deck */}
      {isModalOpen && (
        <View
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          backgroundColor={tokens.colors.overlay["50"]}
          onClick={() => setIsModalOpen(false)}
          display="flex"
          // justifyContent="center"
          // alignItems="center"
          // zIndex={100}
        >
          <Card
            variation="elevated"
            width={{ base: "90%", medium: "500px" }}
            padding={tokens.space.large}
            onClick={stopPropagation}
          >
            <Flex
              as="form"
              direction="column"
              gap="medium"
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateDeck();
              }}
            >
              <Heading level={4}>Create a New Deck</Heading>
              <TextField
                label="Deck Name"
                placeholder="e.g., 'German Idioms'"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                disabled={isCreating}
                autoFocus
              />
              <Flex justifyContent="flex-end" gap="small" marginTop="medium">
                <Button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variation="primary"
                  isLoading={isCreating}
                >
                  Create Deck
                </Button>
              </Flex>
            </Flex>
          </Card>
        </View>
      )}
    </Flex>
  );
}
