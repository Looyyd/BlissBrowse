import {TotalCostStore} from "./mlTypes";
import {DEBUG} from "../constants";

export let embeddingTokensUsed = 0;
export let gptTokensUsed = 0;
let costStore = new TotalCostStore();
let previousTotalCost = 0;

export function addEmbeddingTokensUsed(tokens: number) {
  embeddingTokensUsed += tokens;
}
export function addGPTTokensUsed(tokens: number) {
  gptTokensUsed += tokens;
}

const gpt35TokenCost = 0.001 / 1000;
const embeddingTokenCost = 0.0001 / 1000;

// Debugging function
export async function logCost() {
  const totalCost = gptTokensUsed * gpt35TokenCost + embeddingTokensUsed * embeddingTokenCost;
  if(DEBUG){
    console.log("GPT Tokens Used:", gptTokensUsed);
    console.log("Embedding Tokens Used:", embeddingTokensUsed);
    console.log("Total cost $:", totalCost);
  }
  const costToAdd = totalCost - previousTotalCost;
  await costStore.add(costToAdd);
  previousTotalCost = totalCost;
}
