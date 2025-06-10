import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a
  .schema({
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
      // They are null when the record is first created and updated upon job completion.
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
    }),
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
