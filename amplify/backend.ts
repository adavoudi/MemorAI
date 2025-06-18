import {
  startReviewGeneration,
  processCardSet,
  SNS_TOPIC_NAME,
  SQS_QUEUE_NAME,
  notifyCompletion,
} from "./functions/review-generation/resource";
import { translate } from "./functions/translate/resource";
import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource.js";
import { data } from "./data/resource.js";
import { createMockData } from "./functions/create-mock-data/resource.js";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { storage } from "./storage/resource";
import * as sns from "aws-cdk-lib/aws-sns";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Duration } from "aws-cdk-lib";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { LambdaSubscription } from "aws-cdk-lib/aws-sns-subscriptions";

export const backend = defineBackend({
  auth,
  data,
  storage,
  createMockData,
  translate,
  startReviewGeneration,
  processCardSet,
  notifyCompletion,
});

// backend.storage.resources.bucket.grantPublicAccess("polly/*");

const customResourceStack = backend.createStack("CustomResources");

const topic = new sns.Topic(customResourceStack, "MySnsTopic", {
  displayName: "AWS Polly Notification Topic",
  topicName: SNS_TOPIC_NAME,
});

topic.grantPublish(backend.processCardSet.resources.lambda);
topic.grantSubscribe(backend.notifyCompletion.resources.lambda);

topic.addSubscription(
  new LambdaSubscription(backend.notifyCompletion.resources.lambda)
);

const dynamoTable = new dynamodb.Table(
  customResourceStack,
  "GenerateReviewFilesLock",
  {
    partitionKey: { name: "deckId", type: dynamodb.AttributeType.STRING },
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    timeToLiveAttribute: "ttl",
    tableName: "generate-review-files-lock",
  }
);

dynamoTable.grantReadWriteData(backend.startReviewGeneration.resources.lambda);

// create sqs queue
const queue = new sqs.Queue(customResourceStack, "GenerateReviewFilesQueue", {
  queueName: SQS_QUEUE_NAME,
  visibilityTimeout: Duration.seconds(300),
});

queue.grantSendMessages(backend.startReviewGeneration.resources.lambda);

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

backend.processCardSet.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["polly:StartSpeechSynthesisTask"],
    resources: ["*"],
  })
);

backend.processCardSet.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["s3:GetObject"],
    resources: ["arn:aws:s3:::memorai-secret-files/*"],
  })
);

backend.startReviewGeneration.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      "bedrock:InvokeModel",
      "bedrock:CreateInferenceProfile",
      "bedrock:TagResource",
    ],
    resources: [
      `arn:aws:bedrock:*::foundation-model/*`,
      `arn:aws:bedrock:*:*:inference-profile/*`,
      `arn:aws:bedrock:*:*:async-invoke/*`,
    ],
  })
);

const eventSource = new SqsEventSource(queue, {
  batchSize: 1,
  maxConcurrency: 2,
});

backend.processCardSet.resources.lambda.addEventSource(eventSource);
