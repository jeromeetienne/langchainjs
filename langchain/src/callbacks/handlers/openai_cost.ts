import { BaseTracer, Run } from "./tracer.js";

export class OpenAiTokenCost {
  promptCost = 0;

  completionCost = 0;

  totalCost = 0;

  unAccountedCalls = 0;

  static fromCallbackHandler(cbHandler: OpenAiCostCallbackHandler) {
    const tokenCost = new OpenAiTokenCost();

    tokenCost.promptCost = OpenAiTokenCost._getOpenaiTokenCostForModel(cbHandler.modelName, cbHandler.promptTokens);
    tokenCost.completionCost = OpenAiTokenCost._getOpenaiTokenCostForModel(cbHandler.modelName, cbHandler.completionTokens, true);
    tokenCost.totalCost = tokenCost.promptCost + tokenCost.completionCost;
    tokenCost.unAccountedCalls = cbHandler.unAccountedCalls;

    return tokenCost;
  }

  toString() {
    const promptRatio = this.promptCost / this.totalCost;
    const completionRatio = this.completionCost / this.totalCost;
    let outputText = '';
    outputText += `- promptCost       ${this.promptCost.toFixed(7)}-usd (${(promptRatio * 100).toFixed(2)}%)\n`;
    outputText += `- completionCost   ${this.completionCost.toFixed(7)}-usd (${(completionRatio * 100).toFixed(2)}%)\n`;
    outputText += `- totalCost        ${this.totalCost.toFixed(7)}-usd (${(1 / this.totalCost).toFixed(2)} per usd)\n`;
    outputText += `- unAccountedCalls ${this.unAccountedCalls}`;
    return outputText;
  }

  add(otherTokenCost: OpenAiTokenCost) {
    this.promptCost += otherTokenCost.promptCost;
    this.completionCost += otherTokenCost.completionCost;
    this.totalCost += otherTokenCost.totalCost;
    this.unAccountedCalls += otherTokenCost.unAccountedCalls;

    return this;
  }

  clone() {
    const tokenCost = new OpenAiTokenCost();
    tokenCost.promptCost = this.promptCost;
    tokenCost.completionCost = this.completionCost;
    tokenCost.totalCost = this.totalCost;
    tokenCost.unAccountedCalls = this.unAccountedCalls;

    return tokenCost;
  }

  reset() {
    this.promptCost = 0;
    this.completionCost = 0;
    this.totalCost = 0;
    this.unAccountedCalls = 0;

    return this;
  }

  ///
  ///
  //	static function translated from the python version
  ///
  ///

