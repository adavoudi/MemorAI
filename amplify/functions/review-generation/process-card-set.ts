import type { Context, SQSEvent } from "aws-lambda";
import { generateStoryAndSsml } from "./services/bedrockService";
import { startSpeechSynthesis } from "./services/pollyService";
import { config } from "./config";
import { getSnsTopicArn } from "./utils/utils";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import { Schema } from "../../data/resource";
import { env } from "$amplify/env/process-card-set";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { getTextFromS3 } from "./services/s3Service";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);

// Configure clients
Amplify.configure(resourceConfig, libraryOptions);
const data_client = generateClient<Schema>({ authMode: "iam" });

export const handler = async (event: SQSEvent, context: Context) => {
  const [prompt_story, prompt_ssml] = await Promise.all([
    getTextFromS3(config.s3.storageBucket!, "prompts/prompt-story.md"),
    getTextFromS3(config.s3.storageBucket!, "prompts/prompt-ssml.md"),
  ]);

  for (const record of event.Records) {
    const payload = JSON.parse(record.body);
    const { deckId, reviewFileId, cards, ownerId } = payload;
    try {
      console.log(
        `[process-card-set] Processing reviewFileId:  ${reviewFileId} for deckId: ${deckId}`
      );

      await data_client.models.ReviewFile.update({
        id: reviewFileId,
        statusCode: "processing",
        statusMessage: "Processing",
      });

      const ssmlOutput = await generateStoryAndSsml(
        cards,
        prompt_story,
        prompt_ssml
      );

      console.log("SSML output:", ssmlOutput);

      const pollySpeechMarkTask = await startSpeechSynthesis(
        ssmlOutput,
        `polly/${reviewFileId}/${ownerId}/`,
        undefined,
        true
      );

      await data_client.models.ReviewFile.update({
        id: reviewFileId,
        subtitleS3Path: `polly/${pollySpeechMarkTask.SynthesisTask?.OutputUri?.split("/polly/")[1]}`,
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

      await data_client.models.ReviewFile.update({
        id: reviewFileId,
        s3Path: `polly/${pollyTask.SynthesisTask?.OutputUri?.split("/polly/")[1]}`,
      });

      console.log(
        `[process-card-set] Polly task started for reviewFileId ${reviewFileId}. URI: ${pollyTask.SynthesisTask?.OutputUri}`
      );
    } catch (error) {
      console.error(
        `[process-card-set] Failed to process record: ${record.messageId}`,
        error
      );
      await data_client.models.ReviewFile.update({
        id: reviewFileId,
        statusCode: "error",
        statusMessage: error as string,
      });
      throw error;
    }
  }
};
