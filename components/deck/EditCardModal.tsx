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
import { FlashcardData } from "./Flashcard";

interface EditCardModalProps {
  card: FlashcardData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCard: FlashcardData) => void;
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
      setFrontText(card.front);
      setBackText(card.back);
    }
  }, [card]);

  const handleSave = () => {
    if (!card) return;
    // Fictional API call: await updateCard(card.id, { front: frontText, back: backText });
    onSave({ ...card, front: frontText, back: backText });
    onClose();
  };

  // Prevent the modal from closing when its content is clicked.
  const stopPropagation = (e: MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen || !card) {
    return null;
  }

  return (
    // 1. The Overlay: A full-screen View that closes the modal when clicked.
    <View
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      backgroundColor={tokens.colors.overlay["50"]} // Semi-transparent background
      onClick={onClose}
      display="flex"
      // justifyContent="center"
      // alignItems="center"
      // zIndex={100} // Ensure it's on top of other content
    >
      {/* 2. The Modal Content: A Card that stops click propagation. */}
      <Card
        variation="elevated"
        width={{ base: "90%", medium: "600px" }}
        padding={tokens.space.large}
        onClick={stopPropagation}
      >
        <Flex direction="column" gap="medium">
          <Heading level={4}>Edit Flashcard</Heading>
          <TextField
            label="Front (English)"
            value={frontText}
            onChange={(e) => setFrontText(e.target.value)}
          />
          <TextField
            label="Back (German)"
            value={backText}
            onChange={(e) => setBackText(e.target.value)}
          />
          <Flex justifyContent="flex-end" gap="small" marginTop="medium">
            <Button variation="primary" onClick={onClose}>
              Cancel
            </Button>
            <Button variation="primary" onClick={handleSave}>
              Save Changes
            </Button>
          </Flex>
        </Flex>
      </Card>
    </View>
  );
}