  // from https://github.com/langchain-ai/langchain/blob/master/libs/langchain/langchain/callbacks/openai_info.py
  static _MODEL_COST_PER_1K_TOKENS: { [index: string]: number } = {
    // GPT-4 input
    "gpt-4": 0.03,
    "gpt-4-0314": 0.03,
    "gpt-4-0613": 0.03,
    "gpt-4-32k": 0.06,
    "gpt-4-32k-0314": 0.06,
    "gpt-4-32k-0613": 0.06,
    // GPT-4 output
    "gpt-4-completion": 0.06,
    "gpt-4-0314-completion": 0.06,
    "gpt-4-0613-completion": 0.06,
    "gpt-4-32k-completion": 0.12,
    "gpt-4-32k-0314-completion": 0.12,
    "gpt-4-32k-0613-completion": 0.12,
    // GPT-3.5 input
    "gpt-3.5-turbo": 0.0015,
    "gpt-3.5-turbo-0301": 0.0015,
    "gpt-3.5-turbo-0613": 0.0015,
    "gpt-3.5-turbo-instruct": 0.0015,
    "gpt-3.5-turbo-16k": 0.003,
    "gpt-3.5-turbo-16k-0613": 0.003,
    // GPT-3.5 output
    "gpt-3.5-turbo-completion": 0.002,
    "gpt-3.5-turbo-0301-completion": 0.002,
    "gpt-3.5-turbo-0613-completion": 0.002,
    "gpt-3.5-turbo-instruct-completion": 0.002,
    "gpt-3.5-turbo-16k-completion": 0.004,
    "gpt-3.5-turbo-16k-0613-completion": 0.004,
    // Azure GPT-35 input
    "gpt-35-turbo": 0.0015,  // Azure OpenAI version of ChatGPT
    "gpt-35-turbo-0301": 0.0015,  // Azure OpenAI version of ChatGPT
    "gpt-35-turbo-0613": 0.0015,
    "gpt-35-turbo-instruct": 0.0015,
    "gpt-35-turbo-16k": 0.003,
    "gpt-35-turbo-16k-0613": 0.003,
    // Azure GPT-35 output
    "gpt-35-turbo-completion": 0.002,  // Azure OpenAI version of ChatGPT
    "gpt-35-turbo-0301-completion": 0.002,  // Azure OpenAI version of ChatGPT
    "gpt-35-turbo-0613-completion": 0.002,
    "gpt-35-turbo-instruct-completion": 0.002,
    "gpt-35-turbo-16k-completion": 0.004,
    "gpt-35-turbo-16k-0613-completion": 0.004,
    // Others
    "text-ada-001": 0.0004,
    "ada": 0.0004,
    "text-babbage-001": 0.0005,
    "babbage": 0.0005,
    "text-curie-001": 0.002,
    "curie": 0.002,
    "text-davinci-003": 0.02,
    "text-davinci-002": 0.02,
    "code-davinci-002": 0.02,
    "ada-finetuned": 0.0016,
    "babbage-finetuned": 0.0024,
    "curie-finetuned": 0.012,
    "davinci-finetuned": 0.12,
  };

  ///
  ///
  /// utility functions
  ///
  ///

  static _standardizeModelName(modelNameOrig: string, isCompletion = false) {
    // Convert the model name to lowercase
    const modelName = modelNameOrig.toLowerCase();

    if (modelName.includes("ft-")) {
      // Extract the model name before the colon and append "-finetuned"
      return `${modelName.split(":")[0]}-finetuned`;
    }

    if (isCompletion && (modelName.startsWith("gpt-4") || modelName.startsWith("gpt-3.5") || modelName.startsWith("gpt-35"))) {
      // Append "-completion" for certain model names if isCompletion is true
      return `${modelName}-completion`;
    }

    return modelName;
  }

  static _getOpenaiTokenCostForModel(modelName: string, numTokens: number, isCompletion = false) {
    const modelNameStandardized = OpenAiTokenCost._standardizeModelName(modelName, isCompletion);

    if (!(modelNameStandardized in OpenAiTokenCost._MODEL_COST_PER_1K_TOKENS)) {
      throw new Error(
        `Unknown model: ${modelName}. Please provide a valid OpenAI model name. Known models are: ${Object.keys(OpenAiTokenCost._MODEL_COST_PER_1K_TOKENS).join(', ')}`
      );
    }

    return OpenAiTokenCost._MODEL_COST_PER_1K_TOKENS[modelName] * (numTokens / 1000);
  }
}

/**
 * - https://python.langchain.com/docs/modules/model_io/models/llms/token_usage_tracking
 * - https://dev.to/taranjeet/behind-the-scenes-how-langchain-calculates-openais-pricing-155p
 */
export class OpenAiCostCallbackHandler extends BaseTracer {
  name = "openai_cost_callback_handler" as const;

  modelName: string;

  promptTokens = 0;

  completionTokens = 0;

  totalTokens = 0;

  unAccountedCalls = 0;

  constructor(modelName: string) {
    super();

    this.modelName = modelName;
  }

  protected persistRun(_run: Run) {
    return Promise.resolve();
  }

  // logging methods

  onLLMEnd(run: Run) {
    const { outputs } = run;

    // if the are no llmOutput, do nothing
    if (outputs === undefined || outputs.llmOutput === undefined) {
      this.unAccountedCalls += 1;
      return;
    }

    const { tokenUsage } = outputs.llmOutput;
    this.promptTokens += tokenUsage.promptTokens;
    this.completionTokens += tokenUsage.completionTokens;
    this.totalTokens += tokenUsage.totalTokens;
  }
}