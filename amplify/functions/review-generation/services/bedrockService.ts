import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import { Model, TextBlock } from "@anthropic-ai/sdk/resources";

const bedrockClient = config.clients.bedrock;
const anthropic = new Anthropic(); // Assumes ANTHROPIC_API_KEY is in env

/**
 * Generates a story and then creates SSML markup.
 * @param cards The list of cards to generate content from.
 * @param storyPrompt The base prompt for generating the story.
 * @param ssmlPrompt The base prompt for generating the SSML.
 * @returns A promise that resolves to the final SSML string.
 */
export const generateStoryAndSsml = async (
  cards: any[],
  storyPrompt: string,
  ssmlPrompt: string
): Promise<string> => {
  const cardBullets = cards.slice(0, 4).map((card) => `- ${card.backText}`);

  // 1. Generate the story
  const storyInput = `${storyPrompt}\n\n${cardBullets.join("\n")}`;
  const storyOutput = await invokeClaude(
    storyInput,
    "Generate a short story based on the user's list.",
    { max_tokens: 100 }
  );
  console.log("Generated story successfully.");

  // 2. Prepare and generate the SSML
  const parameters = {
    instructional_language_name: "English",
    instructional_language_code: "en",
    target_language_name: "German",
    target_language_code: "de",
    story: storyOutput,
    original_sentences_list: cardBullets.join("\n"),
  };

  let finalSsmlPrompt = ssmlPrompt;
  for (const [key, value] of Object.entries(parameters)) {
    finalSsmlPrompt = finalSsmlPrompt.replace(
      new RegExp(`{${key}}`, "g"),
      value
    );
  }

  const ssmlOutput = await invokeClaude(
    finalSsmlPrompt,
    "Generate SSML markup based on the user's provided story and sentences.",
    { max_tokens: 100 }
  );
  console.log("Generated SSML successfully.");

  return ssmlOutput;
};

/**
 * Invokes a Claude model on Bedrock or via Anthropic's SDK.
 * @param prompt The input text prompt for the model.
 * @param systemPrompt The system prompt to guide the model's behavior.
 * @param options Additional options like max_tokens.
 * @returns A promise that resolves to the model's text response.
 */
async function invokeClaude(
  prompt: string,
  systemPrompt: string,
  options: { max_tokens?: number; model?: Model } = {}
): Promise<string> {
  const { max_tokens = 2000, model = config.bedrock.modelId as Model } =
    options;

  try {
    console.log(`Invoking Claude model: ${model}`);
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: max_tokens,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = (response.content[0] as TextBlock).text;
    if (typeof responseText !== "string") {
      throw new Error("Failed to parse a valid text response from the model.");
    }
    return responseText;
  } catch (error) {
    console.error("Error invoking Claude model:", error);
    throw new Error(`Claude invocation failed: ${(error as Error).message}`);
  }
}
