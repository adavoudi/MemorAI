import type { Schema } from "../../data/resource";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from "@aws-sdk/client-bedrock-runtime";

// initialize bedrock runtime client
const client = new BedrockRuntimeClient();

export const handler: Schema["translate"]["functionHandler"] = async (
  event,
  context
) => {
  const inputText = event.arguments.inputText;

  const systemPrompt =
    "You are a translator. The user gives you a English text and you should translate it to German both formally and informally.\n" +
    "The output must be a json object in the following format (don't add any other explanation, just the following) as I want to parse it with \n" +
    "the JSON.parse() function in JavaScript:\n" +
    ' {"formal": "the formal translation (for formal writing/speaking)", "informal": "the informal translation (for informal writing/speaking)"}';

  // Invoke model
  const input = {
    modelId: process.env.MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: inputText,
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.5,
    }),
  } as InvokeModelCommandInput;

  const command = new InvokeModelCommand(input);

  const response = await client.send(command);

  // Parse the response and return the generated haiku
  const data = JSON.parse(Buffer.from(response.body).toString());

  return data.content[0].text;
};
