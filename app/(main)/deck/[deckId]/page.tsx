"use client";

import { useState } from "react";
import { Heading, Flex, Collection, Text } from "@aws-amplify/ui-react";
import Flashcard, { FlashcardData } from "@/components/deck/Flashcard";
import EditCardModal from "@/components/deck/EditCardModal";

const mockFlashcards: FlashcardData[] = [
  { id: "c1", front: "Good morning", back: "Guten Morgen" },
  { id: "c2", front: "Thank you", back: "Danke schön" },
  { id: "c3", front: "How are you?", back: "Wie geht es Ihnen?" },
];

export default function DeckDetailPage({
  params,
}: {
  params: { deckId: string };
}) {
  const [cards, setCards] = useState<FlashcardData[]>(mockFlashcards);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<FlashcardData | null>(null);

  const handleEditClick = (card: FlashcardData) => {
    setCardToEdit(card);
    setIsModalOpen(true);
  };

  const handleSaveChanges = (updatedCard: FlashcardData) => {
    setCards(cards.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
  };

  return (
    <Flex direction="column" gap="large">
      <Heading level={2}>Deck: Business Travel</Heading>{" "}
      {/* Title would be fetched */}
      <Collection type="list" items={cards} gap="medium">
        {(item, index) => (
          <Flashcard key={index} card={item} onEdit={handleEditClick} />
        )}
      </Collection>
      <EditCardModal
        card={cardToEdit}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveChanges}
      />
    </Flex>
  );
}
