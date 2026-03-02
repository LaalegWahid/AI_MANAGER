import { BedrockAgentRuntimeClient } from "@aws-sdk/client-bedrock-agent-runtime";

// Just let AWS SDK auto-load credentials from env
export const bedrockClient = new BedrockAgentRuntimeClient({
  region: "eu-west-3",
});