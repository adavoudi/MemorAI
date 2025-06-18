import type { SNSEvent } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../data/resource";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/notify-completion";
const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);

// Configure clients
Amplify.configure(resourceConfig, libraryOptions);
const data_client = generateClient<Schema>({ authMode: "iam" });

export const handler = async (event: SNSEvent) => {
  for (const record of event.Records) {
    try {
      const snsMessage = JSON.parse(record.Sns.Message);
      const { taskId, outputUri, taskStatus } = snsMessage;

      if (taskStatus !== "COMPLETED") {
        console.log(
          `[save-review-file] Received non-completed task for Polly TaskId: ${taskId}`
        );
        continue;
      }

      console.log(
        `[save-review-file] Received completion for Polly TaskId: ${taskId}`
      );

      // Example outputUri: "s3://amplify-awsamplifygen2-al-memoraistoragebucket9519-kwhrai4vdwsl/polly/3c69c4e5-0926-4522-9533-99ea20329f25/ownerID/.ab9ed8dd-58c3-4d44-96e9-63da54e6c558.mp3"
      const uriParts = outputUri.split("/");
      const ownerId = uriParts[uriParts.length - 2];
      const reviewFileId = uriParts[uriParts.length - 3];

      await data_client.models.ReviewFile.update({
        id: reviewFileId,
        statusCode: "ready",
        statusMessage: "Ready",
      });

      const output = await data_client.models.Notification.create({
        message: `One review file is ready for review. Click to start listening.`,
        isRead: false,
        owner: ownerId,
        link: `/review/play/${reviewFileId}`,
      });

      console.log(output);

      console.log(
        `[save-review-file] Successfully saved review file record ${reviewFileId} for owner ${ownerId}`
      );
    } catch (error) {
      console.error(`[save-review-file] Failed to process SNS message:`, error);
      // Errors here should be logged. Retrying won't help if the message is malformed.
    }
  }
};
