import {
  OpenAiTokenCost,
  OpenAiCostCallbackHandler,
} from "langchain/callbacks";
import { LLMChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";

export const run = async () => {
  // Chain 1
  const modelName1 = "text-davinci-003";
  const cbHandler1 = new OpenAiCostCallbackHandler(modelName1);
  const llm1 = new OpenAI({ modelName: modelName1, temperature: 0, callbacks: [cbHandler1] });
  const chain1 = new LLMChain({ prompt: PromptTemplate.fromTemplate("1 + {number} ="), llm: llm1 });
  const output1 = await chain1.call({ number: 2 });
  console.log(output1);
  // { text: ' 3\n\n3 - 1 = 2' }

  // Chain 2
  const modelName2 = "text-davinci-003";
  const cbHandler2 = new OpenAiCostCallbackHandler(modelName2);
  const llm2 = new OpenAI({ modelName: modelName2, temperature: 0, callbacks: [cbHandler2] });
  const chain2 = new LLMChain({ prompt: PromptTemplate.fromTemplate("6 - 3 + {number} ="), llm: llm2 });
  const output2 = await chain2.call({ number: 2 });
  console.log(output2);
  // { text: '\n\n4' }

  // Display the token usage
  const openaiCost1 = OpenAiTokenCost.fromCallbackHandler(cbHandler1);
  console.log(`Total Cost 1:\n${openaiCost1}`);
  // Total Cost 1:
  // - promptCost       0.0001600-usd (72.73%)
  // - completionCost   0.0000600-usd (27.27%)
  // - totalCost        0.0002200-usd (4545.45 per usd)
  // - unAccountedCalls 0

  const openaiCost2 = OpenAiTokenCost.fromCallbackHandler(cbHandler2);
  console.log(`Total Cost 2:\n${openaiCost2}`);
  // Total Cost 2:
  // - promptCost       0.0001600-usd (72.73%)
  // - completionCost   0.0000600-usd (27.27%)
  // - totalCost        0.0002200-usd (4545.45 per usd)
  // - unAccountedCalls 0

  const openaiCostCumul = openaiCost1.clone().add(openaiCost2);
  console.log(`Total Cost Cumul:\n${openaiCostCumul}`);
  // Total Cost Cumul:
  // - promptCost       0.0003200-usd (72.73%)
  // - completionCost   0.0001200-usd (27.27%)
  // - totalCost        0.0004400-usd (2272.73 per usd)
  // - unAccountedCalls 0
};
