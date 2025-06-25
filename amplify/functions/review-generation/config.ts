import { PollyClient } from "@aws-sdk/client-polly";
import { SNSClient } from "@aws-sdk/client-sns";
import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { OutputFormat, VoiceId, Engine } from "@aws-sdk/client-polly";

export const config = {
  clients: {
    polly: new PollyClient(),
    sns: new SNSClient(),
    s3: new S3Client(),
    dynamodb: new DynamoDBClient(),
    bedrock: new BedrockRuntimeClient(),
  },
  dynamodb: {
    lockTable: process.env.LOCK_TABLE,
    lockTimeoutSeconds: 180,
  },
  s3: {
    storageBucket: process.env.MEMORAI_STORAGE_BUCKET_NAME,
  },
  bedrock: {
    modelId: process.env.MODEL_ID,
  },
  polly: {
    voiceId: "Vicki" as VoiceId,
    languageCode: "de-DE",
    engine: "neural" as Engine,
    sampleRate: "24000",
    outputFormat: "mp3" as OutputFormat,
  },
  sqs: {
    queueName: process.env.SQS_QUEUE_NAME || "",
  },
  sns: {
    pollyCompletionTopicName: process.env.SNS_TOPIC_NAME || "",
  },
};
