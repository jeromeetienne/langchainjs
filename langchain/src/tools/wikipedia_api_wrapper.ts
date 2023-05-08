// TODO should i include this? is that the proper way to handle missing external package ?
import Wikijs from 'wikijs'

import { Document } from "../document.js";
import { RecursiveCharacterTextSplitter } from "../text_splitter.js";


// TODO put tthat in document_loaders
// TODO rename it WikipediaLoader

// /////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////
//	
// /////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////

export interface WikipediaPageLoaderArgs {
	/**
	 * @param {'summary'|'content'} contentType summary are shorter, content are longer. default to summary
	 */
	contentType?: string;

	/**
	 * @param {number} topKResults limit the number of documents to load
	 */
	topKResults?: number;
}

// /////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////
//	
// /////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////


export class WikipediaPageLoader {
	// same as the python version - https://github.com/hwchase17/langchain/blob/master/langchain/utilities/wikipedia.py
	WIKIPEDIA_MAX_QUERY_LENGTH: 300

	/**
	 * @param {number} topKResults limit the number of documents to load
	 */
	private topKResults: number

	/**
	 * @param {'summary'|'content'} contentType summary are shorter, content are longer. default to summary
	 */
	private contentType: string

	constructor(args?: WikipediaPageLoaderArgs) {
		this.contentType = args?.contentType ?? 'summary'
		this.topKResults = args?.topKResults ?? 1
	}


	/**
	 * 
	 * @param {string} searchQuery input text to search
	 */
	async run(searchQuery: string): Promise<Document[]> {
		let returnedDocuments: Document[] = []

		// trim the string to the maximum length if needed
		const truncatedText = searchQuery.substring(0, this.WIKIPEDIA_MAX_QUERY_LENGTH);

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

			// TODO why do i force this text-splitter ? i should make it flexible. See how other are doing it
			// - maybe as a parameter to the constructor ? with a reasonable default sounds good

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
