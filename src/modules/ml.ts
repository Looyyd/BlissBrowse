import {huggingFaceToken} from "./secrets";
import {
  DEBUG,
  DEBUG_STORE_NAME, DEBUG_TOKEN_COST,
  SETTINGS_STORE_NAME,
  SUBJECTS_STORE_NAME
} from "../constants";
import {DatabaseStorage, FullDataStore} from "./datastore";
import OpenAI from "openai";
import {preprocessTextBeforeEmbedding} from "./content_rewrite";


export type inferenseServerType = 'openai' | 'local' |  'none';

export interface inferenseServerSettings {
  type: inferenseServerType;
  url?: string;
  token?: string;
}

const DEFAULT_INFERENCE_SERVER_SETTINGS: inferenseServerSettings = {
  type: 'none',
};


export class InferenseServerSettingsStore extends DatabaseStorage<inferenseServerSettings> {
  IndexedDBStoreName = SETTINGS_STORE_NAME;
  key = 'inferenseServerSettings'; //TODO: global
  typeUpgrade = undefined;
  isType = (data: unknown): data is inferenseServerSettings => { return data!== null && data !== undefined; }; //TODO: typecheck
  defaultValue = DEFAULT_INFERENCE_SERVER_SETTINGS;
}

const settingsStore = new InferenseServerSettingsStore()


function openAIClientFromSettings(settings: inferenseServerSettings): OpenAI {
  if (settings.type === 'openai') {
    if(!settings.token){
      throw new Error('token is required');
    }
    return new OpenAI({
      apiKey: settings.token,
      dangerouslyAllowBrowser: true,//this is a security check to avoid that companies but their api key in the source code
                                        // it's ok, because the token is user submitted
    });
  } else if(settings.type === 'local'){
    if(!settings.url){
      throw new Error('url is required');
    }
    return new OpenAI({
      baseURL: settings.url,
      apiKey: 'local',
      dangerouslyAllowBrowser: true,//this is a security check to avoid that companies but their api key in the source code
      // it's ok, because the token is user submitted
    });
  } else {
    throw new Error('invalid settings type');
  }
}


interface cacheValue {
  content: string;
}
const completionCache: Map<string, Promise<cacheValue>> = new Map();
let gptTokensUsed = 0;

