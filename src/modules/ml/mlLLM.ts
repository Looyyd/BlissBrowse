import OpenAI from "openai";
import {DEBUG} from "../../constants";
import {addGPTTokensUsed} from "./mlCosts";
import {inferenseServerSettings, MLSubject, MlCostStore} from "./mlTypes";
import {extractAndParseJSON, getAnswerFromJSON, openAIClientFromSettings} from "./mlHelpers";

interface cacheValue {
  content: string;
}

const gpt35TokenCost = 0.001 / 1000;
let costStore = new MlCostStore();

const completionCache: Map<string, Promise<cacheValue>> = new Map();

async function getOpenAICompletion(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[], openai:OpenAI, json_mode = true) {
  //cost check
  const cost = await costStore.get();
  if (cost.budgetLimit !== undefined && cost.cost > cost.budgetLimit) {
    throw new Error('budget limit reached');
  }

  const userMessage = messages[1].content as string
  const systemPrompt = messages[0].content as string;
  const cacheKey = `userMessage:${userMessage}|systemPrompt:${systemPrompt}`;

  if (completionCache.has(cacheKey)) {
    // Wait for the promise to resolve and return its result
    const cachedResult = await completionCache.get(cacheKey);
    if (!cachedResult) {
      throw new Error('cachedResult is undefined');
    }
    if (!cachedResult.content) {
      throw new Error('content is undefined');
    }
    return cachedResult.content;
  } else {
    if (DEBUG) {
      console.log('cache miss, creating new promise');
    }

    // Store a new promise in the cache immediately to handle concurrent calls
    const promise = openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106", //need model that supports json mode
      messages: messages,
      response_format: json_mode ? {"type": "json_object"} : undefined,
      temperature: 0,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    }).then(async response => {
      const content = response.choices[0].message.content;

      const tokensUsed = response.usage?.total_tokens || 0;
      addGPTTokensUsed(tokensUsed);
      await costStore.add(tokensUsed * gpt35TokenCost);

      if (content === null) {
        throw new Error('content is null');
      }
      // Update the cache with the final result
      const cacheValue: cacheValue = {content};
      completionCache.set(cacheKey, Promise.resolve(cacheValue));

      return {content};
    }).catch(error => {
      // Remove the cache entry if an error occurs
      completionCache.delete(cacheKey);
      throw error;
    });

    completionCache.set(cacheKey, promise);
    return (await promise).content;
  }
}

// TODO: this can be blocked by brave adblocker
async function getLocalCompletion(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[], openai:OpenAI, json_mode = true) {
  const userMessage = messages[1].content as string
  const systemPrompt = messages[0].content as string;
  const cacheKey = `userMessage:${userMessage}|systemPrompt:${systemPrompt}`;

  if (completionCache.has(cacheKey)) {
    // Wait for the promise to resolve and return its result
    const cachedResult = await completionCache.get(cacheKey);
    console.log('cachedResult:', cachedResult)
    if (!cachedResult) {
      throw new Error('cachedResult is undefined');
    }
    if (cachedResult.content === undefined) {
      throw new Error('content is undefined');
    }
    return cachedResult.content;
  } else {
    if (DEBUG) {
      console.log('cache miss, creating new promise');
    }

    // Store a new promise in the cache immediately to handle concurrent calls
    const time = Date.now();
    const promise = openai.chat.completions.create({
      model: "local", //need model that supports json mode
      messages: messages,
      response_format: json_mode ? {"type": "json_object"} : undefined,
      temperature: 0,
      max_tokens: 256,
      top_p: 1,
      stop: ["}"],//stop at the end of the json
      frequency_penalty: 0,
      presence_penalty: 0,
    }).then(response => {
      let content = response.choices[0].message.content;
      if (DEBUG) {
        console.log("Local completion content:", content);
        console.log(messages);
        console.log('time taken to get local completion:', Date.now() - time);
      }
      if (content === null) {
        throw new Error('content is null');
      }
      if (content === "") {
        throw new Error('content is empty');
      }

      content += '}';//add the last bracket because it's removed by the stop parameter

      // Update the cache with the final result
      const cacheValue: cacheValue = {content};
      completionCache.set(cacheKey, Promise.resolve(cacheValue));

      return {content};
    }).catch(error => {
      // Remove the cache entry if an error occurs
      completionCache.delete(cacheKey);
      throw error;
    });

    completionCache.set(cacheKey, promise);
    return (await promise).content;
  }
}

function createClassificationPrompt(text: string, descriptions: string[]): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const systemPrompt = "You are a helpful assistant.";
  let userMsg = "For each description, say if the given text fits the description. " +
    "Answer with JSON, with the key being the description number and the value being \"YES\" (yes it matches the description) or \"NO\" (no it doesn't match) or \"IDK\" (unsure if it matches the description):";

  descriptions.forEach((description, index) => {
    userMsg += `\nDescription ${index + 1}: ${description}`;
  });

  let expectedOutputFormat = "\nExpected output format: \n{\n";
  descriptions.forEach((_, index) => {
    expectedOutputFormat += `"${index + 1}": "ANSWER"`;
    if (index < descriptions.length - 1) {
      expectedOutputFormat += ",\n";
    }
  });
  expectedOutputFormat += "\n}\n";

  userMsg += expectedOutputFormat;
  userMsg += `\nText to analyse:\n${text}`;

  return [
    {role: "system", content: systemPrompt},
    {role: "user", content: userMsg},
  ];
}

export async function getGPTClassification(text: string, settings:inferenseServerSettings, subject: MLSubject) {
  // TODO: multiple descriptions at once
  const messages = createClassificationPrompt(text, [subject.description]);


  let retries = 0
  const maxRetries = 2;
  let response: string;
  let resObj: any;
  const openai = openAIClientFromSettings(settings);
  while (retries < maxRetries) {
    if (settings.type === 'openai') {
      response = await getOpenAICompletion(messages, openai);
    } else if (settings.type === 'local') {
      response = await getLocalCompletion(messages, openai);
    } else {
      throw new Error('invalid settings type');
    }

    // Assuming response is a JSON string, parse it to a JavaScript object
    resObj = extractAndParseJSON(response);
    if (resObj === null) {
      retries++;
      console.log('resObj is null, retrying');
    } else {
      break;
    }
  }
  if (retries === maxRetries) {
    console.log('max retries reached, returning false');
    return false;
  }

  // Initialize the answers array
  const answers = getAnswerFromJSON(resObj);

  return answers[0] === 1;//TODO: handle multiple descriptions
}

export async function getKeywordsForSubject(subject: string, inferenceSettings:inferenseServerSettings): Promise<string[]> {
  let systemPrompt = "You are a helpful assistant."
  let userMessage = "That sends back around 10 strings that are related to the description of the given subject. Make sure the strings are diverse in style but keep them all related to the user subject!"
  userMessage += `Send back a JSON string with key "sentences" and value being an array of strings.`;
  userMessage += `\nSubject:\n"${subject}"`;
  const messages = [
    {role: "system", content: systemPrompt},
    {role: "user", content: userMessage}
  ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  const openai = openAIClientFromSettings(inferenceSettings);
  const response = await getOpenAICompletion(messages, openai, true);
  const resObj = JSON.parse(response);
  if(resObj === null){
    throw new Error('resObj is null');
  }
  if (resObj.sentences === undefined) {
    throw new Error(`'sentences' field is undefined or empty in the response`);
  }
  const sentences = resObj.sentences as string[];
  if (DEBUG) {
    console.log('Sentence creation response preprocessed output:', sentences);
  }
  return sentences;
}