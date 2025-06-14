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
  Loader,
  Message,
  View,
} from "@aws-amplify/ui-react";
import SearchBar from "@/components/search/SearchBar";
import TranslationItem, {
  Translation,
} from "@/components/search/TranslationItem";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "@/hooks/auth";

// Initialize the Amplify Data client
const client = generateClient<Schema>();

// Define types based on your schema and custom queries
type Deck = Schema["Deck"]["type"];
interface TranslateOutput {
  formal?: string;
  informal?: string;
}

export default function SearchPage() {
  const { user } = useAuthenticator((context) => [context.user]);
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";

  // State for data and UI
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [selectedItems, setSelectedItems] = useState<Translation[]>([]);

  // Loading states
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);
  const [isAddingCards, setIsAddingCards] = useState(false);

  // State for the toast message
  const [toast, setToast] = useState<{
    message: string;
    theme: "info" | "error";
  } | null>(null);

  // Effect to fetch user's decks once
  useEffect(() => {
    if (!user) return;

    const fetchDecks = async () => {
      setIsLoadingDecks(true);
      const { data: userDecks } = await client.models.Deck.list({
        filter: { owner: { eq: user.userId } },
      });
      setDecks(userDecks);

      const defaultDeck = userDecks.find((d) => d.name === "Default Deck");
      if (defaultDeck) {
        setSelectedDeckId(defaultDeck.id);
      } else if (userDecks.length > 0) {
        setSelectedDeckId(userDecks[0].id);
      }
      setIsLoadingDecks(false);
    };

    fetchDecks();
  }, [user]);

  // Effect to fetch translations when the search query changes
  useEffect(() => {
    if (!query) {
      setTranslations([]);
      return;
    }

    const fetchTranslations = async () => {
      setIsLoadingTranslations(true);
      setSelectedItems([]);
      try {
        const { data, errors } = await client.queries.translate({
          inputText: query,
        });
        if (data) {
          const typedData = JSON.parse(data) as TranslateOutput;
          const results: Translation[] = [];
          if (typedData.formal)
            results.push({ type: "Formal", text: typedData.formal });
          if (typedData.informal)
            results.push({ type: "Informal", text: typedData.informal });
          setTranslations(results);
        }
        if (errors) console.error("Error translating:", errors);
      } catch (error) {
        console.error("Failed to call translate query:", error);
      }
      setIsLoadingTranslations(false);
    };

    fetchTranslations();
  }, [query]);

  // Effect to clear the toast message after a delay
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 2000); // Hide after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSelectionChange = (item: Translation, isSelected: boolean) => {
    if (isSelected) {
      setSelectedItems([...selectedItems, item]);
    } else {
      setSelectedItems(selectedItems.filter((i) => i.text !== item.text));
    }
  };

  const handleAddToDeck = async () => {
    if (!user || selectedItems.length === 0 || !selectedDeckId) return;

    setIsAddingCards(true);
    const today = new Date().toISOString().split("T")[0];

    const newCards = selectedItems.map((item) => ({
      cardId: window.crypto.randomUUID(),
      frontText: query,
      backText: item.text,
      deckId: selectedDeckId,
      owner: user.userId,
      srsDueDate: today,
      srsInterval: 1,
      srsEaseFactor: 2.5,
    }));

    try {
      await Promise.all(
        newCards.map((card) => client.models.Card.create(card))
      );
      setToast({
        message: `${selectedItems.length} card(s) added successfully!`,
        theme: "info",
      });
      setSelectedItems([]);
    } catch (error) {
      console.error("Error creating cards:", error);
      setToast({
        message: "Failed to add cards. Please try again.",
        theme: "error",
      });
    }
    setIsAddingCards(false);
  };

  return (
    <View position="relative" width="100%">
      <Flex direction="column" gap="large">
        <Heading level={2}>Search & Add</Heading>
        <SearchBar initialQuery={query} />

        {query && (
          <>
            <Text>
              Showing results for: <strong>"{query}"</strong>
            </Text>
            {isLoadingTranslations ? (
              <Flex justifyContent="center" padding="large">
                <Loader />
              </Flex>
            ) : (
              <Flex direction="column" gap="medium">
                {translations.map((translation) => (
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
            )}
            <Divider />

            <Flex justifyContent="space-between" alignItems="flex-end">
              <SelectField
                label="Add to Deck"
                value={selectedDeckId}
                onChange={(e) => setSelectedDeckId(e.target.value)}
                flex="1"
                maxWidth="300px"
                isDisabled={isLoadingDecks}
              >
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                  </option>
                ))}
              </SelectField>

              <Button
                variation="primary"
                onClick={handleAddToDeck}
                isDisabled={
                  selectedItems.length === 0 || !selectedDeckId || isAddingCards
                }
                isLoading={isAddingCards}
              >
                + Add {selectedItems.length > 0 ? selectedItems.length : ""} to
                Deck
              </Button>
            </Flex>
          </>
        )}
      </Flex>

      {toast && (
        <View
          position="fixed"
          bottom="2rem"
          right="2rem"
          // zIndex={100}
          width="fit-content"
        >
          <Message
            variation="filled"
            colorTheme={toast.theme}
            onDismiss={() => setToast(null)}
          >
            {toast.message}
          </Message>
        </View>
      )}
    </View>
  );
}
