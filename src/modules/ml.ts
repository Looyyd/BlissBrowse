import {huggingFaceToken, openAIToken} from "./secrets";
import {DEBUG, DEBUG_STORE_NAME, LIST_OF_LIST_NAMES_DATASTORE, SUBJECTS_STORE_NAME} from "../constants";
import {DatabaseStorage, FullDataStore} from "./datastore";
import {IndexedDBKeyValueStore} from "./types";

class TextEmbeddingCounterStore extends DatabaseStorage<number>{
  defaultValue: number = 0;
  IndexedDBStoreName: string = DEBUG_STORE_NAME;
  key: string = 'textEmbeddingCounter';
  typeUpgrade = undefined;
  isType = (data: unknown): data is number => {
    return typeof data === 'number';
  };

  async add(value: number): Promise<void> {
    await this.set(await this.get() + value);
  }
}


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

export class SubjectsStore extends FullDataStore<FilterSubject> {
  isType = (data: unknown): data is FilterSubject => {
    return typeof data === 'object' && data !== null && 'description' in data;
  }
  IndexedDBStoreName = SUBJECTS_STORE_NAME;
  key = 'subjects';
  typeUpgrade = undefined;
  defaultValue = undefined;

  //overwrite get to populate with politics for testing
  async get(): Promise<IndexedDBKeyValueStore<FilterSubject>> {
    const subjects = await super.get();
    //TODO: remove, just adding this for testing
    if (Object.keys(subjects).length === 0) {
      const en_pol_keywords = [
        "politics", "government", "democracy", "election", "policy",
        "legislation", "senate", "congress", "parliament", "voting",
        "campaign", "candidate", "diplomacy", "international relations",
        "political party", "ideology", "conservative", "liberal",
        "socialism", "capitalism", "debate", "referendum", "civic",
        "bureaucracy", "administration", "constitution", "reform",
        "geopolitics", "diplomat", "politician", "representative",
        "law", "rights", "governance", "political science", "civic engagement",
        "public policy", "diplomatic", "political campaign", "voter",
        "electorate", "political debate", "political ideology", "political reform",
        "political leader", "political activism", "political crisis", "political discourse"
      ]
      const politicsSubject: FilterSubject = {
        description: 'politics',
        embedding_keywords: en_pol_keywords
      }
      subjects['politics'] = {key: 'politics', value: politicsSubject};
    }
    return subjects;
  }
}

const subjectsStore = new SubjectsStore();
export async function getSubjects(): Promise<FilterSubject[]> {
  const keyvalues = await subjectsStore.get();
  const answer = Object.values(keyvalues).map(keyvalue => keyvalue.value);
  return answer;
}

export interface FilterSubject{
  description: string;
  embedding_keywords?: string[];
  embedding?: number[];
}
interface PopulatedFilterSubject extends FilterSubject{
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
  return dotProduct(vecA, vecB) / (magnitude(vecA) * magnitude(vecB));
}

async function getEmbeddingsHuggingFace(text: string): Promise<number[]> {

  async function query(data: { inputs: string }) {
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
    return result;
  }

  let embedding;

  const response = await query({"inputs": text});
  console.log(JSON.stringify(response));
  embedding = response[0] as number[];

  return embedding;

}

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
let previousTotalTextLength = 0;
let countDataStore = new TextEmbeddingCounterStore();
let cacheHits = 0;

interface QueueItem {
    text: string;
    resolve: (value: number[] | PromiseLike<number[]>) => void;
    reject: (reason?: any) => void;
}

let embeddingQueue: QueueItem[] = [];
let queueTimer: NodeJS.Timeout | null = null;

const QUEUE_MAX_SIZE = 100;//TODO: what is the right size? maybe depend on the size of the text?
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
  const countToAdd = totalTextLength - previousTotalTextLength;
  await countDataStore.add(countToAdd);
  previousTotalTextLength = totalTextLength;
}

// Set interval for every 10 seconds
setInterval(logCounters, 10000);

const embeddingCache = new Map();

async function getEmbeddings(text: string): Promise<number[]> {
    // Check if the cache already has the embedding for this text
    if (embeddingCache.has(text)) {
        cacheHits++;
        return embeddingCache.get(text) as number[];
    }

    totalTextLength += text.length;
    totalStringsNumber++;
    console.log("String ", text);
    const embedding = await addToQueue(text);

    embeddingCache.set(text, embedding);

    return embedding;
}



async function getKeywordsForSubject(subject: string): Promise<string[]> {
  //TODO: implement
  const en_pol_keywords = [
    "politics", "government", "democracy", "election", "policy",
    "legislation", "senate", "congress", "parliament", "voting",
    "campaign", "candidate", "diplomacy", "international relations",
    "political party", "ideology", "conservative", "liberal",
    "socialism", "capitalism", "debate", "referendum", "civic",
    "bureaucracy", "administration", "constitution", "reform",
    "geopolitics", "diplomat", "politician", "representative",
    "law", "rights", "governance", "political science", "civic engagement",
    "public policy", "diplomatic", "political campaign", "voter",
    "electorate", "political debate", "political ideology", "political reform",
    "political leader", "political activism", "political crisis", "political discourse"
]
  return en_pol_keywords;
}

export function shouldTextBeSkippedML(text: string): boolean {
  if (text.trim().length < 20) {
    return true;
  }
  return false;
}

export async function populateSubjectAndSave(subject: FilterSubject){
  if(!subject.description){
    throw new Error('subject.description is required');
  }
  if(!subject.embedding_keywords){
    subject.embedding_keywords = await getKeywordsForSubject(subject.description);
  }
  if(!subject.embedding){
    subject.embedding = await getEmbeddings(subject.embedding_keywords.join(' '));
    await subjectsStore.set(subject.description, subject);//TODO: what keys to use? description could change if user edits it
  }
  return subject as PopulatedFilterSubject;
}

export async function isTextInSubject(subject:FilterSubject, text:string){
  const threshold = 0.76;
  const populatedSubject = await populateSubjectAndSave(subject);
  console.log("Before getEmbeddings");
  const textEmbedding = await getEmbeddings(text);
  console.log("After getEmbeddings");
  const similarity = cosineSimilarity(populatedSubject.embedding, textEmbedding);

  return similarity > threshold;
}
