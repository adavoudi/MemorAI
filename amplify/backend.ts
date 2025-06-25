import { defineBackend } from "@aws-amplify/backend";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Duration } from "aws-cdk-lib";
import * as sns from "aws-cdk-lib/aws-sns";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { LambdaSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";

// Import resources
import { auth } from "./auth/resource.js";
import { data } from "./data/resource.js";
import { storage } from "./storage/resource";
import { createMockData } from "./functions/create-mock-data/resource.js";
import { translate } from "./functions/translate/resource";
import {
  startReviewGeneration,
  processCardSet,
  notifyCompletion,
} from "./functions/review-generation/resource";

// Configuration constants
const CONFIG = {
  SNS_TOPIC: {
    displayName: "AWS Polly Notification Topic",
  },
  DYNAMODB: {
    lockTable: {
      partitionKey: { name: "deckId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl",
    },
  },
  SQS: {
    visibilityTimeout: Duration.seconds(300),
    eventSource: {
      batchSize: 1,
      maxConcurrency: 2,
    },
  },
  BEDROCK_ARNS: {
    foundationModel: `arn:aws:bedrock:*::foundation-model/*`,
    inferenceProfile: `arn:aws:bedrock:*:*:inference-profile/*`,
    asyncInvoke: `arn:aws:bedrock:*:*:async-invoke/*`,
  },
} as const;

// Define backend
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

// Setup static file deployment
function setupStaticFileDeployment() {
  new BucketDeployment(backend.storage.resources.bucket, "StaticFiles", {
    sources: [Source.asset("./prompts")],
    destinationKeyPrefix: "prompts",
    destinationBucket: backend.storage.resources.bucket,
  });
}

// Create SNS topic and configure subscriptions
function createSNSTopic(stack: any) {
  const topic = new sns.Topic(stack, "MySnsTopic", {
    displayName: CONFIG.SNS_TOPIC.displayName,
  });

  // Configure environment and permissions
  backend.processCardSet.addEnvironment("SNS_TOPIC_NAME", topic.topicName);
  topic.grantPublish(backend.processCardSet.resources.lambda);
  topic.grantSubscribe(backend.notifyCompletion.resources.lambda);

  // Add subscription
  topic.addSubscription(
    new LambdaSubscription(backend.notifyCompletion.resources.lambda)
  );

  return topic;
}

// Create DynamoDB lock table
function createLockTable(stack: any) {
  const lockTable = new dynamodb.Table(
    stack,
    "GenerateReviewFilesLock",
    CONFIG.DYNAMODB.lockTable
  );

  // Configure permissions and environment
  lockTable.grantReadWriteData(backend.startReviewGeneration.resources.lambda);
  backend.startReviewGeneration.addEnvironment(
    "LOCK_TABLE",
    lockTable.tableName
  );

  return lockTable;
}

// Create SQS queue
function createSQSQueue(stack: any) {
  const queue = new sqs.Queue(stack, "GenerateReviewFilesQueue", {
    visibilityTimeout: CONFIG.SQS.visibilityTimeout,
  });

  // Configure permissions and environment
  queue.grantSendMessages(backend.startReviewGeneration.resources.lambda);
  backend.startReviewGeneration.addEnvironment(
    "SQS_QUEUE_NAME",
    queue.queueName
  );

  return queue;
}

// Setup IAM policies for Lambda functions
function setupIAMPolicies() {
  // Translate function - Bedrock permissions
  backend.translate.resources.lambda.addToRolePolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["bedrock:InvokeModel", "bedrock:CreateInferenceProfile"],
      resources: [
        CONFIG.BEDROCK_ARNS.foundationModel,
        CONFIG.BEDROCK_ARNS.inferenceProfile,
      ],
    })
  );

  // ProcessCardSet function - Polly permissions
  backend.processCardSet.resources.lambda.addToRolePolicy(
    new PolicyStatement({
      actions: ["polly:StartSpeechSynthesisTask"],
      resources: ["*"],
    })
  );

  // StartReviewGeneration function - Extended Bedrock permissions
  backend.startReviewGeneration.resources.lambda.addToRolePolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "bedrock:InvokeModel",
        "bedrock:CreateInferenceProfile",
        "bedrock:TagResource",
      ],
      resources: [
        CONFIG.BEDROCK_ARNS.foundationModel,
        CONFIG.BEDROCK_ARNS.inferenceProfile,
        CONFIG.BEDROCK_ARNS.asyncInvoke,
      ],
    })
  );
}

// Setup SQS event source for Lambda
function setupSQSEventSource(queue: sqs.Queue) {
  const eventSource = new SqsEventSource(queue, CONFIG.SQS.eventSource);
  backend.processCardSet.resources.lambda.addEventSource(eventSource);
}

// Main setup function
function setupCustomResources() {
  const customResourceStack = backend.createStack("CustomResources");

  // Create resources
  const topic = createSNSTopic(customResourceStack);
  const lockTable = createLockTable(customResourceStack);
  const queue = createSQSQueue(customResourceStack);

  // Setup event sources
  setupSQSEventSource(queue);
}

// Execute setup
setupStaticFileDeployment();
setupCustomResources();
setupIAMPolicies();
