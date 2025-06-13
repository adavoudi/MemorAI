import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { createMockData } from "../functions/create-mock-data/resource";
import { translate } from "../functions/translate/resource";

const schema = a
  .schema({
    User: a
      .model({
        owner: a
          .string()
          .required()
          .authorization((allow) => [
            allow.ownerDefinedIn("owner").to(["read", "create"]),
          ]),
        firstName: a.string().required(),
        lastName: a.string().required(),
        sourceLanguage: a.enum(["English"]),
        targetLanguage: a.enum(["German"]),
      })
      .identifier(["owner"])
      .authorization((allow) => [
        allow.ownerDefinedIn("owner").to(["create", "read", "update"]),
      ]),

    Deck: a
      .model({
        owner: a
          .string()
          .required()
          .authorization((allow) => [
            allow.ownerDefinedIn("owner").to(["read", "create"]),
          ]),
        name: a.string().required(),
        cards: a.hasMany("Card", "deckId"),
        reviewFiles: a.hasMany("ReviewFile", "deckId"),
      })
      .authorization((allow) => [
        allow
          .ownerDefinedIn("owner")
          .to(["create", "read", "update", "delete"]),
      ]),

    Card: a
      .model({
        owner: a
          .string()
          .required()
          .authorization((allow) => [
            allow.ownerDefinedIn("owner").to(["read", "create"]),
          ]),
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
      .secondaryIndexes((index) => [index("deckId").sortKeys(["srsDueDate"])])
      .authorization((allow) => [
        allow
          .ownerDefinedIn("owner")
          .to(["create", "read", "update", "delete"]),
      ]),

    ReviewFile: a
      .model({
        owner: a
          .string()
          .required()
          .authorization((allow) => [
            allow.ownerDefinedIn("owner").to(["read"]),
          ]),
        s3Path: a.string(),
        subtitleS3Path: a.string(),
        cardCount: a.integer().required(),
        isListened: a
          .boolean()
          .required()
          .default(false)
          .authorization((allow) => [allow.owner().to(["read", "update"])]),
        lastListenedAt: a
          .datetime()
          .authorization((allow) => [allow.owner().to(["read", "update"])]),
        cardIds: a.id().array(),
        deckId: a.id().required(),
        deck: a.belongsTo("Deck", "deckId"),
      })
      .authorization((allow) => [allow.ownerDefinedIn("owner").to(["read"])]),

    Notification: a
      .model({
        owner: a
          .string()
          .required()
          .authorization((allow) => [
            allow.ownerDefinedIn("owner").to(["read"]),
          ]),
        message: a
          .string()
          .required()
          .authorization((allow) => [allow.owner().to(["read"])]),
        isRead: a.boolean().required().default(false),
        link: a.url().authorization((allow) => [allow.owner().to(["read"])]),
      })
      .authorization((allow) => [
        allow.ownerDefinedIn("owner").to(["read", "update"]),
      ]),
    DailyStats: a
      .model({
        owner: a
          .string()
          .required()
          .authorization((allow) => [
            allow.ownerDefinedIn("owner").to(["read", "create"]),
          ]),
        date: a.date().required(),
        reviewsCompleted: a.integer().required().default(0),
        cardsAdded: a.integer().required().default(0),
        feedbackAgain: a.integer().required().default(0),
        feedbackHard: a.integer().required().default(0),
        feedbackGood: a.integer().required().default(0),
        feedbackEasy: a.integer().required().default(0),
      })
      .identifier(["owner", "date"])
      .authorization((allow) => [
        // This rule still applies to the model as a whole.
        allow.ownerDefinedIn("owner").to(["read", "update", "create"]),
      ]),

    createMockData: a
      .query()
      .returns(a.json())
      .handler(a.handler.function(createMockData))
      .authorization((allow) => [allow.authenticated()]),

    translate: a
      .query()
      .arguments({ inputText: a.string().required() })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(translate)),
  })
  .authorization((allow) => [allow.resource(createMockData)]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
