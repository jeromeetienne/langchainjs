import { BaseLLM } from "../llms/base.js";
import { Tool, ToolParams } from "./base.js";
import { loadQAStuffChain } from "../chains/question_answering/load.js";

import { WikipediaPageLoader, WikipediaPageLoaderArgs } from "../document_loaders/web/wikipedia.js";

// /////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////
//	
// /////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////

export interface WikipediaToolArgs extends ToolParams {
	verbose?: boolean;

	wikipediaPageLoaderArgs?: WikipediaPageLoaderArgs;
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

	private wikipediaPageLoaderArgs?: WikipediaPageLoaderArgs

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
		this.wikipediaPageLoaderArgs = args?.wikipediaPageLoaderArgs;
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
		const wikipediaPageLoader = new WikipediaPageLoader(searchQuery , this.wikipediaPageLoaderArgs)
		const loadedDocuments = await wikipediaPageLoader.load()

		// Create the chain
		// TODO do i need to expose more parameters ? YES, e.g. embeddings
		// TODO why should i force the chain to be loaded with the model ?
		const qaChain = loadQAStuffChain(this.model);

		// TODO to remove this log
		console.log(`WikipediaTool run chain with "${searchQuery}"`)

		// TODO wikipedia searchQuery should be different from the ```question``` of the qaChain
		// 

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
