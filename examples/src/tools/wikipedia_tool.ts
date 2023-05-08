import { OpenAI } from "langchain/llms/openai";
import { WikipediaTool } from 'langchain/tools/wikipedia_tool';

export async function run() {
	const model = new OpenAI({ temperature: 0 });

	const wikipediaTool = new WikipediaTool(model);

	const searchQuery = 'batman';
	const result = await wikipediaTool.call(searchQuery);

	console.log({ result });

	/* Sample output:
		{
		result: ' Batman is a superhero appearing in American comic books published by DC Comics. He was created by artist Bob Kane and writer Bill Finger, and debuted in the 27th issue of the comic book Detective Comics on March 30, 1939. Batman is the alias of Bruce Wayne, a wealthy American playboy, philanthropist, and industrialist who resides in Gotham City. He does not possess any superpowers, instead relying on his intellect, fighting skills, and wealth. He is one of the most iconic characters in popular culture and has been adapted in live-action and animated incarnations.'
		}
	*/
}
