import {huggingFaceToken, openAIToken} from "./secrets";
import {DEBUG, DEBUG_STORE_NAME, LIST_OF_LIST_NAMES_DATASTORE, SUBJECTS_STORE_NAME} from "../constants";
import {DatabaseStorage, FullDataStore} from "./datastore";
import {IndexedDBKeyValueStore} from "./types";
import OpenAI from "openai";
import {preprocessTextBeforeEmbedding} from "./content_rewrite";


let openai:OpenAI;
if (DEBUG) {
  openai = new OpenAI({
    apiKey: openAIToken, dangerouslyAllowBrowser: true
  });
} else {
  openai = new OpenAI({
    apiKey: openAIToken,
  });
}


interface cacheValue {
  content: string;
}
const completionCache: Map<string, Promise<cacheValue>> = new Map();
let gptTokensUsed = 0;

//TODO: don't allow multiple calls for the same text, wait for the first one to finish
async function getOpenAICompletion(userMessage: string, systemPrompt: string) {
  const cacheKey = `userMessage:${userMessage}|systemPrompt:${systemPrompt}`;

  if (completionCache.has(cacheKey)) {
    // Wait for the promise to resolve and return its result
    const cachedResult = await completionCache.get(cacheKey);
    if(!cachedResult){
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
      model: "gpt-3.5-turbo",
      messages: [
        { "role": "system", "content": systemPrompt },
        { "role": "user", "content": userMessage }
      ],
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


async function getGPTClassification(text: string, subject:MLSubject){
  const systemPrompt = `You are a system that tells if the user input is about the topic of ${subject.description} or not by answering "Yes" or "No"`;
  const userMessage = `"${text}"`;
  const response = await getOpenAICompletion(userMessage, systemPrompt);
  if(DEBUG){
    console.log('GPT response:', response);
    console.log("Text:", text);
  }
  const res_msg = response;
  if( res_msg === null){
    throw new Error('res_msg is null');
  }
  if (res_msg.includes('Yes')) {
    return true;
  } if (res_msg.includes('No')) {
    return false;
  } else {
    throw new Error('unexpected response from gpt');
  }
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
  await populateSubjectAndSave(subject);
}

/*
//TODO: why need this? to display names quickly?
export class SubjectNamesStore extends DatabaseStorage<string[]>{
  IndexedDBStoreName = LIST_OF_LIST_NAMES_DATASTORE;//TODO: rename the variable to explicit that ml lists are also stored here
  key = 'subjectNames';
  typeUpgrade = undefined;
  isType = (data: unknown): data is string[] => {
    return Array.isArray(data) && data.every(item => typeof item === 'string');
  }
  defaultValue: string[] = [];
}
 */

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
    const token = openAIToken;
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
};;

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
setInterval(logCounters, 10000);

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
  const systemPrompt = "You are an assistant that sends back around 10 strings that are related to the user description of a subject. Give 1 string per line. Make sure the strings are diverse in style but keep them all related to the user subject. Make it diverse, some can be casual others !"
  const userMessage = `"${subject}"`;
  const response = await getOpenAICompletion(userMessage, systemPrompt);
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

export async function isTextInSubject(subject:MLSubject, text:string){
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
