import {DatabaseStorage, FullDataStore} from "../datastore";
import {
  DEBUG,
  DEBUG_STORE_NAME,
  INFERENCE_SETTINGS_KEY,
  SETTINGS_STORE_NAME,
  SUBJECTS_STORE_NAME
} from "../../constants";
import {FilterAction} from "../types";

export type llmServerTypes = 'openai' | 'local' | 'none';
export type embedServerTypes = 'openai' | 'none';

export interface inferenseServerSettings {
  llmType: llmServerTypes;
  llmURL?: string;
  llmToken?: string;
  embedType: embedServerTypes;
  embedURL?: string;
  embedToken?: string;
}

const DEFAULT_INFERENCE_SERVER_SETTINGS: inferenseServerSettings = {
  llmType: 'none',
  embedType: 'none',
};


export class InferenseServerSettingsStore extends DatabaseStorage<inferenseServerSettings> {
  IndexedDBStoreName = SETTINGS_STORE_NAME;
  key = INFERENCE_SETTINGS_KEY;
  typeUpgrade = undefined;
  isType = (data: unknown): data is inferenseServerSettings => {
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    const llmhasValidType = 'llmType' in data && typeof data.llmType=== 'string';
    const llmhasOptionalUrl = !('llmURL' in data) || typeof data.llmURL === 'string';
    const llmhasOptionalToken = !('llmToken' in data) || typeof data.llmToken === 'string';

    const embedhasValidType = 'embedType' in data && typeof data.embedType=== 'string';
    const embedhasOptionalUrl = !('embedURL' in data) || typeof data.embedURL === 'string';
    const embedhasOptionalToken = !('embedToken' in data) || typeof data.embedToken === 'string';

    return llmhasValidType && llmhasOptionalUrl && llmhasOptionalToken && embedhasValidType && embedhasOptionalUrl && embedhasOptionalToken;
  };
  defaultValue = DEFAULT_INFERENCE_SERVER_SETTINGS;
}

enum Duration {
  Month = "month",
}

export interface MLCost {
  lastResetDate: Date | string;
  cost: number;
  resetInterval: Duration;
  budgetLimit?: number;
}

const defaultMLCost: MLCost = {
  lastResetDate: new Date(),
  cost: 0,
  resetInterval: Duration.Month,
  budgetLimit: undefined,
};

function isValidDateString(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()); // Check if the date is valid
}

function costTypeCheck(data: unknown): data is MLCost {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const hasValidLastResetDate = 'lastResetDate' in data && (typeof data.lastResetDate === 'string' && isValidDateString(data.lastResetDate) || data.lastResetDate instanceof Date);
  const hasValidCost = 'cost' in data && typeof data.cost === 'number';
  const hasValidResetInterval = 'resetInterval' in data && typeof data.resetInterval === 'string' && Object.values(Duration).includes(data.resetInterval as Duration);
  const hasOptionalBudgetLimit = !('budgetLimit' in data) || typeof data.budgetLimit === 'number';

  return hasValidLastResetDate && hasValidCost && hasValidResetInterval && hasOptionalBudgetLimit;
}


function costUpgrade(data:unknown){
  if(typeof data === 'number'){
    return {
      ...defaultMLCost,
      cost: data,
    }
  } else {
    throw new Error('invalid data type');
  }
}

export class MlCostStore extends DatabaseStorage<MLCost> {
  defaultValue: MLCost = defaultMLCost;
  IndexedDBStoreName: string = DEBUG_STORE_NAME;
  key: string = 'apiCost';
  typeUpgrade = costUpgrade;
  isType = costTypeCheck;

  async resetCost(): Promise<void> {
    if(DEBUG){
      console.log('resetting api cost');
    }
    const cost = await this.get();
    await this.set({ ...cost, lastResetDate: new Date(), cost: 0 });
  }

  async get(): Promise<MLCost> {
    const cost = await super.get();
    const date = new Date(cost.lastResetDate);
    if (date.getMonth() !== new Date().getMonth()) {
      await this.resetCost();
    }
    return await super.get();
  }

  async add(value: number): Promise<void> {
    const cost = await this.get();
    await this.set({ ...cost, cost: cost.cost + value });
  }

  async setBudgetLimit(value: number | undefined): Promise<void> {
    const cost = await this.get();
    await this.set({ ...cost, budgetLimit: value });
  }
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

export interface MLSubject {
  description: string;
  embedding_keywords?: string[];
  embedding?: number[];
  filterAction?: FilterAction;
}

export interface PopulatedFilterSubject extends MLSubject {
  embedding_keywords: string[];
  embedding: number[];
}