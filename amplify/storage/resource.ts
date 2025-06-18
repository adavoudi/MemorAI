import { defineStorage } from "@aws-amplify/backend";
import { processCardSet } from "../functions/review-generation/resource";

export const storage = defineStorage({
  name: "memorai_storage",
  access: (allow) => ({
    "polly/*": [
      allow.resource(processCardSet).to(["write"]),
      allow.authenticated.to(["read"]),
    ],
    "bedrock/*": [allow.resource(processCardSet).to(["write"])],
  }),
});
