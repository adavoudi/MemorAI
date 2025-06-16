import type { Context, SQSEvent } from "aws-lambda";
import { getTextFromS3 } from "./services/s3Service";
import { generateStoryAndSsml } from "./services/bedrockService";
import { startSpeechSynthesis } from "./services/pollyService";
import { config } from "./config";
import { getSnsTopicArn } from "./utils/utils";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import { Schema } from "../../data/resource";
import { env } from "$amplify/env/generate-review-files";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);

// Configure clients
Amplify.configure(resourceConfig, libraryOptions);
const data_client = generateClient<Schema>({ authMode: "iam" });

export const handler = async (event: SQSEvent, context: Context) => {
  const [prompt_story, prompt_ssml] = await Promise.all([
    getTextFromS3(config.s3.secretBucket, "prompt-story.md"),
    getTextFromS3(config.s3.secretBucket, "prompt-ssml.md"),
  ]);

  for (const record of event.Records) {
    try {
      const payload = JSON.parse(record.body);
      const { deckId, reviewFileId, cards, ownerId } = payload;

      console.log(
        `[process-card-set] Processing reviewFileId: ${reviewFileId} for deckId: ${deckId}`
      );

      // const ssmlOutput = await generateStoryAndSsml(
      //   cards,
      //   prompt_story,
      //   prompt_ssml
      // );

      const ssmlOutput = "<speak>Hello world</speak>";

      const pollySpeechMarkTask = await startSpeechSynthesis(
        ssmlOutput,
        `polly/${reviewFileId}/${ownerId}/`,
        undefined,
        true
      );

      data_client.models.ReviewFile.update({
        id: reviewFileId,
        subtitleS3Path: pollySpeechMarkTask.SynthesisTask?.OutputUri,
      });

      console.log(
        `[process-card-set] Polly speech mark task started for reviewFileId ${reviewFileId}. URI: ${pollySpeechMarkTask.SynthesisTask?.OutputUri}`
      );

      const pollyTask = await startSpeechSynthesis(
        ssmlOutput,
        `polly/${reviewFileId}/${ownerId}/`,
        getSnsTopicArn(
          context.invokedFunctionArn,
          config.sns.pollyCompletionTopicName
        )
      );

      data_client.models.ReviewFile.update({
        id: reviewFileId,
        s3Path: pollyTask.SynthesisTask?.OutputUri,
      });

      console.log(
        `[process-card-set] Polly task started for reviewFileId ${reviewFileId}. URI: ${pollyTask.SynthesisTask?.OutputUri}`
      );
    } catch (error) {
      console.error(
        `[process-card-set] Failed to process record: ${record.messageId}`,
        error
      );
      // Depending on retry policy, the message might be re-processed or sent to a DLQ.
      // Throwing an error will cause SQS to retry the message based on queue configuration.
      throw error;
    }
  }
};
