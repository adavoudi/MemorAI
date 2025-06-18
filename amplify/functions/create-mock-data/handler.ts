import type { Schema } from "../../data/resource";
import type { AppSyncIdentityCognito } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { randomUUID } from "crypto";

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
      name: "Business Travel (Expanded)",
      owner: ownerId,
    });
    const { data: deck2 } = await client.models.Deck.create({
      name: "Restaurant Phrases",
      owner: ownerId,
    });
    console.log(`Created decks: ${deck1?.id}, ${deck2?.id}`);

    // --- 2. Create Cards for Each Deck ---
    console.log("Creating cards...");

    // Deck 1 now has 20 cards, 12 of which are due.
    const deck1CardData = [
      // Due Cards (12 total)
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
        front: "The check, please.",
        back: "Die Rechnung, bitte.",
        dueOffset: -5,
      }, // Due 5 days ago
      {
        front: "My laptop is not working.",
        back: "Mein Laptop funktioniert nicht.",
        dueOffset: -1,
      }, // Due yesterday
      {
        front: "Where is the nearest ATM?",
        back: "Wo ist der nächste Geldautomat?",
        dueOffset: -2,
      }, // Due 2 days ago
      {
        front: "I need to print a document.",
        back: "Ich muss ein Dokument ausdrucken.",
        dueOffset: 0,
      }, // Due today
      {
        front: "What time is the meeting?",
        back: "Um wie viel Uhr ist das Treffen?",
        dueOffset: -3,
      }, // Due 3 days ago
      {
        front: "Can you call a taxi for me?",
        back: "Können Sie mir ein Taxi rufen?",
        dueOffset: 0,
      }, // Due today
      {
        front: "I'd like to check out.",
        back: "Ich möchte auschecken.",
        dueOffset: -1,
      }, // Due yesterday
      {
        front: "The Wi-Fi password?",
        back: "Das WLAN-Passwort?",
        dueOffset: -4,
      }, // Due 4 days ago
      {
        front: "Is breakfast included?",
        back: "Ist das Frühstück inbegriffen?",
        dueOffset: 0,
      }, // Due today

      // Not Due Cards (8 total)
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
      {
        front: "Could you help me with my luggage?",
        back: "Könnten Sie mir mit meinem Gepäck helfen?",
        dueOffset: 1,
      }, // Due tomorrow
      {
        front: "What is the best way to get to the city center?",
        back: "Was ist der beste Weg, um ins Stadtzentrum zu gelangen?",
        dueOffset: 2,
      }, // Due in 2 days
      {
        front: "I need to change my room.",
        back: "Ich muss mein Zimmer wechseln.",
        dueOffset: 5,
      }, // Due in 5 days
      {
        front: "Where can I find a good restaurant?",
        back: "Wo finde ich ein gutes Restaurant?",
        dueOffset: 8,
      }, // Due in 8 days
      {
        front: "Do you offer room service?",
        back: "Bieten Sie Zimmerservice an?",
        dueOffset: 10,
      }, // Due in 10 days
      {
        front: "How far is it to the airport?",
        back: "Wie weit ist es zum Flughafen?",
        dueOffset: 14,
      }, // Due in 2 weeks
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
        front: "The bill, please.",
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
      if (newCard) {
        createdCardIdsDeck1.push(newCard.cardId);
      }
    }

    for (const card of deck2CardData) {
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
    // Note: We'll just use the first few cards for the review files for simplicity.
    console.log("Creating review files...");
    if (createdCardIdsDeck1.length >= 4) {
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
        statusCode: "ready",
        statusMessage: "Ready",
        cardsBackText: deck1CardData
          .slice(0, 2)
          .map((c) => c.back)
          .join("\n"),
        cardsFrontText: deck1CardData
          .slice(0, 2)
          .map((c) => c.front)
          .join("\n"),
      });
      await client.models.ReviewFile.create({
        deckId: deck1!.id,
        cardIds: [createdCardIdsDeck1[1], createdCardIdsDeck1[3]],
        cardCount: 2,
        isListened: false,
        s3Path: "mock/new_review.mp3",
        subtitleS3Path: "mock/new_review.vtt",
        owner: ownerId,
        statusCode: "ready",
        statusMessage: "Ready",
        cardsBackText: deck1CardData
          .slice(3, 5)
          .map((c) => c.back)
          .join("\n"),
        cardsFrontText: deck1CardData
          .slice(3, 5)
          .map((c) => c.front)
          .join("\n"),
      });
      console.log("Created 2 review files.");
    } else {
      console.log("Skipping review file creation due to insufficient cards.");
    }

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
    // It's good practice to cast the error to access its properties safely.
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: "Error",
      message: "An error occurred while creating mock data.",
      details: {
        name: error instanceof Error ? error.name : "UnknownError",
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      },
    };
  }
};
