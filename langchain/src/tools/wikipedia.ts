import Wikijs from 'wikijs'

import { Tool } from "./base.js";

// FIXME just a placeholder for now

import { Document } from "../document.js";
import { RecursiveCharacterTextSplitter } from "../text_splitter.js";
import { loadQAStuffChain } from "../chains/question_answering/load.js";
import { OpenAI } from '../index.js';

// import { OpenAI } from "langchain/llms/openai";
// import { loadQAStuffChain } from "langchain/chains"
// import { Tool } from "langchain/tools";

// import Debug from 'debug'
// const debug = Debug('langchain-playground:src:extensions:langchain_wikipedia_tool')

// import WikipediaApiWrapper from "./langchain_wikipedia_api.js";

// /////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////
//	
// /////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////



class Wikipedia extends Tool {
	name: string;

	description: string;

	// TODO this is a copy-paste from the dadjoke

	constructor() {
		super();
		this.name = "dadjoke";
		this.description =
			"a dad joke generator. get a dad joke about a specific topic. input should be a search term.";
	}

	/** @ignore */
	async _call(input: string): Promise<string> {
		const headers = { Accept: "application/json" };
		const searchUrl = `https://icanhazdadjoke.com/search?term=${input}`;

		const response = await fetch(searchUrl, { headers });

		if (!response.ok) {
			throw new Error(`HTTP error ${response.status}`);
		}

		const data = await response.json();
		const jokes = data.results;

		if (jokes.length === 0) {
			return `No dad jokes found about ${input}`;
		}

		const randomIndex = Math.floor(Math.random() * jokes.length);
		const randomJoke = jokes[randomIndex].joke;

		return randomJoke;
	}
}

// /////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////
//	
// /////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////


class WikipediaApiWrapper {
	// same as the python version - https://github.com/hwchase17/langchain/blob/master/langchain/utilities/wikipedia.py
	WIKIPEDIA_MAX_QUERY_LENGTH: 300

	topKResults: number

	/**
	 * @param {'summary'|'content'} contentType summary are shorter, content are longer. default to summary
	 */
	contentType: string

	/**
	 * 
	 * @param {'summary'|'content'} contentType 
	 * @param {number} topKResults limit the number of documents to load
	 */
	constructor(contentType = "summary", topKResults = 1) {
		this.contentType = contentType
		this.topKResults = topKResults
	}

	/**
	 * 
	 * @param {string} inputText input text to search
	 */
	async run(inputText: string): Promise<Document[]> {
		let returnedDocuments: Document[] = []

		// trim the string to the maximum length if needed
		const truncatedText = inputText.substring(0, this.WIKIPEDIA_MAX_QUERY_LENGTH);

		// search wikipedia
		// @ts-ignore
		const pageTitles = await Wikijs().search(truncatedText, this.topKResults)

		// load all the pages
		for (const pageTitle of pageTitles.results) {
			// console.log(`load wikipedia page "${pageTitle}"`)
			// @ts-ignore
			const wikiPage = await Wikijs().page(pageTitle)

			let pageContent = /** @type {string} */(null)
			if (this.contentType === "summary") {
				pageContent = await wikiPage.summary()
			} else if (this.contentType === "content") {
				pageContent = await wikiPage.rawContent()
			} else {
				console.assert(false, `unknown content type "${this.contentType}"`)
			}

			// same as the python version - https://github.com/hwchase17/langchain/blob/master/langchain/utilities/wikipedia.py
			// pageContent = `Page: ${pageTitle}\nSummary: ${pageContent}`

			console.log(`page content "${pageContent}`)

			// build langchain document
			const document = new Document({
				pageContent,
				metadata: {
					title: pageTitle,
					source: `https://en.wikipedia.org/wiki/${pageTitle}`
				}
			})

			// split text into smaller documents
			const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
			const splittedDocuments = await textSplitter.splitDocuments([document])

			returnedDocuments = returnedDocuments.concat(splittedDocuments)
		}

		// return the documents
		return returnedDocuments
	}

	// similar to https://github.com/jeromeetienne/langchainjs/blob/71d44743e17e9a6acd397eb19d28fcc2f98d1b39/langchain/src/text_splitter.ts#L290-L299
	// - some trick to load the library only when needed
	static async imports(): Promise<typeof Wikijs> {
		try {
			// @ts-ignore
			return await import('wikijs');
		} catch (err) {
			console.error(err);
			throw new Error(
				"Please install @dqbd/tiktoken as a dependency with, e.g. `npm install -S @dqbd/tiktoken`"
			);
		}
	}
}

// /////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////
//	
// /////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////


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

	contentType: string

	topKResults: number
	// /////////////////////////////////////////////////////////////////////////////
	// /////////////////////////////////////////////////////////////////////////////
	//	
	// /////////////////////////////////////////////////////////////////////////////
	// /////////////////////////////////////////////////////////////////////////////

	/**
	 * 
	 * @param {'summary'|'content'} contentType 
	 * @param {number} topKResults limit the number of documents to load
	 */
	constructor(contentType = "summary", topKResults = 1) {
		super()

		this.contentType = contentType
		this.topKResults = topKResults
	}

	// /////////////////////////////////////////////////////////////////////////////
	// /////////////////////////////////////////////////////////////////////////////
	//	
	// /////////////////////////////////////////////////////////////////////////////
	// /////////////////////////////////////////////////////////////////////////////

	/**
	 * 
	 * @param {string} inputText 
	 */
	async _call(inputText: string): Promise<string> {
		// Load the documents from wikipediaApiWrapper
		console.log(`WikipediaTool querying wikipedia for "${inputText}"`)
		const wikipediaApiWrapper = new WikipediaApiWrapper(this.contentType, this.topKResults)
		const loadedDocuments = await wikipediaApiWrapper.run(inputText)

		// Create the chain
		const model = new OpenAI({
			temperature: 0.0,
		});
		const qaChain = loadQAStuffChain(model);

		// run the chain
		console.log(`WikipediaTool run chain with "${inputText}"`)
		const chainValues = await qaChain.call({
			input_documents: loadedDocuments,
			question: inputText,
		});
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

// class WikipediaApiWrapper{}
// class WikipediaTool { }

export { Wikipedia, WikipediaApiWrapper, WikipediaTool };
// export { Wikipedia,  };
