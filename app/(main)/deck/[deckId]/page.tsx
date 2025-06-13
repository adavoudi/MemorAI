"use client";

import { useEffect, useState } from "react";
import {
  Heading,
  Flex,
  Collection,
  Text,
  Loader,
  Button,
} from "@aws-amplify/ui-react";
import Flashcard from "@/components/deck/Flashcard";
import EditCardModal from "@/components/deck/EditCardModal";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "@/hooks/auth";

// Initialize the Amplify Data client
const client = generateClient<Schema>();

// Define the types based on your schema
type Deck = Schema["Deck"]["type"];
type Card = Schema["Card"]["type"];

export default function DeckDetailPage({
  params,
}: {
  params: { deckId: string };
}) {
  const { user } = useAuthenticator((context) => [context.user]);

  // State for deck details, cards, and UI
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<Card | null>(null);

  // Fetch the Deck's name and its cards in real-time
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    // Fetch the deck details once
    const fetchDeckInfo = async () => {
      const { data: deckData, errors } = await client.models.Deck.get({
        id: params.deckId,
      });
      if (deckData) {
        setDeck(deckData);
      } else {
        console.error("Error fetching deck:", errors);
      }
      // We set loading to false here, even if cards are still loading,
      // so the deck title appears first. The card list will have its own state.
      setIsLoading(false);
    };
    fetchDeckInfo();

    // Use observeQuery for a real-time list of cards for this deck
    const sub = client.models.Card.observeQuery({
      filter: { deckId: { eq: params.deckId } },
    }).subscribe({
      next: ({ items }) => {
        // Sort cards by creation date
        const sortedCards = [...items].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setCards(sortedCards);
      },
      error: (error) => console.warn(error),
    });

    // Cleanup subscription on unmount
    return () => sub.unsubscribe();
  }, [user, params.deckId]);

  const handleEditClick = (card: Card) => {
    setCardToEdit(card);
    setIsModalOpen(true);
  };

  const handleSaveChanges = async (updatedCardData: {
    cardId: string;
    frontText: string;
    backText: string;
  }) => {
    // We only update the front and back text from the modal
    const originalCard = cards.find((c) => c.cardId === updatedCardData.cardId);
    if (!originalCard) return;

    try {
      await client.models.Card.update({
        // Pass the original card's ID and the updated text fields
        cardId: originalCard.cardId,
        frontText: updatedCardData.frontText,
        backText: updatedCardData.backText,
      });
      // The UI will update automatically via the observeQuery subscription
    } catch (error) {
      console.error("Error updating card:", error);
    }
  };

  if (isLoading) {
    return (
      <Flex justifyContent="center" alignItems="center" minHeight="50vh">
        <Loader size="large" />
      </Flex>
    );
  }

  if (!deck) {
    return <Heading level={2}>Deck not found.</Heading>;
  }

  return (
    <Flex direction="column" gap="large">
      <Heading level={2}>Deck: {deck.name}</Heading>

      {cards.length === 0 ? (
        <Text>
          This deck has no cards yet. You can add some from the Search page.
        </Text>
      ) : (
        <Collection type="list" items={cards} gap="medium">
          {(item) => (
            <Flashcard key={item.cardId} card={item} onEdit={handleEditClick} />
          )}
        </Collection>
      )}

      {/* The modal now receives the full Card object */}
      <EditCardModal
        card={cardToEdit}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveChanges}
      />
    </Flex>
  );
}
