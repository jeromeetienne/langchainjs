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
  // { text: ' 5\n\n5 is the correct answer.' }

  // Display the token usage
  const openaiCost1 = OpenAiTokenCost.fromCallbackHandler(cbHandler1);
  console.log(`Total Cost 1:\n${openaiCost1}`);
  // Total Cost 1:
  // - promptCost       0.0000800-usd (33.33%)
  // - completionCost   0.0001600-usd (66.67%)
  // - totalCost        0.0002400-usd (4166.67 per usd)
  // - unAccountedCalls 0

  const openaiCost2 = OpenAiTokenCost.fromCallbackHandler(cbHandler2);
  console.log(`Total Cost 2:\n${openaiCost2}`);
  // Total Cost 2:
  // - promptCost       0.0001200-usd (40.00%)
  // - completionCost   0.0001800-usd (60.00%)
  // - totalCost        0.0003000-usd (3333.33 per usd)
  // - unAccountedCalls 0

  const openaiCostCumul = openaiCost1.clone().add(openaiCost2);
  console.log(`Total Cost Cumul:\n${openaiCostCumul}`);
  // Total Cost Cumul:
  // - promptCost       0.0002000-usd (37.04%)
  // - completionCost   0.0003400-usd (62.96%)
  // - totalCost        0.0005400-usd (1851.85 per usd)
  // - unAccountedCalls 0
};


