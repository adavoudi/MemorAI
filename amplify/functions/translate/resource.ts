import { defineFunction } from "@aws-amplify/backend";

export const MODEL_ID = "us.anthropic.claude-sonnet-4-20250514-v1:0";

export const translate = defineFunction({
  entry: "./handler.ts",
  name: "translate",
  environment: {
    MODEL_ID,
  },
});
