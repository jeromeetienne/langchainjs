// import { BaseLLM } from "../llms/base.js";
import { Tool, ToolParams } from "./base.js";
// import { Embeddings } from "../embeddings/base.js";

import { loadQAStuffChain } from "../chains/question_answering/load.js";
// import { OpenAI } from "../llms/openai.js";


// import { OpenAI } from "langchain/llms/openai";/
// import { loadQAStuffChain } from "langchain/chains"
// import { Tool } from "langchain/tools";

// import Debug from 'debug'
// const debug = Debug('langchain-playground:src:extensions:langchain_wikipedia_tool')

import { WikipediaPageLoader, WikipediaPageLoaderArgs } from "./wikipedia_api_wrapper.js";
import { BaseLLM } from "../llms/base.js";

// /////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////
//	
// /////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////

export interface WikipediaToolArgs extends ToolParams {
	// model: BaseLLM;

	verbose?: boolean;

	wikipediaApiWrapperArgs?: WikipediaPageLoaderArgs;
}

/**
 * WikipediaTool is a tool that uses Wikipedia to answer questions.
 */
class WikipediaTool extends Tool {
	// same as the python version - https://github.com/hwchase17/langchain/blob/master/langchain/tools/wikipedia/tool.py
	name = "Wikipedia"

	// same as the python version - https://github.com/hwchase17/langchain/blob/master/langchain/tools/wikipedia/tool.py
	description = "A wrapper around Wikipedia."
		+ "Useful for when you need to answer general questions about "
		+ "people, places, companies, historical events, or other subjects. "
		+ "Input should be a search query."

	private wikipediaApiWrapperArgs?: WikipediaPageLoaderArgs

	// private model;
	private model: BaseLLM;

	// /////////////////////////////////////////////////////////////////////////////
	// /////////////////////////////////////////////////////////////////////////////
	//	
	// /////////////////////////////////////////////////////////////////////////////
	// /////////////////////////////////////////////////////////////////////////////

	constructor(model: BaseLLM, args?: WikipediaToolArgs) {
		super(args?.verbose)

		// TODO how to handle default values ?



		this.model = model;
		this.wikipediaApiWrapperArgs = args?.wikipediaApiWrapperArgs;
	}

	// /////////////////////////////////////////////////////////////////////////////
	// /////////////////////////////////////////////////////////////////////////////
	//	
	// /////////////////////////////////////////////////////////////////////////////
	// /////////////////////////////////////////////////////////////////////////////

	/**
	 * 
	 * @param {string} searchQuery 
	 */
	async _call(searchQuery: string): Promise<string> {
		// Load the documents from wikipediaApiWrapper
		console.log(`WikipediaTool querying wikipedia for "${searchQuery}"`)
		const wikipediaApiWrapper = new WikipediaPageLoader(this.wikipediaApiWrapperArgs)

		// TODO wikipedia searchQuery should be different from the ```question``` of the qaChain
		// 

		// @ts-ignore
		const loadedDocuments = await wikipediaApiWrapper.run(searchQuery)

		// Create the chain
		// TODO do i need to expose more parameters ? YES
		const qaChain = loadQAStuffChain(this.model);

		// TODO to remove this log
		console.log(`WikipediaTool run chain with "${searchQuery}"`)

		// run the chain
		const chainValues = await qaChain.call({
			input_documents: loadedDocuments,
			question: searchQuery,
		});

		// TODO remove this log
		console.log(`WikipediaTool resulting text is "${chainValues.text}"`)

		// return the answer
		return chainValues.text
	}
}


// /////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////
//	
// /////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////

export { WikipediaTool };
