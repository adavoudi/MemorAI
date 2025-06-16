/**
 * @file Manages all database interactions.
 */
import { generateClient } from "aws-amplify/api";
import type { Schema } from "../../../data/resource";
import { getDate } from "../utils/utils";

type DataClient = ReturnType<typeof generateClient<Schema>>;
type Card = Schema["Card"]["type"];

export const getReviewableCards = async (
  client: DataClient,
  deckId: string
): Promise<Card[]> => {
  const { data: cards, errors } = await client.models.Card.list({
    filter: {
      deckId: { eq: deckId },
      srsDueDate: { lt: getDate(1) },
      reviewInclusionDate: { ne: getDate(0) },
    },
  });
  if (errors) throw new Error(errors[0].message);
  return cards;
};
