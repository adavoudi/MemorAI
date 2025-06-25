import { defineFunction, secret } from "@aws-amplify/backend";

export const MODEL_ID = "claude-sonnet-4-0";

export const startReviewGeneration = defineFunction({
  name: "start-review-generation",
  entry: "./start-review-generation.ts",
  timeoutSeconds: 300,
});

export const processCardSet = defineFunction({
  name: "process-card-set",
  entry: "./process-card-set.ts",
  timeoutSeconds: 300,
  environment: {
    MODEL_ID,
    ANTHROPIC_API_KEY: secret("ANTHROPIC_API_KEY"),
  },
});

export const notifyCompletion = defineFunction({
  name: "notify-completion",
  entry: "./notify-completion.ts",
  timeoutSeconds: 300,
});
