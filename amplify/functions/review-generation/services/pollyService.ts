import { StartSpeechSynthesisTaskCommand } from "@aws-sdk/client-polly";
import { config } from "../config";

const pollyClient = config.clients.polly;

/**
 * Starts a speech synthesis task in Amazon Polly.
 * @param ssmlText The SSML text to be synthesized.
 * @param snsTopicArn The ARN of the SNS topic to notify upon completion.
 * @returns A promise that resolves to the result of the synthesis task command.
 */
export const startSpeechSynthesis = async (
  ssmlText: string,
  s3KeyPrefix: string,
  snsTopicArn: string | undefined = undefined,
  speechMark: boolean = false
) => {
  const command = new StartSpeechSynthesisTaskCommand({
    OutputFormat: speechMark ? "json" : config.polly.outputFormat,
    SampleRate: config.polly.sampleRate,
    Text: ssmlText,
    TextType: "ssml",
    VoiceId: config.polly.voiceId,
    OutputS3BucketName: config.s3.storageBucket,
    SnsTopicArn: snsTopicArn,
    Engine: config.polly.engine,
    OutputS3KeyPrefix: s3KeyPrefix,
    SpeechMarkTypes: speechMark ? ["sentence"] : [],
  });

  try {
    const result = await pollyClient.send(command);
    console.log("Polly task started successfully.");
    return result;
  } catch (error) {
    console.error("Failed to start Polly synthesis task:", error);
    throw new Error("Failed to start speech synthesis.", { cause: error });
  }
};
