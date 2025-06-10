// app/(main)/review/page.tsx
"use client";

import { useState, useMemo } from "react";
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
} from "@aws-amplify/ui-react";
import ReviewFileItem from "@/components/review/ReviewFileItem";
import "@/hooks/auth";

// --- Updated Data Structures ---
interface DeckWithDueCount {
  id: string;
  name: string;
  dueCardCount: number;
}

// The ReviewFile type is now enhanced with more properties for filtering
export interface ReviewFile {
  id: string;
  deckId: string;
  deckName: string;
  isListened: boolean;
  phrases: string[];
  cardCount: number;
  createdAt: string;
}

const mockDecksWithDue: DeckWithDueCount[] = [
  { id: "d1", name: "Default Deck", dueCardCount: 5 },
  { id: "d2", name: "Business Travel", dueCardCount: 12 },
  { id: "d3", name: "Restaurant Phrases", dueCardCount: 0 },
];

const mockRecentFiles: ReviewFile[] = [
  {
    id: "rf1",
    deckId: "d2",
    deckName: "Business Travel",
    isListened: false,
    phrases: ["Good morning", "Thank you"],
    cardCount: 7,
    createdAt: "2025-06-10T10:00:00Z",
  },
  {
    id: "rf2",
    deckId: "d1",
    deckName: "Default Deck",
    isListened: true,
    phrases: ["Where is the station?", "A ticket, please."],
    cardCount: 8,
    createdAt: "2025-06-09T11:30:00Z",
  },
  {
    id: "rf3",
    deckId: "d2",
    deckName: "Business Travel",
    isListened: true,
    phrases: ["The meeting is at 2 PM.", "Can you help me?"],
    cardCount: 10,
    createdAt: "2025-06-07T15:00:00Z",
  },
  {
    id: "rf4",
    deckId: "d1",
    deckName: "Default Deck",
    isListened: false,
    phrases: ["Hello", "Goodbye"],
    cardCount: 5,
    createdAt: "2025-06-10T14:20:00Z",
  },
];
// --- End Updated Data ---

export default function ReviewPage() {
  // --- State for Filters ---
  const [statusFilter, setStatusFilter] = useState<
    "all" | "listened" | "notListened"
  >("all");
  const [deckFilter, setDeckFilter] = useState<string>("all"); // 'all' or a deckId
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  const handleGenerateForDeck = (deckId: string, deckName: string) => {
    console.log(`Generating review files for deck ${deckId}...`);
    alert(
      `Generation started for "${deckName}"! You'll get a notification when it's ready.`
    );
  };

  // --- Filtering & Sorting Logic ---
  const filteredFiles = useMemo(() => {
    let files = [...mockRecentFiles];

    // 1. Filter by listened status
    if (statusFilter === "listened") {
      files = files.filter((file) => file.isListened);
    } else if (statusFilter === "notListened") {
      files = files.filter((file) => !file.isListened);
    }

    // 2. Filter by deck
    if (deckFilter !== "all") {
      files = files.filter((file) => file.deckId === deckFilter);
    }

    // 3. Sort by date
    files.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    return files;
  }, [statusFilter, deckFilter, sortBy]); // Recalculate only when filters change

  return (
    <Flex direction="column" gap="xlarge">
      {/* Section 1: Generate new reviews (remains the same) */}
      <Flex direction="column" gap="large">
        <Heading level={2}>Generate Reviews</Heading>
        <Text>
          Select a deck to generate a new audio review file from its due cards.
        </Text>
        <Collection type="list" items={mockDecksWithDue} gap="medium">
          {(deck, index) => (
            <Card key={index} variation="outlined" padding="large">
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
                  isDisabled={deck.dueCardCount === 0}
                >
                  Generate
                </Button>
              </Flex>
            </Card>
          )}
        </Collection>
      </Flex>

      <Divider size="large" />

      {/* Section 2: Recently Generated Files with Filters */}
      <Flex direction="column" gap="large">
        <Heading level={3}>Review History</Heading>

        {/* --- New Filter UI Controls --- */}
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
              {mockDecksWithDue.map((deck) => (
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
        {/* --- End Filter UI --- */}

        {filteredFiles.length > 0 ? (
          <Collection type="list" items={filteredFiles} gap="medium">
            {(item, index) => <ReviewFileItem key={index} file={item} />}
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