async function getOpenAICompletion(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[], json_mode = true) {
  const userMessage = messages[1].content as string
  const systemPrompt = messages[0].content as string;
  const cacheKey = `userMessage:${userMessage}|systemPrompt:${systemPrompt}`;

  if (completionCache.has(cacheKey)) {
    // Wait for the promise to resolve and return its result
    const cachedResult = await completionCache.get(cacheKey);
    if(!cachedResult){
      throw new Error('cachedResult is undefined');
    }
    if (!cachedResult.content) {
      throw new Error('content is undefined' );
    }
    return cachedResult.content;
  } else {
    if (DEBUG) {
      console.log('cache miss, creating new promise');
    }

    const openai = openAIClientFromSettings(await settingsStore.get());
    // Store a new promise in the cache immediately to handle concurrent calls
    const promise = openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106", //need model that supports json mode
      messages: messages,
      response_format: json_mode ? { "type": "json_object" } : undefined,
      temperature: 0,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    }).then(response => {
      const content = response.choices[0].message.content;
      gptTokensUsed += response.usage?.total_tokens || 0;
      if (content === null) {
        throw new Error('content is null');
      }
      // Update the cache with the final result
      const cacheValue: cacheValue = { content };
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
async function getLocalCompletion(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[], json_mode = true) {
  const userMessage = messages[1].content as string
  const systemPrompt = messages[0].content as string;
  const cacheKey = `userMessage:${userMessage}|systemPrompt:${systemPrompt}`;

  if (completionCache.has(cacheKey)) {
    // Wait for the promise to resolve and return its result
    const cachedResult = await completionCache.get(cacheKey);
    console.log('cachedResult:', cachedResult)
    if(!cachedResult){
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

    const openai = openAIClientFromSettings(await settingsStore.get());
    // Store a new promise in the cache immediately to handle concurrent calls
    const time = Date.now();
    const promise = openai.chat.completions.create({
      model: "local", //need model that supports json mode
      messages: messages,
      response_format: json_mode ? { "type": "json_object" } : undefined,
      temperature: 0,
      max_tokens: 256,
      top_p: 1,
      stop: ["}"],//stop at the end of the json
      frequency_penalty: 0,
      presence_penalty: 0,
    }).then(response => {
      let content = response.choices[0].message.content;
      if(DEBUG){
        console.log("Local completion content:", content);
        console.log(messages);
        console.log('time taken to get local completion:', Date.now() - time);
      }
      if (content === null ) {
        throw new Error('content is null');
      }
      if (content === "") {
        throw new Error('content is empty');
      }

      content += '}';//add the last bracket because it's removed by the stop parameter

      // Update the cache with the final result
      const cacheValue: cacheValue = { content };
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


function createPromptSingleDescription(text: string, description: string):  OpenAI.Chat.Completions.ChatCompletionMessageParam[]{
  const systemPrompt = "You are a helpful assistant.";
  let userMsg = "Does the description match the text?" +
                "Answer with only 1 word: \"YES\" (yes it matches the description) or \"NO\" (no it doesn't match) or \"IDK\" (unsure if it matches the description):";

  userMsg += `\n###Description:\n${description}`;

  userMsg += `\n###TEXT:\n${text}`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMsg }
  ];
}

function createPrompt(text: string, descriptions: string[]):  OpenAI.Chat.Completions.ChatCompletionMessageParam[]{
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
    { role: "system", content: systemPrompt },
    { role: "user", content: userMsg },
  ];
}

function extractAndParseJSON(mixedString: string): any | null {
  // Regular expression to extract JSON from the mixed content
  // It matches a JSON-like structure with numeric keys and uppercase string values
  const regex = /\{\s*"[0-9]":\s*"[A-Z]+"(,\s*"[0-9]":\s*"[A-Z]+")*\s*\}/;
  const match = mixedString.match(regex);

  if (match) {
    try {
      // Parse the matched string into a JavaScript object
      const data = JSON.parse(match[0]);
      return data;
    } catch (e) {
      console.error(`Error parsing JSON: ${e}`);
      return null;
    }
  } else {
    console.log("No JSON found in the string", mixedString);
    return null;
  }
}

async function getGPTClassification(text: string, subject:MLSubject){
  // TODO: multiple descriptions at once
  const messages = createPrompt(text, [subject.description]);

  //code to get single token response, the issues is that without json constraints llm be yapping frfr
  //const messages = createPromptSingleDescription(text, subject.description);
  //return response.toLowerCase().includes('yes');


  const settings = await settingsStore.get();

  let retries = 0
  const maxRetries = 2;
  let response: string;
  let resObj: any;
  while(retries < maxRetries){
    if (settings.type === 'openai') {
      response = await getOpenAICompletion(messages);
    } else if(settings.type === 'local'){
      response = await getLocalCompletion(messages);
    } else {
      throw new Error('invalid settings type');
    }

    // Assuming response is a JSON string, parse it to a JavaScript object
    resObj = extractAndParseJSON(response);
    if(resObj === null){
      retries++;
      console.log('resObj is null, retrying');
    } else {
      break;
    }
  }
  if(retries === maxRetries){
    console.log('max retries reached, returning false');
    return false;
  }

  // Initialize the answers array
  const answers = [];

  // Iterate through the keys in the JSON object
  for (const key in resObj) {
    if (resObj.hasOwnProperty(key)) {
      const value = resObj[key].toString().toLowerCase();

      // Check for 'yes', 'no', or 'idk'
      if (value.includes('yes')) {
        answers.push(1);
      } else if (value.includes('no')) {
        answers.push(-1);
      } else if (value.includes('idk')) {
        answers.push(0);
      } else {
        console.log(`Unexpected value: ${value}`)
        throw new Error("json value doesn't contain yes, no or idk");
      }
    }
  }
  return answers[0] === 1;//TODO: handle multiple descriptions
}

class TotalCostStore extends DatabaseStorage<number>{
  defaultValue: number = 0;
  IndexedDBStoreName: string = DEBUG_STORE_NAME;
  key: string = 'apiCost';
  typeUpgrade = undefined;
  isType = (data: unknown): data is number => {
    return typeof data === 'number';
  };

  async add(value: number): Promise<void> {
    await this.set(await this.get() + value);
  }
}


export async function createNewSubject(description: string): Promise<void>{
  const subject: MLSubject = {
    description,
  }
  //save without embeddings, they will be populated on first use
  await subjectsStore.set(subject.description, subject);//TODO: what keys to use? description could change if user edits it
}


export class SubjectsStore extends FullDataStore<MLSubject> {
  isType = (data: unknown): data is MLSubject => {
    return typeof data === 'object' && data !== null && 'description' in data;
  }
  IndexedDBStoreName = SUBJECTS_STORE_NAME;
  key = 'subjects';
  typeUpgrade = undefined;
  defaultValue = undefined;
}

const subjectsStore = new SubjectsStore();
export async function getSubjects(): Promise<MLSubject[]> {
  const keyvalues = await subjectsStore.get();
  return Object.values(keyvalues).map(keyvalue => keyvalue.value);
}

export interface MLSubject {
  description: string;
  embedding_keywords?: string[];
  embedding?: number[];
}
interface PopulatedFilterSubject extends MLSubject{
  embedding_keywords: string[];
  embedding: number[];
}

function dotProduct(vecA: number[], vecB: number[]): number {
  let product = 0;
  for (let i = 0; i < vecA.length; i++) {
    product += vecA[i] * vecB[i];
  }
  return product;
}

function magnitude(vec: number[]): number {
  return Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if(vecA.length !== vecB.length){
    throw new Error('vectors have different lengths');
  }
  return dotProduct(vecA, vecB) / (magnitude(vecA) * magnitude(vecB));
}

function averageEmbeddings(embeddings: number[][]): number[] {
  const average = embeddings.reduce((sum, embedding) => {
    for (let i = 0; i < embedding.length; i++) {
      sum[i] += embedding[i];
    }
    return sum;
  }, embeddings[0].map(() => 0));
  return average.map(val => val / embeddings.length);
}

async function getEmbeddingsHuggingFace(texts: string[]): Promise<number[][]> {

  async function query(data: { inputs: string[] }) {
    const token = huggingFaceToken;
    const response = await fetch(
      "https://v0oeqihhysznl728.eu-west-1.aws.endpoints.huggingface.cloud",
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    const result = await response.json();
    console.log('result:', result);
    return result;
  }


  const response = await query({"inputs": texts});
  const embeddings = response as number[][];

  return embeddings;

}

let embeddingTokensUsed = 0;

async function getEmbeddingsOpenAI(texts: string[]): Promise<number[][]> {

  const fetchEmbedding = async (inputTexts: string[]): Promise<any> => {
    //TODO: handle tokens securely, remove from source code;
    const settings = await settingsStore.get();
    if( settings.type !== 'openai'){
      throw new Error('getting embeddings from openai but settings.type is not openai');
    }
    if(!settings.token){
      throw new Error('OpenAI token is required');
    }
    const token = settings.token;
    const url = 'https://api.openai.com/v1/embeddings';
    const model = 'text-embedding-ada-002';

    try {
      const time = Date.now();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          input: inputTexts,
          model: model
        })
      });
      console.log('time taken to fetch embeddings:', Date.now() - time);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonResponse = await response.json();
      const tokensUsed = jsonResponse.usage.total_tokens || 0;
      embeddingTokensUsed += tokensUsed;
      if (jsonResponse.data === undefined ) {
        throw new Error(`'data' field is undefined or empty in the response`);
      }
      return jsonResponse.data.map((item: any) => item.embedding);
    } catch (error) {
      console.error('Error:', error);
      console.log('inputTexts:', inputTexts);
      if(response.json){
        console.log('response.json:', await response.json());
      }
      return null;
    }
  };

  //console.log('texts:', texts);
  //return texts.map(text => [0]);//TODO: remove this line
  const time = Date.now();
  const response = await fetchEmbedding(texts);
  console.log('time taken to get embeddings:', Date.now() - time);
  return response as number[][];
}

let totalEmbeddingCalls = 0;
let totalTextLength = 0;
let totalStringsNumber = 0;
let costStore = new TotalCostStore();
let previousTotalCost = 0;
let cacheHits = 0;

interface QueueItem {
    text: string;
    resolve: (value: number[] | PromiseLike<number[]>) => void;
    reject: (reason?: any) => void;
}

let embeddingQueue: QueueItem[] = [];
let queueTimer: NodeJS.Timeout | null = null;

//const QUEUE_MAX_SIZE = 100;//TODO: what is the right size? maybe depend on the size of the text?
const QUEUE_MAX_SIZE = 20;// jinaai
const QUEUE_TIME_LIMIT = 1000;

const processQueue = async () => {
  if (embeddingQueue.length === 0) return;

  // Create a copy of the current queue
  const currentQueue = [...embeddingQueue];

  // Clear the original queue immediately to prevent asynchronous modification issues
  embeddingQueue = [];

  const texts = currentQueue.map(item => item.text);
  totalEmbeddingCalls++;
  const embeddings = await getEmbeddingsOpenAI(texts);
  //const embeddings = await getEmbeddingsHuggingFace(texts)

  // Process the copied queue
  embeddings.forEach((embedding, index) => {
    if (index < currentQueue.length) {
      const { resolve } = currentQueue[index];
      resolve(embedding);
    }
  });

  if (queueTimer) {
    clearTimeout(queueTimer);
    queueTimer = null;
  }
};

const addToQueue = (text: string): Promise<number[]> => {
    return new Promise((resolve, reject) => {
        embeddingQueue.push({ text, resolve, reject });

        if (embeddingQueue.length >= QUEUE_MAX_SIZE) {
            processQueue();
        }

        if (!queueTimer) {
            queueTimer = setTimeout(processQueue, QUEUE_TIME_LIMIT);
        }
    });
};

// Debugging function
async function logCounters() {
  console.log(`Total Embedding Calls: ${totalEmbeddingCalls}`);
  console.log(`Total Text Length: ${totalTextLength}`);
  console.log(`Total Strings Number: ${totalStringsNumber}`);
  console.log(`Cache Hits: ${cacheHits}`);
  console.log("GPT Tokens Used:", gptTokensUsed);
  console.log("Embedding Tokens Used:", embeddingTokensUsed);
  const totalCost = gptTokensUsed* 0.001 / 1000 + embeddingTokensUsed * 0.0001 / 1000;
  console.log("Total cost $:", totalCost);
  const costToAdd = totalCost - previousTotalCost;
  await costStore.add(costToAdd);
  previousTotalCost = totalCost;
}

// Set interval for every 10 seconds
if(DEBUG_TOKEN_COST){
  setInterval(logCounters, 10000);
}

const embeddingCache = new Map<string, Promise<number[]>>();

async function getEmbeddings(text: string): Promise<number[]> {
  // Check if the cache already has a promise for the embedding of this text
  if (embeddingCache.has(text)) {
    cacheHits++;
    // Await the resolved value from the promise
    const embedding = await embeddingCache.get(text);
    if(!embedding){
      throw new Error('embedding is undefined');
    }
    return embedding;
  }

  totalTextLength += text.length;
  totalStringsNumber++;

  // Create a new promise for the embedding calculation and store it in the cache
  const embeddingPromise = addToQueue(text).then(embedding => {
    // Once resolved, replace the promise in the cache with the actual value
    embeddingCache.set(text, Promise.resolve(embedding));
    return embedding;
  });

  // Initially store the promise in the cache
  embeddingCache.set(text, embeddingPromise);

  // Await and return the embedding
  return await embeddingPromise;
}


async function getKeywordsForSubject(subject: string): Promise<string[]> {
  const systemPrompt = "You are an assistant that sends back around 10 strings that are related to the user description of a subject. Give 1 string per line. Make sure the strings are diverse in style but keep them all related to the user subject. Make it diverse, some can be casual others formal !"
  const userMessage = `"${subject}"`;
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  const response = await getOpenAICompletion(messages, false);
  //TODO: check if response is valid
  const sentences = response.split('\n').map(sentence => preprocessTextBeforeEmbedding(sentence));
  if(DEBUG){
    console.log('Sentence creation response preprocessed output:', sentences);
  }
  return sentences;
}

export function shouldTextBeSkippedML(text: string): boolean {
  if (text.trim().length < 20) {
    return true;
  }
  return false;
}

export async function populateSubjectAndSave(subject: MLSubject){
  if(!subject.description){
    throw new Error('subject.description is required');
  }
  if(!subject.embedding_keywords){
    subject.embedding_keywords = await getKeywordsForSubject(subject.description);
  }
  if(!subject.embedding){
    const embedding_promises = subject.embedding_keywords.map(async keyword => await getEmbeddings(keyword));
    // wait for all promises to resolve
    const embeddings = await Promise.all(embedding_promises);
    //average the embeddings
    subject.embedding = averageEmbeddings(embeddings);
    await subjectsStore.set(subject.description, subject);//TODO: what keys to use? description could change if user edits it
  }
  return subject as PopulatedFilterSubject;
}

export async function isTextInSubjectOpenAI(subject:MLSubject, text:string){
  const threshold = 0.76;
  //const threshold = 0.65; //jinaai
  const populatedSubject = await populateSubjectAndSave(subject);
  const textEmbedding = await getEmbeddings(text);
  const similarity = cosineSimilarity(populatedSubject.embedding, textEmbedding);

  const result = similarity > threshold;

  if(DEBUG){
    if(result) {
      console.log('text:', text);
      //console.log('subject:', subject);
      console.log('similarity:', similarity);
      //console.log('Embedding lengths:', populatedSubject.embedding.length, textEmbedding.length);
    }
  }
  if(result){
    //confirm with gpt
    const gptResult = await getGPTClassification(text, subject);
    if(gptResult){
      return true;
    }
    else{
      return false;
    }
  }

  return result;
}

export async function isTextInSubjectLocal(subject:MLSubject, text:string){
  const gptResult = await getGPTClassification(text, subject);
  if(gptResult){
    return true;
  }
  else{
    return false;
  }
}

export async function isTextInSubject(subject:MLSubject, text:string){
  const settings = await settingsStore.get();
  if(settings.type === 'openai'){
    return await isTextInSubjectOpenAI(subject, text);
  } else if(settings.type === 'local'){
    return await isTextInSubjectLocal(subject, text);
  } else {
    throw new Error('invalid settings type');
  }
}
