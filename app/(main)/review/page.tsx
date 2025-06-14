"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Button,
  Flex,
  Heading,
  Collection,
  Card,
  Text,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
  SelectField,
  Divider,
  Loader,
} from "@aws-amplify/ui-react";
import ReviewFileItem from "@/components/review/ReviewFileItem";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "@/hooks/auth";

// Initialize Amplify Client
const client = generateClient<Schema>();

// Define types from schema
type Deck = Schema["Deck"]["type"];
type ReviewFile = Schema["ReviewFile"]["type"];

// Enhanced type for the UI
interface DeckWithDueCount extends Deck {
  dueCardCount: number;
}

export default function ReviewPage() {
  const { user } = useAuthenticator((context) => [context.user]);

  // State for data
  const [decksWithDue, setDecksWithDue] = useState<DeckWithDueCount[]>([]);
  const [reviewFiles, setReviewFiles] = useState<ReviewFile[]>([]);

  // State for UI and filters
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<Map<string, boolean>>(
    new Map()
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "listened" | "notListened"
  >("all");
  const [deckFilter, setDeckFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  // Effect to fetch initial deck and card data to calculate due counts
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    const fetchDecksAndDueCounts = async () => {
      // Fetch all decks and all cards for the user concurrently
      const [decksResult, cardsResult] = await Promise.all([
        client.models.Deck.list({ filter: { owner: { eq: user.userId } } }),
        client.models.Card.list({ filter: { owner: { eq: user.userId } } }),
      ]);

      const decks = decksResult.data;
      const cards = cardsResult.data;
      const today = new Date().toISOString().split("T")[0];

      // Create a map to efficiently store due counts
      const dueCountMap = new Map<string, number>();
      for (const card of cards) {
        if (card.srsDueDate <= today) {
          dueCountMap.set(card.deckId, (dueCountMap.get(card.deckId) || 0) + 1);
        }
      }

      // Combine deck info with its calculated due count
      const decksWithCountData = decks.map((deck) => ({
        ...deck,
        dueCardCount: dueCountMap.get(deck.id) || 0,
      }));

      setDecksWithDue(decksWithCountData);
      setIsLoading(false);
    };

    fetchDecksAndDueCounts();
  }, [user]);

  // Effect to get a real-time list of review files
  useEffect(() => {
    if (!user) return;
    const sub = client.models.ReviewFile.observeQuery({
      filter: { owner: { eq: user.userId } },
    }).subscribe({
      next: ({ items }) => {
        setReviewFiles(items);
      },
      error: (error) => console.warn(error),
    });

    return () => sub.unsubscribe();
  }, [user]);

  const handleGenerateForDeck = async (deckId: string, deckName: string) => {
    setIsGenerating((prev) => new Map(prev).set(deckId, true));
    try {
      // In a real app, you would call a custom mutation that triggers a Lambda function
      // For now, we'll simulate the call and show a notification hint.
      console.log(`Triggering review file generation for deck: ${deckName}`);
      alert(
        `Generation started for "${deckName}"! You'll get a notification in the header when it's ready.`
      );

      // Fictional mutation call:
      // await client.mutations.generateReviewFile({ deckId });
    } catch (error) {
      console.error("Error generating review file:", error);
    }
    setIsGenerating((prev) => new Map(prev).set(deckId, false));
  };

  // Filtering and sorting logic for the review history
  const filteredFiles = useMemo(() => {
    let files = [...reviewFiles];
    if (statusFilter === "listened") files = files.filter((f) => f.isListened);
    if (statusFilter === "notListened")
      files = files.filter((f) => !f.isListened);
    if (deckFilter !== "all")
      files = files.filter((f) => f.deckId === deckFilter);
    files.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });
    return files;
  }, [reviewFiles, statusFilter, deckFilter, sortBy]);

  return (
    <Flex direction="column" gap="xlarge">
      <Flex direction="column" gap="large">
        <Heading level={2}>Generate Reviews</Heading>
        <Text>
          Select a deck to generate a new audio review file from its due cards.
        </Text>
        {isLoading ? (
          <Loader size="large" />
        ) : (
          <Collection type="list" items={decksWithDue} gap="medium">
            {(deck) => (
              <Card key={deck.id} variation="outlined" padding="large">
                <Flex justifyContent="space-between" alignItems="center">
                  <Flex direction="column">
                    <Heading level={4}>{deck.name}</Heading>
                    <Text color="font.secondary">
                      <Badge
                        variation={deck.dueCardCount > 0 ? "warning" : "info"}
                      >
                        {deck.dueCardCount}
                      </Badge>{" "}
                      cards due
                    </Text>
                  </Flex>
                  <Button
                    variation="primary"
                    onClick={() => handleGenerateForDeck(deck.id, deck.name)}
                    isDisabled={
                      deck.dueCardCount === 0 || isGenerating.get(deck.id)
                    }
                    isLoading={isGenerating.get(deck.id)}
                  >
                    Generate
                  </Button>
                </Flex>
              </Card>
            )}
          </Collection>
        )}
      </Flex>

      <Divider size="large" />

      <Flex direction="column" gap="large">
        <Heading level={3}>Review History</Heading>
        <Card variation="outlined">
          <Flex
            direction={{ base: "column", medium: "row" }}
            gap="medium"
            alignItems="center"
          >
            <ToggleButtonGroup
              value={statusFilter}
              isExclusive
              onChange={(value) => setStatusFilter(value as any)}
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="notListened">Not Listened</ToggleButton>
              <ToggleButton value="listened">Listened</ToggleButton>
            </ToggleButtonGroup>
            <SelectField
              label="Filter by Deck"
              labelHidden
              value={deckFilter}
              onChange={(e) => setDeckFilter(e.target.value)}
            >
              <option value="all">All Decks</option>
              {decksWithDue.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Sort by"
              labelHidden
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </SelectField>
          </Flex>
        </Card>

        {filteredFiles.length > 0 ? (
          <Collection type="list" items={filteredFiles} gap="medium">
            {(item) => (
              <ReviewFileItem
                key={item.id}
                file={item}
                deckName={item.deck.name}
              />
            )}
          </Collection>
        ) : (
          <Text padding="large" textAlign="center">
            No review files match your current filters.
          </Text>
        )}
      </Flex>
    </Flex>
  );
}
