"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Flex,
  Heading,
  Button,
  Text,
  Divider,
  SelectField,
} from "@aws-amplify/ui-react";
import SearchBar from "@/components/search/SearchBar";
import TranslationItem, {
  Translation,
} from "@/components/search/TranslationItem";
import { Deck } from "@/components/deck/DeckList"; // Re-using type from another component
import "@/hooks/auth";

// --- Mock Data for Decks ---
const mockUserDecks: Deck[] = [
  { id: "d1", name: "Default Deck", cardCount: 50, createdAt: "..." },
  { id: "d2", name: "Business Travel", cardCount: 25, createdAt: "..." },
  { id: "d3", name: "Restaurant Phrases", cardCount: 42, createdAt: "..." },
];

const mockTranslations: Translation[] = [
  { type: "Formal", text: "Guten Tag" },
  { type: "Informal", text: "Hallo" },
];
// --- End Mock Data ---

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";

  const [selectedItems, setSelectedItems] = useState<Translation[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");

  useEffect(() => {
    // In a real app, you would fetch the user's decks from an API
    // const userDecks = await fetchDecks();
    setDecks(mockUserDecks);
    // Set the default deck as the initial selection
    const defaultDeck = mockUserDecks.find((d) => d.name === "Default Deck");
    if (defaultDeck) {
      setSelectedDeckId(defaultDeck.id);
    } else if (mockUserDecks.length > 0) {
      setSelectedDeckId(mockUserDecks[0].id);
    }
  }, []);

  const handleSelectionChange = (item: Translation, isSelected: boolean) => {
    if (isSelected) {
      setSelectedItems([...selectedItems, item]);
    } else {
      setSelectedItems(selectedItems.filter((i) => i.text !== item.text));
    }
  };

  const handleAddToDeck = () => {
    const selectedDeck = decks.find((d) => d.id === selectedDeckId);
    // Fictional API call: await addCardsToDeck(selectedItems, selectedDeckId);
    console.log("Adding to deck:", selectedItems, `Deck ID: ${selectedDeckId}`);
    alert(`${selectedItems.length} card(s) added to "${selectedDeck?.name}"!`);
    setSelectedItems([]);
  };

  return (
    <Flex direction="column" gap="large">
      <Heading level={2}>Search & Add</Heading>
      <SearchBar initialQuery={query} />

      {query && (
        <>
          <Text>
            Showing results for: <strong>"{query}"</strong>
          </Text>
          <Flex direction="column" gap="medium">
            {mockTranslations.map((translation) => (
              <TranslationItem
                key={translation.text}
                translation={translation}
                isSelected={selectedItems.some(
                  (i) => i.text === translation.text
                )}
                onSelectionChange={(isSelected) =>
                  handleSelectionChange(translation, isSelected)
                }
              />
            ))}
          </Flex>
          <Divider />

          {/* --- New Deck Selector --- */}
          <Flex justifyContent="space-between" alignItems="flex-end">
            <SelectField
              label="Add to Deck"
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              flex="1"
              maxWidth="300px"
            >
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name} ({deck.cardCount} cards)
                </option>
              ))}
            </SelectField>

            <Button
              variation="primary"
              onClick={handleAddToDeck}
              isDisabled={selectedItems.length === 0 || !selectedDeckId}
            >
              + Add {selectedItems.length > 0 ? selectedItems.length : ""} to
              Deck
            </Button>
          </Flex>
        </>
      )}
    </Flex>
  );
}
