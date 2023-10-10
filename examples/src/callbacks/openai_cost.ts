import {
  OpenAiTokenCost,
  OpenAiCostCallbackHandler,
} from "langchain/callbacks";
import { LLMChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";

export const run = async () => {
  const modelName = "text-davinci-003";

  const handler = new OpenAiCostCallbackHandler(modelName);
  const llm = new OpenAI({ modelName, temperature: 0, callbacks: [handler] });

  // use the llm in a chain
  const prompt = PromptTemplate.fromTemplate("1 + {number} =");
  const chain = new LLMChain({ prompt, llm });
  const output = await chain.call({ number: 2 });
  console.log(output);
  /*
  { text: ' 3\n\n3 - 1 = 2' }
   */

  // display the token usage
  console.log(`Prompt Tokens: ${handler.promptTokens}`);
  console.log(`Completion Tokens: ${handler.completionTokens}`);
  console.log(`Total Tokens: ${handler.totalTokens}`);

  // Total Tokens: 12
  // Prompt Tokens: 4
  // Completion Tokens: 8

  const openaiCost = OpenAiTokenCost.fromCallbackHandler(handler);
  console.log(`Total Cost:\n${openaiCost}`);

  // Total Cost:
  // - promptCost       0.0000800-usd (33.33%)
  // - completionCost   0.0001600-usd (66.67%)
  // - totalCost        0.0002400-usd (4166.67 per usd)
  // - unAccountedCalls 0

  // console.log({openaiCost});

  // {
  //   openaiCost: OpenAiTokenCost {
  //     promptCost: 0.00008,
  //     completionCost: 0.00016,
  //     totalCost: 0.00024000000000000003,
  //     unAccountedCalls: 0
  //   }
  // }
};
