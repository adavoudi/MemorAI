import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a
  .schema({
    User: a
      .model({
        owner: a.string().required(),
        firstName: a.string().required(),
        lastName: a.string().required(),
        sourceLanguage: a.enum(["English"]),
        targetLanguage: a.enum(["German"]),
      })
      .identifier(["owner"]),

    Deck: a.model({
      name: a.string().required(),
      cards: a.hasMany("Card", "deckId"),
      reviewFiles: a.hasMany("ReviewFile", "deckId"),
    }),

    Card: a
      .model({
        cardId: a.id().required(),
        frontText: a.string().required(),
        backText: a.string().required(),
        srsDueDate: a.date().required(),
        srsInterval: a.integer().required().default(1),
        srsEaseFactor: a.float().required().default(2.5),
        reviewInclusionDate: a.date(),
        deckId: a.id().required(),
        deck: a.belongsTo("Deck", "deckId"),
      })
      .identifier(["cardId"])
      .secondaryIndexes((index) => [index("deckId").sortKeys(["srsDueDate"])]),

    ReviewFile: a.model({
      s3Path: a.string(),
      subtitleS3Path: a.string(),
      cardCount: a.integer().required(),
      isListened: a.boolean().required().default(false),
      lastListenedAt: a.datetime(),
      cardIds: a.id().array(),
      deckId: a.id().required(),
      deck: a.belongsTo("Deck", "deckId"),
    }),

    Notification: a.model({
      message: a.string().required(),
      isRead: a.boolean().required().default(false),
      link: a.url(),
      // Also linked to the user via the implicit 'owner' field.
    }),
    DailyStats: a
      .model({
        date: a.date().required(),
        owner: a.string().required(),
        reviewsCompleted: a.integer().required().default(0),
        cardsAdded: a.integer().required().default(0),
        feedbackAgain: a.integer().required().default(0),
        feedbackHard: a.integer().required().default(0),
        feedbackGood: a.integer().required().default(0),
        feedbackEasy: a.integer().required().default(0),
      })
      .identifier(["owner", "date"]),
  })
  .authorization((allow) => [
    allow.owner().to(["create", "read", "update", "delete"]),
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
