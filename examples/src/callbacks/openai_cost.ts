import { ConsoleCallbackHandler, BaseCallbackHandler } from "langchain/callbacks";
import { LLMChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMResult } from "langchain/schema";

///
///
///
///
///
///
///
///

// TODO add class OpenAiTokenCost in typescript


/**
 * - https://python.langchain.com/docs/modules/model_io/models/llms/token_usage_tracking
 * - https://dev.to/taranjeet/behind-the-scenes-how-langchain-calculates-openais-pricing-155p
 */
export class OpenAiCostCallbackHandler extends BaseCallbackHandler {
  name = "OpenAiCostCallbackHandler";

  promptTokens = 0;
  
  completionTokens = 0;

  totalTokens = 0;

  unAccountedCalls = 0;

  /**
   * Called at the end of an LLM/ChatModel run, with the output and the run ID.
  */
  handleLLMEnd(llmResult: LLMResult) {
    // if the are no llmOutput, do nothing
    if (llmResult.llmOutput === undefined) {
      this.unAccountedCalls += 1;
      return;
    }

    const {tokenUsage} = llmResult.llmOutput;
    this.promptTokens += tokenUsage.promptTokens;
    this.completionTokens += tokenUsage.completionTokens;
    this.totalTokens += tokenUsage.totalTokens;
    console.log({tokenUsage});
  }
}

///
///
///
///
///
///

export const run = async () => {
  const handler = new OpenAiCostCallbackHandler();
  const llm = new OpenAI({ temperature: 0, callbacks: [handler] });

  // use the llm in a chain
  const prompt = PromptTemplate.fromTemplate("1 + {number} =");
  const chain = new LLMChain({ prompt, llm, callbacks: [handler] });
  const output = await chain.call({ number: 2 });
  console.log(output);
  /*
  { text: ' 3\n\n3 - 1 = 2' }
   */

  // display the token usage
  console.log(`Total Tokens: ${handler.totalTokens}`);
  console.log(`Prompt Tokens: ${handler.promptTokens}`);
  console.log(`Completion Tokens: ${handler.completionTokens}`);
  console.log(`Total Cost: ${handler.totalCost}`);
};
