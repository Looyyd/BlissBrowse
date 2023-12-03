import {DEBUG} from "../../constants";
import {inferenseServerSettings} from "./mlTypes";
import OpenAI from "openai";

export function extractAndParseJSON(mixedString: string): any | null {
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

export function getAnswerFromJSON(resObj: any) {
  const answers: number[] = [];
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
        if(DEBUG){
          console.log(`Unexpected value: ${value}`)
        }
        throw new Error("json value doesn't contain yes, no or idk");
      }
    }
  }
  return answers;
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

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('vectors have different lengths');
  }
  return dotProduct(vecA, vecB) / (magnitude(vecA) * magnitude(vecB));
}

export function averageEmbeddings(embeddings: number[][]): number[] {
  const average = embeddings.reduce((sum, embedding) => {
    for (let i = 0; i < embedding.length; i++) {
      sum[i] += embedding[i];
    }
    return sum;
  }, embeddings[0].map(() => 0));
  return average.map(val => val / embeddings.length);
}

export function openAIClientFromSettings(settings: inferenseServerSettings): OpenAI {
  if (settings.type === 'openai') {
    if (!settings.token) {
      throw new Error('token is required');
    }
    return new OpenAI({
      apiKey: settings.token,
      dangerouslyAllowBrowser: true,//this is a security check to avoid that companies but their api key in the source code
      // it's ok, because the token is user submitted
    });
  } else if (settings.type === 'local') {
    if (!settings.url) {
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