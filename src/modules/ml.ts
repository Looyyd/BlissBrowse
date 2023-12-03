import {huggingFaceToken} from "./secrets";
import {DEBUG, DEBUG_TOKEN_COST} from "../constants";
import OpenAI from "openai";
import {preprocessTextBeforeEmbedding} from "./content_rewrite";
import {averageEmbeddings, cosineSimilarity, extractAndParseJSON, getAnswerFromJSON} from "./mlHelpers";
import {
  inferenseServerSettings,
  InferenseServerSettingsStore,
  MLSubject,
  PopulatedFilterSubject,
  SubjectsStore
} from "./mlTypes";
import {
  addEmbeddingTokensUsed,
  addGPTTokensUsed,
  logCost,
} from "./mlCosts";


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
      // it's ok, because there is no api key for local
    });
  } else {
    throw new Error('invalid settings type');
  }
}


interface cacheValue {
  content: string;
}
const completionCache: Map<string, Promise<cacheValue>> = new Map();

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
      addGPTTokensUsed(response.usage?.total_tokens || 0);
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


function createClassificationPrompt(text: string, descriptions: string[]):  OpenAI.Chat.Completions.ChatCompletionMessageParam[]{
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

async function getGPTClassification(text: string, subject:MLSubject){
  // TODO: multiple descriptions at once
  const messages = createClassificationPrompt(text, [subject.description]);

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
  const answers = getAnswerFromJSON(resObj);

  return answers[0] === 1;//TODO: handle multiple descriptions
}


export async function createNewSubject(description: string): Promise<void>{
  const subject: MLSubject = {
    description,
  }
  //save without embeddings, they will be populated on first use
  await subjectsStore.set(subject.description, subject);//TODO: what keys to use? description could change if user edits it
}


const subjectsStore = new SubjectsStore();
export async function getSubjects(): Promise<MLSubject[]> {
  const keyvalues = await subjectsStore.get();
  return Object.values(keyvalues).map(keyvalue => keyvalue.value);
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

async function getEmbeddingsOpenAI(texts: string[]): Promise<number[][]> {

  const fetchEmbedding = async (inputTexts: string[]): Promise<any> => {
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
      addEmbeddingTokensUsed(tokensUsed)
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
const QUEUE_MAX_SIZE = 20;// jinaai
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

// Set interval for every 10 seconds
if(DEBUG_TOKEN_COST){
  setInterval(logCost, 10000);
}

const embeddingCache = new Map<string, Promise<number[]>>();

async function getEmbeddings(text: string): Promise<number[]> {
  // Check if the cache already has a promise for the embedding of this text
  if (embeddingCache.has(text)) {
    // Await the resolved value from the promise
    const embedding = await embeddingCache.get(text);
    if(!embedding){
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
