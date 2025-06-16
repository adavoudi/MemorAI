import { PutItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { config } from "../config";

const { dynamodb } = config.clients;
const { lockTable, lockTimeoutSeconds } = config.dynamodb;

/**
 * Attempts to acquire a lock for a specific deckId.
 * @param deckId The ID of the deck to lock.
 * @returns A promise that resolves to true if the lock was acquired, false otherwise.
 */
export const acquireLock = async (deckId: string): Promise<boolean> => {
  const now = Math.floor(Date.now() / 1000);
  const ttl = now + lockTimeoutSeconds;

  const params = {
    TableName: lockTable,
    Item: marshall({ deckId, lockAcquiredAt: now, ttl }),
    ConditionExpression: "attribute_not_exists(deckId)",
  };

  try {
    await dynamodb.send(new PutItemCommand(params));
    console.log(`Lock acquired for deckId: ${deckId}`);
    return true;
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      return false; // Lock is already held
    }
    console.error("Error acquiring lock:", error);
    throw error; // Rethrow other errors
  }
};

/**
 * Releases a previously acquired lock.
 * @param deckId The ID of the deck to release the lock for.
 */
export const releaseLock = async (deckId: string): Promise<void> => {
  const params = {
    TableName: lockTable,
    Key: marshall({ deckId }),
  };

  try {
    await dynamodb.send(new DeleteItemCommand(params));
    console.log(`Lock released for deckId: ${deckId}`);
  } catch (error) {
    console.error("Error releasing lock:", error);
    // Don't rethrow, as we want the main function to complete its response
  }
};
