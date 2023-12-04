import {DatabaseStorage, FullDataStore} from "../datastore";
import {
  DEBUG,
  DEBUG_STORE_NAME,
  INFERENCE_SETTINGS_KEY,
  SETTINGS_STORE_NAME,
  SUBJECTS_STORE_NAME
} from "../../constants";

export type inferenseServerType = 'openai' | 'local' | 'none';

export interface inferenseServerSettings {
  type: inferenseServerType;
  url?: string;
  token?: string;
}

const DEFAULT_INFERENCE_SERVER_SETTINGS: inferenseServerSettings = {
  type: 'none',
};

export class InferenseServerSettingsStore extends DatabaseStorage<inferenseServerSettings> {
  IndexedDBStoreName = SETTINGS_STORE_NAME;
  key = INFERENCE_SETTINGS_KEY;
  typeUpgrade = undefined;
  isType = (data: unknown): data is inferenseServerSettings => {
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    const hasValidType = 'type' in data && typeof data.type === 'string';
    const hasOptionalUrl = !('url' in data) || typeof data.url === 'string';
    const hasOptionalToken = !('token' in data) || typeof data.token === 'string';

    return hasValidType && hasOptionalUrl && hasOptionalToken;
  };
  defaultValue = DEFAULT_INFERENCE_SERVER_SETTINGS;
}

enum Duration {
  Month = "month",
}

export interface MLCost {
  lastResetDate: Date;
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

function costTypeCheck(data: unknown): data is MLCost {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const hasValidLastResetDate = 'lastResetDate' in data && data.lastResetDate instanceof Date;
  const hasValidCost = 'cost' in data && typeof data.cost === 'number';
  const hasValidResetInterval = 'resetInterval' in data && typeof data.resetInterval === 'string';
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

export class TotalCostStore extends DatabaseStorage<MLCost> {
  defaultValue: MLCost = defaultMLCost;
  IndexedDBStoreName: string = DEBUG_STORE_NAME;
  key: string = 'apiCost';
  typeUpgrade = costUpgrade;
  isType = costTypeCheck;

  async reset(): Promise<void> {
    if(DEBUG){
      console.log('resetting api cost');
    }
    await this.set({ ...this.defaultValue, lastResetDate: new Date() });
  }

  async get(): Promise<MLCost> {
    if(DEBUG){
      console.log('getting api cost');
    }
    const cost = await super.get();
    if (cost.lastResetDate.getMonth() !== new Date().getMonth()) {
      await this.reset();
    }
    return await super.get();
  }

  async add(value: number): Promise<void> {
    if(DEBUG){
      console.log('adding api cost');
    }
    const cost = await this.get();
    await this.set({ ...cost, cost: cost.cost + value });
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
}

export interface PopulatedFilterSubject extends MLSubject {
  embedding_keywords: string[];
  embedding: number[];
}