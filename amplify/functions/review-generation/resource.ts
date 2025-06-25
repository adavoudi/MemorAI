import { defineFunction, secret } from "@aws-amplify/backend";

export const MODEL_ID = "claude-sonnet-4-0";
// export const SNS_TOPIC_NAME = `polly-notifications-${process.env.AWS_APP_ID}`;
// export const SQS_QUEUE_NAME = `generate-review-files-queue-${process.env.AWS_APP_ID}`;

export const startReviewGeneration = defineFunction({
  name: "start-review-generation",
  entry: "./start-review-generation.ts",
  timeoutSeconds: 300,
  environment: {
    // SQS_QUEUE_NAME,
  },
});

export const processCardSet = defineFunction({
  name: "process-card-set",
  entry: "./process-card-set.ts",
  timeoutSeconds: 300,
  environment: {
    MODEL_ID,
    ANTHROPIC_API_KEY: secret("ANTHROPIC_API_KEY"),
    // SNS_TOPIC_NAME,
  },
});

export const notifyCompletion = defineFunction({
  name: "notify-completion",
  entry: "./notify-completion.ts",
  timeoutSeconds: 300,
});
