import {DatabaseStorage, FullDataStore} from "../datastore";
import {DEBUG_STORE_NAME, INFERENCE_SETTINGS_KEY, SETTINGS_STORE_NAME, SUBJECTS_STORE_NAME} from "../../constants";

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

export class TotalCostStore extends DatabaseStorage<number> {
  defaultValue: number = 0;
  IndexedDBStoreName: string = DEBUG_STORE_NAME;
  key: string = 'apiCost';
  typeUpgrade = undefined;
  isType = (data: unknown): data is number => {
    return typeof data === 'number';
  };

  async add(value: number): Promise<void> {
    await this.set(await this.get() + value);
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