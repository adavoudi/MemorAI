import { defineFunction } from "@aws-amplify/backend";

export const createMockData = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: "create-mock-data",
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: "./handler.ts",
  timeoutSeconds: 60,
});
