import {DEBUG, DEBUG_TOKEN_COST} from "../../constants";
import {averageEmbeddings, cosineSimilarity} from "./mlHelpers";
import {InferenseServerSettingsStore, MLSubject, PopulatedFilterSubject, SubjectsStore} from "./mlTypes";
import {logCost,} from "./mlCosts";
import {getEmbeddings} from "./mlEmbeddings";
import {getGPTClassification, getKeywordsForSubject} from "./mlLLM";


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
  if(!subject.embedding_keywords){
    subject.embedding_keywords = await getKeywordsForSubject(subject.description, await settingsStore.get());
  }
  if(!subject.embedding){
    const embedding_promises = subject.embedding_keywords.map(async keyword => await getEmbeddings(keyword));
    // wait for all promises to resolve
    const embeddings = await Promise.all(embedding_promises);
    //average the embeddings
    subject.embedding = averageEmbeddings(embeddings);
    await subjectsStore.set(subject.description, subject);
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
    const gptResult = await getGPTClassification(text, await settingsStore.get(), subject);
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
  const gptResult = await getGPTClassification(text, await settingsStore.get(), subject);
  if(gptResult){
    return true;
  }
  else{
    return false;
  }
}

export async function isTextInSubject(subject:MLSubject, text:string){
  const settings = await settingsStore.get();

  if(settings.embedType !== "none"){
    let embed_result = false;
    if(settings.embedType === 'openai'){
      const threshold = 0.76;
      const populatedSubject = await populateSubjectAndSave(subject);
      const textEmbedding = await getEmbeddings(text);
      const similarity = cosineSimilarity(populatedSubject.embedding, textEmbedding);

      embed_result = similarity > threshold;
    } else {
      throw new Error('invalid embedding type');
    }
    if(embed_result ){
      if(settings.llmType === 'none'){
        //no llm
        return true;
      } else {
        //confirm with gpt
        return await getGPTClassification(text, settings, subject);
      }
    } else {
      return false;
    }
  }
  else if(settings.llmType !== "none"){
    //llm only
    return await getGPTClassification(text, settings, subject);
  } else {
    //no llm or embedding enabled
    return false;
  }
}
