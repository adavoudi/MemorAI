"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Flex, Heading, Button, Text, Divider } from "@aws-amplify/ui-react";
import SearchBar from "@/components/search/SearchBar";
import TranslationItem, {
  Translation,
} from "@/components/search/TranslationItem";

// Mock API response
const mockTranslations: Translation[] = [
  { type: "Formal", text: "Guten Tag" },
  { type: "Informal", text: "Hallo" },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";

  // State to track which translations are selected
  const [selectedItems, setSelectedItems] = useState<Translation[]>([]);

  const handleSelectionChange = (item: Translation, isSelected: boolean) => {
    if (isSelected) {
      setSelectedItems([...selectedItems, item]);
    } else {
      setSelectedItems(selectedItems.filter((i) => i.text !== item.text));
    }
  };

  const handleAddToDeck = () => {
    // Fictional API call: await addCardsToDeck(selectedItems);
    console.log("Adding to deck:", selectedItems);
    alert(`${selectedItems.length} card(s) added!`);
    setSelectedItems([]); // Reset selection
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
          <Flex justifyContent="flex-end">
            <Button
              variation="primary"
              onClick={handleAddToDeck}
              isDisabled={selectedItems.length === 0}
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
