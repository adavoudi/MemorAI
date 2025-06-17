import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { v4 as uuidv4 } from "uuid";

import { config } from "./config";
import { acquireLock, releaseLock } from "./services/lockingService";
import { getReviewableCards } from "./services/dataService";
import { chunkArray, getDate, getSqsQueueUrl } from "./utils/utils";

import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/generate-review-files";
import { AppSyncIdentityCognito } from "aws-lambda";
const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);

// Configure clients
Amplify.configure(resourceConfig, libraryOptions);
const data_client = generateClient<Schema>();

const sqsClient = new SQSClient({});

export const handler: Schema["startReviewGeneration"]["functionHandler"] =
  async (event, context) => {
    const identity = event.identity as AppSyncIdentityCognito;
    const ownerId = identity.username;
    const { deckId } = event.arguments;
    console.log(
      `[start-review-generation] Processing request for deckId: ${deckId}`
    );

    const lockAcquired = await acquireLock(deckId);
    if (!lockAcquired) {
      return {
        statusCode: 429,
        body: JSON.stringify({
          message: "Review generation for this deck is already in progress.",
        }),
      };
    }

    try {
      const cards = await getReviewableCards(data_client, deckId);

      if (cards.length < 5) {
        console.log(
          `[start-review-generation] Not enough cards. Found ${cards.length}, require at least 5.`
        );
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "At least 5 cards are required to generate a review file.",
          }),
        };
      }

      // Chunk cards into groups of 5-7.
      const cardChunks = chunkArray(cards, 5, 7);
      let messagesSent = 0;

      for (const chunk of cardChunks) {
        // set the cards as reviewInclusionDate to today
        const updatePromises = chunk.map((card) => {
          return data_client.models.Card.update({
            cardId: card.cardId,
            reviewInclusionDate: getDate(0),
          });
        });

        await Promise.all(updatePromises);

        const reviewFileId = uuidv4();
        data_client.models.ReviewFile.create({
          id: reviewFileId,
          owner: ownerId,
          deckId: deckId,
          cardCount: chunk.length,
          cardIds: chunk.map((c) => c.cardId),
          isListened: false,
          statusCode: "pending",
          statusMessage: "Pending",
        });

        const messagePayload = {
          deckId: deckId,
          reviewFileId: reviewFileId,
          cards: chunk.map((c) => ({
            id: c.cardId,
            backText: c.backText,
            frontText: c.frontText,
          })),
          ownerId,
        };

        const command = new SendMessageCommand({
          QueueUrl: getSqsQueueUrl(
            context.invokedFunctionArn,
            config.sqs.queueName
          ),
          MessageBody: JSON.stringify(messagePayload),
        });

        await sqsClient.send(command);
        messagesSent++;
      }

      console.log(
        `[start-review-generation] Successfully queued ${messagesSent} review file task(s) for deckId: ${deckId}`
      );
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Successfully queued ${messagesSent} review file generation task(s).`,
        }),
      };
    } catch (error) {
      console.error("[start-review-generation] Error:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: `An unexpected error occurred: ${(error as Error).message}`,
        }),
      };
    } finally {
      if (lockAcquired) {
        await releaseLock(deckId);
      }
    }
  };
