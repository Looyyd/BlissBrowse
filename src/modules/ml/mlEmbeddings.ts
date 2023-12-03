import {addEmbeddingTokensUsed} from "./mlCosts";
import {InferenseServerSettingsStore} from "./mlTypes";
import {huggingFaceToken} from "../secrets";

//TODO: is used by ml and mlEmbeddings, how to have single instance?
const settingsStore = new InferenseServerSettingsStore()

async function getEmbeddingsOpenAI(texts: string[]): Promise<number[][]> {

  const fetchEmbedding = async (inputTexts: string[]): Promise<any> => {
    const settings = await settingsStore.get();
    if (settings.type !== 'openai') {
      throw new Error('getting embeddings from openai but settings.type is not openai');
    }
    if (!settings.token) {
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
      addEmbeddingTokensUsed(tokensUsed)
      if (jsonResponse.data === undefined) {
        throw new Error(`'data' field is undefined or empty in the response`);
      }
      return jsonResponse.data.map((item: any) => item.embedding);
    } catch (error) {
      console.error('Error:', error);
      console.log('inputTexts:', inputTexts);
      if (response.json) {
        console.log('response.json:', await response.json());
      }
      return null;
    }
  };

  const time = Date.now();
  const response = await fetchEmbedding(texts);
  console.log('time taken to get embeddings:', Date.now() - time);
  return response as number[][];
}

interface QueueItem {
  text: string;
  resolve: (value: number[] | PromiseLike<number[]>) => void;
  reject: (reason?: any) => void;
}

let embeddingQueue: QueueItem[] = [];
let queueTimer: NodeJS.Timeout | null = null;
//const QUEUE_MAX_SIZE = 100;//TODO: what is the right size? maybe depend on the size of the text?
const QUEUE_MAX_SIZE = 20; // jinaai
const QUEUE_TIME_LIMIT = 1000;
const processQueue = async () => {
  if (embeddingQueue.length === 0) return;

  // Create a copy of the current queue
  const currentQueue = [...embeddingQueue];

  // Clear the original queue immediately to prevent asynchronous modification issues
  embeddingQueue = [];

  const texts = currentQueue.map(item => item.text);
  const embeddings = await getEmbeddingsOpenAI(texts);
  //const embeddings = await getEmbeddingsHuggingFace(texts)

  // Process the copied queue
  embeddings.forEach((embedding, index) => {
    if (index < currentQueue.length) {
      const {resolve} = currentQueue[index];
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
    embeddingQueue.push({text, resolve, reject});

    if (embeddingQueue.length >= QUEUE_MAX_SIZE) {
      processQueue();
    }

    if (!queueTimer) {
      queueTimer = setTimeout(processQueue, QUEUE_TIME_LIMIT);
    }
  });
};
const embeddingCache = new Map<string, Promise<number[]>>();

export async function getEmbeddings(text: string): Promise<number[]> {
  // Check if the cache already has a promise for the embedding of this text
  if (embeddingCache.has(text)) {
    // Await the resolved value from the promise
    const embedding = await embeddingCache.get(text);
    if (!embedding) {
      throw new Error('embedding is undefined');
    }
    return embedding;
  }

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