import {DEBUG, DEBUG_TOKEN_COST} from "../../constants";
import {averageEmbeddings, cosineSimilarity} from "./mlHelpers";
import {
  EmbeddingCalculationMethod,
  inferenseServerSettings,
  InferenseServerSettingsStore,
  MLFilterMethod,
  MLSubject,
  PopulatedFilterSubject,
  SubjectsStore
} from "./mlTypes";
import {logCost,} from "./mlCosts";
import {getEmbeddings} from "./mlEmbeddings";
import {getGPTClassification, getSentencesForSubjectEmbeddings} from "./mlLLM";


const settingsStore = new InferenseServerSettingsStore()

if(DEBUG_TOKEN_COST) {
  setInterval(logCost, 5000);
}

export async function createNewSubject(description: string): Promise<void>{
  const subject: MLSubject = {
    description,
  }
  //save without embeddings, they will be populated on first use
  await subjectsStore.set(subject.description, subject);
}


const subjectsStore = new SubjectsStore();
export async function getSubjects(): Promise<MLSubject[]> {
  const keyvalues = await subjectsStore.get();
  return Object.values(keyvalues).map(keyvalue => keyvalue.value);
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
  if(!subject.sentences){
    subject.sentences = await getSentencesForSubjectEmbeddings(subject.description, await settingsStore.get());
  }
  if(!subject.embeddingAverage){
    const embedding_promises = subject.sentences.map(async keyword => await getEmbeddings(keyword));
    // wait for all promises to resolve
    const embeddings = await Promise.all(embedding_promises);
    //average the embeddings
    subject.sentencesEmbeddings = embeddings;
    subject.embeddingAverage = averageEmbeddings(embeddings);
    await subjectsStore.set(subject.description, subject);
  }
  return subject as PopulatedFilterSubject;
}

export async function isTextInSubjectLLM(subject:MLSubject, text:string, settings: inferenseServerSettings){
  if(settings.llmType !== "none"){
    //llm only
    return await getGPTClassification(text, settings, subject);
  } else {
    //no llm or embedding enabled
    return false;
  }
}

export async function isTextInSubjectEmbedding(subject:MLSubject, text:string, settings: inferenseServerSettings){
  const threshold = subject.embeddingSettings?.threshold || settings.embeddingSettings.threshold;
  const method = subject.embeddingSettings?.calculationMethod || settings.embeddingSettings.calculationMethod;
  if(settings.embedType !== "none") {
    let embed_result = false;
    if (settings.embedType === 'openai') {
      if(method === EmbeddingCalculationMethod.average) {
        const populatedSubject = await populateSubjectAndSave(subject);
        const textEmbedding = await getEmbeddings(text);
        const similarity = cosineSimilarity(populatedSubject.embeddingAverage, textEmbedding);

        embed_result = similarity > threshold;
      }
      else if (method === EmbeddingCalculationMethod.nearestNeighbour) {
        const populatedSubject = await populateSubjectAndSave(subject);
        const textEmbedding = await getEmbeddings(text);
        const similarities = populatedSubject.sentencesEmbeddings.map(embedding => cosineSimilarity(embedding, textEmbedding));
        const maxSimilarity = Math.max(...similarities);
        embed_result = maxSimilarity > threshold;
      }
    } else {
      throw new Error('invalid embedding type');
    }
    return embed_result;
  } else {
    return false;//TODO: throw error?
  }
}

export async function isTextInSubject(subject:MLSubject, text:string, filterMethod: MLFilterMethod){
  const settings = await settingsStore.get();

  if (filterMethod === MLFilterMethod.EMBEDDING) {
    return await isTextInSubjectEmbedding(subject, text, settings);
  } else if (filterMethod === MLFilterMethod.LLM) {
    return await isTextInSubjectLLM(subject, text, settings);
  } else if (filterMethod === MLFilterMethod.EMBEDDING_AND_LLM){
    const embed_result = await isTextInSubjectEmbedding(subject, text, settings);
    if(embed_result){
      //confirm with llm
      return await isTextInSubjectLLM(subject, text, settings);
    } else {
      return false;
    }
  }
  return false;
}
