import type { Schema } from "../../data/resource";
import type { AppSyncIdentityCognito } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { randomUUID } from "crypto"; // Added import for generating unique IDs

// Note: This assumes you have an environment variable for the function's environment.
// If not, you might need to adjust how you get the env name.
import { env } from "$amplify/env/create-mock-data";

// Initialize the Amplify client outside the handler for reuse.
const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

/**
 * A utility function to get a date string in YYYY-MM-DD format.
 * @param offsetDays Number of days to offset from today.
 * @returns A date string e.g., "2025-06-13"
 */
const getDueDate = (offsetDays: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split("T")[0];
};

/**
 * This handler populates the database with a full set of mock data
 * for the user who invokes the query.
 */
export const handler: Schema["createMockData"]["functionHandler"] = async (
  event,
  context
) => {
  console.log("Starting mock data creation...");
  const identity = event.identity as AppSyncIdentityCognito;
  const ownerId = identity.username; // Cognito 'sub'

  try {
    // --- 1. Create Decks ---
    console.log("Creating decks...");
    const { data: deck1 } = await client.models.Deck.create({
      name: "Business Travel",
      owner: ownerId,
    });
    const { data: deck2 } = await client.models.Deck.create({
      name: "Restaurant Phrases",
      owner: ownerId,
    });
    console.log(`Created decks: ${deck1?.id}, ${deck2?.id}`);

    // --- 2. Create Cards for Each Deck ---
    console.log("Creating cards...");
    const deck1CardData = [
      {
        front: "Where is the conference room?",
        back: "Wo ist der Konferenzraum?",
        dueOffset: -1,
      }, // Due yesterday
      {
        front: "I have a reservation.",
        back: "Ich habe eine Reservierung.",
        dueOffset: 0,
      }, // Due today
      {
        front: "Can I have the invoice, please?",
        back: "Kann ich bitte die Rechnung haben?",
        dueOffset: 1,
      }, // Due tomorrow
      {
        front: "The flight is delayed.",
        back: "Der Flug hat Verspätung.",
        dueOffset: 7,
      }, // Due next week
    ];

    const deck2CardData = [
      {
        front: "A table for two, please.",
        back: "Einen Tisch für zwei, bitte.",
        dueOffset: 0,
      }, // Due today
      {
        front: "What do you recommend?",
        back: "Was können Sie empfehlen?",
        dueOffset: 0,
      }, // Due today
      {
        front: "The check, please.",
        back: "Die Rechnung, bitte.",
        dueOffset: -5,
      }, // Due last week
      {
        front: "Is this vegetarian?",
        back: "Ist das vegetarisch?",
        dueOffset: 3,
      }, // Due in 3 days
    ];

    const createdCardIdsDeck1: string[] = [];
    for (const card of deck1CardData) {
      // FIX: Added cardId, srsInterval, and srsEaseFactor to match the schema type.
      const { data: newCard } = await client.models.Card.create({
        cardId: randomUUID(),
        frontText: card.front,
        backText: card.back,
        srsDueDate: getDueDate(card.dueOffset),
        srsInterval: 1,
        srsEaseFactor: 2.5,
        deckId: deck1!.id,
        owner: ownerId,
      });
      createdCardIdsDeck1.push(newCard!.cardId);
    }

    for (const card of deck2CardData) {
      // FIX: Added cardId, srsInterval, and srsEaseFactor here as well.
      await client.models.Card.create({
        cardId: randomUUID(),
        frontText: card.front,
        backText: card.back,
        srsDueDate: getDueDate(card.dueOffset),
        srsInterval: 1,
        srsEaseFactor: 2.5,
        deckId: deck2!.id,
        owner: ownerId,
      });
    }
    console.log(
      `Created ${deck1CardData.length + deck2CardData.length} cards.`
    );

    // --- 3. Create Review Files ---
    console.log("Creating review files...");
    await client.models.ReviewFile.create({
      deckId: deck1!.id,
      cardIds: [createdCardIdsDeck1[0], createdCardIdsDeck1[2]],
      cardCount: 2,
      isListened: true,
      lastListenedAt: new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000
      ).toISOString(),
      s3Path: "mock/listened_review.mp3",
      subtitleS3Path: "mock/listened_review.vtt",
      owner: ownerId,
    });
    await client.models.ReviewFile.create({
      deckId: deck1!.id,
      cardIds: [createdCardIdsDeck1[1], createdCardIdsDeck1[3]],
      cardCount: 2,
      isListened: false,
      s3Path: "mock/new_review.mp3",
      subtitleS3Path: "mock/new_review.vtt",
      owner: ownerId,
    });
    console.log("Created 2 review files.");

    // --- 4. Create Daily Stats for the past few days ---
    console.log("Creating daily stats...");
    for (let i = 1; i <= 3; i++) {
      await client.models.DailyStats.create({
        date: getDueDate(-i),
        reviewsCompleted: Math.floor(Math.random() * 5) + 1,
        cardsAdded: Math.floor(Math.random() * 10),
        feedbackGood: Math.floor(Math.random() * 20) + 5,
        feedbackHard: Math.floor(Math.random() * 5),
        feedbackAgain: Math.floor(Math.random() * 3),
        feedbackEasy: Math.floor(Math.random() * 15),
        owner: ownerId,
      });
    }
    console.log("Created 3 daily stats records.");

    // --- 5. Create a Notification ---
    console.log("Creating a notification...");
    await client.models.Notification.create({
      message: "Welcome to MemorAI! Your sample data has been created.",
      isRead: false,
      owner: ownerId,
    });
    console.log("Created 1 notification.");

    return {
      status: "Success",
      message: `Mock data created for user ${ownerId}.`,
      details: {
        decks: 2,
        cards: deck1CardData.length + deck2CardData.length,
        reviewFiles: 2,
        dailyStats: 3,
        notifications: 1,
      },
    };
  } catch (error) {
    console.error("Failed to create mock data:", error);
    return {
      status: "Error",
      message: "An error occurred while creating mock data.",
      details: error,
    };
  }
};
