"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  Message,
  View,
  Icon,
} from "@aws-amplify/ui-react";
import ReviewFileItem from "@/components/review/ReviewFileItem";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "@/hooks/auth";
import { MdRefresh } from "react-icons/md";

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    theme: "info" | "error";
  } | null>(null);

  // Extracted fetch function for Decks into a useCallback for reusability
  const fetchDecksAndDueCounts = useCallback(async () => {
    if (!user) {
      setDecksWithDue([]); // Clear decks if no user
      setIsLoading(false);
      return;
    }
    // Only set loading to true if decks are empty, to avoid flickering on subsequent fetches
    if (decksWithDue.length === 0) setIsLoading(true);

    try {
      const [decksResult, cardsResult] = await Promise.all([
        client.models.Deck.list({ filter: { owner: { eq: user.userId } } }),
        client.models.Card.list({ filter: { owner: { eq: user.userId } } }),
      ]);

      const decks = decksResult.data;
      const cards = cardsResult.data;
      const today = new Date().toISOString().split("T")[0];

      const dueCountMap = new Map<string, number>();
      for (const card of cards) {
        if (card.srsDueDate <= today && card.reviewInclusionDate !== today) {
          dueCountMap.set(card.deckId, (dueCountMap.get(card.deckId) || 0) + 1);
        }
      }

      const decksWithCountData = decks.map((deck) => ({
        ...deck,
        dueCardCount: dueCountMap.get(deck.id) || 0,
      }));

      setDecksWithDue(decksWithCountData);
    } catch (error) {
      console.error("Error fetching decks and due counts:", error);
      // Optionally set an error state or show a toast
    } finally {
      setIsLoading(false);
    }
  }, [user, decksWithDue.length]); // Added user to dependencies

  // Effect for initial deck data fetch
  useEffect(() => {
    fetchDecksAndDueCounts();
  }, [fetchDecksAndDueCounts]);

  // --- Extracted fetch function for Review Files ---
  const fetchReviewFiles = useCallback(async () => {
    if (!user) {
      setReviewFiles([]); // Clear review files if no user
      return;
    }
    try {
      const { data } = await client.models.ReviewFile.list();
      // Sort by creation date to show newest first
      data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setReviewFiles(data);
    } catch (error) {
      console.error("Error fetching review files:", error);
    }
  }, [user]); // Dependency on user

  // --- Start: Modified Review Files Logic (matching Header component) ---
  useEffect(() => {
    // Fetch initial files when the component mounts or user changes
    fetchReviewFiles();

    // Subscribe to NEW review files
    const createSub = client.models.ReviewFile.onCreate().subscribe({
      next: (newFile) => {
        console.log("New review file created:", newFile);
        setReviewFiles((prevFiles) => [newFile, ...prevFiles]);
        // Also refresh deck counts as a new file might affect them (e.g., if a review was generated)
        fetchDecksAndDueCounts();
      },
      error: (error) =>
        console.warn("Error on new review file subscription:", error),
    });

    // Subscribe to UPDATES on review files (e.g., isListened status change)
    const updateSub = client.models.ReviewFile.onUpdate().subscribe({
      next: (updatedFile) => {
        console.log("Review file updated:", updatedFile);
        setReviewFiles((prev) =>
          prev.map((f) => (f.id === updatedFile.id ? updatedFile : f))
        );
      },
      error: (error) =>
        console.warn("Error on review file update subscription:", error),
    });

    // Cleanup function to unsubscribe
    return () => {
      createSub.unsubscribe();
      updateSub.unsubscribe();
    };
  }, [user, fetchReviewFiles, fetchDecksAndDueCounts]);
  // --- End: Modified Review Files Logic ---

  // Effect to clear the toast message after a delay
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 2000); // Hide after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setToast({ message: "Refreshing...", theme: "info" });
    await Promise.all([fetchDecksAndDueCounts(), fetchReviewFiles()]);
    // Set a slight delay for the user to see the refresh status
    setTimeout(() => setIsRefreshing(false), 500);
    setToast(null); // Clear the refreshing toast
  }, [fetchDecksAndDueCounts, fetchReviewFiles]);

  const handleGenerateForDeck = async (deckId: string) => {
    setIsGenerating((prev) => new Map(prev).set(deckId, true));
    try {
      const result = await client.mutations.startReviewGeneration({ deckId });
      // Amplify Data returns data as a string in this case (from a Lambda resolver)
      // We need to parse it twice if the Lambda returns a JSON string inside another JSON string
      const { statusCode, body } = JSON.parse(result.data as string);
      const { message } = JSON.parse(body as string); // Assuming 'body' is also a JSON string

      if (statusCode === 200) {
        setToast({ message: message, theme: "info" });
        // The `fetchDecksAndDueCounts` will cause the UI to update the due counts.
        // The new review file will be automatically added by the `onCreate` subscription above.
        fetchDecksAndDueCounts();
      } else {
        setToast({ message: `Error: ${message}`, theme: "error" });
      }
    } catch (error) {
      console.error("Error generating review file:", error);
      setToast({ message: "An unexpected error occurred.", theme: "error" });
    }
    setIsGenerating((prev) => new Map(prev).set(deckId, false));
  };

  const filteredFiles = useMemo(() => {
    // Filter out any potential null/undefined items first for safety
    let files = [...reviewFiles].filter((f) => f);
    if (statusFilter === "listened") files = files.filter((f) => f.isListened);
    if (statusFilter === "notListened")
      files = files.filter((f) => !f.isListened);
    if (deckFilter !== "all")
      files = files.filter((f) => f.deckId === deckFilter);
    files.sort((a, b) => {
      // Add defensive checks to prevent crashing if createdAt is null
      const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });
    return files;
  }, [reviewFiles, statusFilter, deckFilter, sortBy]);

  const deckNameMap = useMemo(() => {
    return new Map(decksWithDue.map((deck) => [deck.id, deck.name]));
  }, [decksWithDue]);

  return (
    <View position="relative" width="100%">
      <Flex direction="column" gap="xlarge">
        <Flex direction="column" gap="large">
          <Heading level={2}>Generate Reviews</Heading>
          <Text>
            Select a deck to generate a new audio review file from its due
            cards.
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
                      onClick={() => handleGenerateForDeck(deck.id)}
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
          <Flex justifyContent="space-between" alignItems="center">
            <Heading level={3}>Review History</Heading>
            <Button onClick={handleRefresh} isLoading={isRefreshing}>
              <Icon as={MdRefresh} />
              <Text>Refresh</Text>
            </Button>
          </Flex>
          <Card
            variation="outlined"
            style={{ position: "sticky", top: "1rem", zIndex: 1 }}
          >
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
                  deckName={deckNameMap.get(item.deckId) || "Unknown Deck"}
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
