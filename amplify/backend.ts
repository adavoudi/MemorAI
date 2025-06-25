import { defineBackend } from "@aws-amplify/backend";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Duration } from "aws-cdk-lib";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as actions from "aws-cdk-lib/aws-cloudwatch-actions";
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
  CLOUDWATCH: {
    alarm: {
      threshold: 1,
      evaluationPeriods: 1,
      metricPeriod: Duration.minutes(5),
    },
    // email: "your-email@example.com",
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

// Create shared SNS topic for error notifications
function createSharedAlarmTopic(stack: any) {
  const alarmTopic = new sns.Topic(stack, "LambdaErrorAlarmTopic", {
    displayName: "Lambda Error Notifications",
  });

  // Subscribe email to the topic
  // alarmTopic.addSubscription(
  //   new subscriptions.EmailSubscription(CONFIG.CLOUDWATCH.email)
  // );

  return alarmTopic;
}

// Create CloudWatch alarm for a specific Lambda function
function createLambdaErrorAlarm(
  functionName: string,
  lambdaFunction: any,
  alarmTopic: sns.Topic
) {
  const errorAlarm = new cloudwatch.Alarm(
    lambdaFunction.resources.lambda.stack,
    `${functionName}ErrorAlarm`,
    {
      alarmName: `${functionName}-ErrorAlarm`,
      alarmDescription: `Alarm when ${functionName} Lambda function errors exceed threshold`,
      metric: new cloudwatch.Metric({
        namespace: "AWS/Lambda",
        metricName: "Errors",
        dimensionsMap: {
          FunctionName: lambdaFunction.resources.lambda.functionName,
        },
        statistic: "Sum",
        period: CONFIG.CLOUDWATCH.alarm.metricPeriod,
      }),
      threshold: CONFIG.CLOUDWATCH.alarm.threshold,
      evaluationPeriods: CONFIG.CLOUDWATCH.alarm.evaluationPeriods,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }
  );

  // Add SNS notification to the alarm
  errorAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));

  return errorAlarm;
}

// Setup CloudWatch monitoring for all Lambda functions
function setupCloudWatchMonitoring(customResourceStack: any) {
  // Create shared SNS topic in the custom resources stack
  const alarmTopic = createSharedAlarmTopic(customResourceStack);

  // Create alarms for each Lambda function in their respective stacks
  const lambdaFunctions = [
    { name: "StartReviewGeneration", lambda: backend.startReviewGeneration },
    { name: "ProcessCardSet", lambda: backend.processCardSet },
    { name: "NotifyCompletion", lambda: backend.notifyCompletion },
    { name: "Translate", lambda: backend.translate },
    { name: "CreateMockData", lambda: backend.createMockData },
  ];

  lambdaFunctions.forEach(({ name, lambda }) => {
    createLambdaErrorAlarm(name, lambda, alarmTopic);
  });
}

// Main setup function
function setupCustomResources() {
  const customResourceStack = backend.createStack("CustomResources");

  // Create resources
  const topic = createSNSTopic(customResourceStack);
  const lockTable = createLockTable(customResourceStack);
  const queue = createSQSQueue(customResourceStack);

  // Setup event sources and monitoring
  setupSQSEventSource(queue);
  setupCloudWatchMonitoring(customResourceStack);
}

// Execute setup
setupStaticFileDeployment();
setupCustomResources();
setupIAMPolicies();
