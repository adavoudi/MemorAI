import { MODEL_ID, translate } from "./functions/translate/resource";
import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource.js";
import { data } from "./data/resource.js";
import { createMockData } from "./functions/create-mock-data/resource.js";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

export const backend = defineBackend({
  auth,
  data,
  createMockData,
  translate,
});

backend.translate.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["bedrock:InvokeModel", "bedrock:CreateInferenceProfile"],
    resources: [
      `arn:aws:bedrock:*::foundation-model/*`,
      `arn:aws:bedrock:*:*:inference-profile/*`,
    ],
  })
);
