"use client";

import { useState, useEffect, MouseEvent } from "react";
import {
  View,
  Card,
  TextField,
  Flex,
  Button,
  Heading,
  useTheme,
} from "@aws-amplify/ui-react";
import type { Schema } from "@/amplify/data/resource";

// Define the Card type from the generated schema
type CardData = Schema["Card"]["type"];

interface EditCardModalProps {
  card: CardData | null;
  isOpen: boolean;
  onClose: () => void;
  // This signature matches what DeckDetailPage expects
  onSave: (updatedCard: {
    cardId: string;
    frontText: string;
    backText: string;
  }) => void;
}

export default function EditCardModal({
  card,
  isOpen,
  onClose,
  onSave,
}: EditCardModalProps) {
  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");
  const { tokens } = useTheme();

  useEffect(() => {
    if (card) {
      // Use the correct properties 'frontText' and 'backText'
      setFrontText(card.frontText);
      setBackText(card.backText);
    }
  }, [card]);

  const handleSave = () => {
    if (!card) return;
    // Pass back an object with the required shape for the update operation
    onSave({
      cardId: card.cardId,
      frontText: frontText,
      backText: backText,
    });
    onClose();
  };

  const stopPropagation = (e: MouseEvent) => e.stopPropagation();

  if (!isOpen || !card) {
    return null;
  }

  return (
    // The Overlay
    <View
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      backgroundColor={tokens.colors.overlay["50"]}
      onClick={onClose}
      display="flex"
      // justifyContent="center"
      // alignItems="center"
      // zIndex={100}
    >
      {/* The Modal Content */}
      <Card
        variation="elevated"
        width={{ base: "90%", medium: "600px" }}
        padding={tokens.space.large}
        onClick={stopPropagation}
      >
        <Flex
          as="form"
          direction="column"
          gap="medium"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <Heading level={4}>Edit Flashcard</Heading>
          <TextField
            label="Front (English)"
            value={frontText}
            onChange={(e) => setFrontText(e.target.value)}
            autoFocus
          />
          <TextField
            label="Back (German)"
            value={backText}
            onChange={(e) => setBackText(e.target.value)}
          />
          <Flex justifyContent="flex-end" gap="small" marginTop="medium">
            <Button onClick={onClose}>Cancel</Button>
            <Button variation="primary" type="submit">
              Save Changes
            </Button>
          </Flex>
        </Flex>
      </Card>
    </View>
  );
}
