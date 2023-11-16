import {huggingFaceToken, openAIToken} from "./secrets";
import {DEBUG} from "../constants";
import {LocalStorageStore, RowDataStore} from "./datastore";

class TextEmbeddingCounterStore extends LocalStorageStore<number>{
  defaultValue: number = 0;
  IndexedDBStoreName: string = 'textEmbeddingCounter';
  key: string = 'textEmbeddingCounter';
  typeUpgrade = undefined;
  isType = (data: unknown): data is number => {
    return typeof data === 'number';
  };

  add(value: number): Promise<void> | void {
    this.set(this.get() + value);
  }
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
  /*
  curl https://api.openai.com/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "input": "Your text string goes here",
    "model": "text-embedding-ada-002"
  }'
   */
  const fetchEmbedding = async (inputTexts: string[]): Promise<any> => {
    //TODO: handle tokens securely, remove from source code;
    const token = openAIToken;
    const url = 'https://api.openai.com/v1/embeddings';
    const model = 'text-embedding-ada-002';

    try {
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonResponse = await response.json();
      if (jsonResponse.data === undefined ) {
        throw new Error(`'data' field is undefined or empty in the response`);
      }
      //get .embedding for every data
      return jsonResponse.data.map((item: any) => item.embedding);
      //return jsonResponse.data[0].embedding;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  const response = await fetchEmbedding(texts);
  return response as number[][];
}

let totalEmbeddingCalls = 0;
let totalTextLength = 0;
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

const QUEUE_MAX_SIZE = 50;//TODO: what is the right size? maybe depend on the size of the text?
const QUEUE_TIME_LIMIT = 1000;

const processQueue = async () => {
  if (embeddingQueue.length === 0) return;

  const texts = embeddingQueue.map(item => item.text);

  totalEmbeddingCalls++;
  //const embeddings = await getEmbeddingsOpenAI(texts);
  const embeddings = texts.map(() => [0, 0, 0]);//TODO: remove dummy

  embeddings.forEach((embedding, index) => {
    const { resolve } = embeddingQueue[index];
    resolve(embedding);
  });

  embeddingQueue = [];
  if (queueTimer) {
    clearTimeout(queueTimer);
    queueTimer = null;
  }
};

const addToQueue = (text: string): Promise<number[]> => {
    return new Promise((resolve, reject) => {
        embeddingQueue.push({ text, resolve, reject });

        if (embeddingQueue.length >= QUEUE_MAX_SIZE || !queueTimer) {
            processQueue();
        } else if (!queueTimer) {
            queueTimer = setTimeout(processQueue, QUEUE_TIME_LIMIT);
        }
    });
};


// Debugging function
function logCounters() {
  console.log(`Total Embedding Calls: ${totalEmbeddingCalls}`);
  console.log(`Total Text Length: ${totalTextLength}`);
  console.log(`Cache Hits: ${cacheHits}`);
  const countToAdd = totalTextLength - previousTotalTextLength;
  countDataStore.add(countToAdd);
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
  //skip if less that 10 characters long after whitespace trimming
  if (text.trim().length < 10) {
    return true;
  }
  return false;
}

async function populateSubject(subject: FilterSubject){
  if(!subject.description){
    throw new Error('subject.description is required');
  }
  if(!subject.embedding_keywords){
    subject.embedding_keywords = await getKeywordsForSubject(subject.description);
  }
  if(!subject.embedding){
    subject.embedding = await getEmbeddings(subject.embedding_keywords.join(' '));
  }
  return subject as PopulatedFilterSubject;
}

export async function isTextInSubject(subject:FilterSubject, text:string){
  const threshold = 0.75;
  const populatedSubject = await populateSubject(subject);
  //TODO: save populatedSubject to storage
  const textEmbedding = await getEmbeddings(text);
  const similarity = cosineSimilarity(populatedSubject.embedding, textEmbedding);

  return similarity > threshold;
}
