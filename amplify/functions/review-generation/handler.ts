// import type { Schema } from "../../data/resource";
// import { Amplify } from "aws-amplify";
// import { generateClient } from "aws-amplify/data";
// import { env } from "$amplify/env/generate-review-files";

// import { config } from "./config";
// import { acquireLock, releaseLock } from "./services/lockingService";
// import { getTextFromS3 } from "./services/s3Service";
// import { generateStoryAndSsml } from "./services/bedrockService";
// import { startSpeechSynthesis } from "./services/pollyService";
// import { getDate, getSnsTopicArn } from "./utils/utils";

// // Configure Amplify
// Amplify.configure(config.amplify, { ssr: true });
// const data_client = generateClient<Schema>();

// export const handler: Schema["startReviewGeneration"]["functionHandler"] =
//   async (event, context) => {
//     const { deckId } = event.arguments;
//     console.log(`Processing request for deckId: ${deckId}`);

//     // 1. Acquire lock to prevent concurrent processing
//     const lockAcquired = await acquireLock(deckId);
//     if (!lockAcquired) {
//       console.log(`Lock already held for deckId: ${deckId}. Aborting.`);
//       return {
//         statusCode: 429, // Too Many Requests
//         body: JSON.stringify({
//           message: "Another request for this deck is already in progress.",
//         }),
//       };
//     }

//     try {
//       // 2. Fetch required prompts from S3
//       const [prompt_story, prompt_ssml] = await Promise.all([
//         getTextFromS3(config.s3.secretBucket, "prompt-story.md"),
//         getTextFromS3(config.s3.secretBucket, "prompt-ssml.md"),
//       ]);

//       // 3. Fetch cards ready for review
//       const { data: cards, errors: cardErrors } =
//         await data_client.models.Card.list({
//           filter: {
//             deckId: { eq: deckId },
//             srsDueDate: { lt: getDate(1) },
//             reviewInclusionDate: { ne: getDate(0) },
//           },
//         });

//       if (cardErrors) throw new Error(cardErrors[0].message);

//       if (cards.length < 1) {
//         console.log("No cards eligible for review.");
//         return {
//           statusCode: 400,
//           body: JSON.stringify({
//             message: "Not enough cards to generate review files.",
//           }),
//         };
//       }

//       // 4. Generate story and SSML from card content
//       const ssmlOutput = await generateStoryAndSsml(
//         cards,
//         prompt_story,
//         prompt_ssml
//       );

//       // 5. Start Polly speech synthesis task
//       const snsTopicArn = getSnsTopicArn(context.invokedFunctionArn);
//       // const pollyTask = await startSpeechSynthesis(ssmlOutput, snsTopicArn);

//       // console.log(
//       //   "Processing complete. Polly task started:",
//       //   pollyTask.SynthesisTask?.TaskId
//       // );
//       return {
//         statusCode: 200,
//         body: JSON.stringify({
//           message: "Successfully initiated review file generation.",
//           // taskId: pollyTask.SynthesisTask?.TaskId,
//         }),
//       };
//     } catch (error) {
//       console.error("An error occurred during processing:", error);
//       return {
//         statusCode: 500,
//         body: JSON.stringify({
//           message: `An unexpected error occurred: ${(error as Error).message}`,
//         }),
//       };
//     } finally {
//       // 6. Release the lock
//       if (lockAcquired) {
//         await releaseLock(deckId);
//       }
//     }
//   };
