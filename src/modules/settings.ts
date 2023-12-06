import {
  DEFAULT_FILTER_ACTION, DEFAULT_ML_FILTER_METHOD,
  FILTER_ACTION_KEY, LIST_SETTINGS_STORE_NAME, ML_FILTER_METHOD_KEY,
  SETTINGS_STORE_NAME
} from "../constants";
import {ColorTheme, FilterAction, isColorTheme, isFilterAction} from "./types";
import {DatabaseStorage, FullDataStore} from "./datastore";
import {isMLFilterMethod, MLFilterMethod} from "./ml/mlTypes";


//TODO: tbh all global settings could just be in 1 object and stored in 1 store

export class FilterActionStore extends DatabaseStorage<FilterAction>{
  IndexedDBStoreName = SETTINGS_STORE_NAME;
  key = FILTER_ACTION_KEY;
  defaultValue = DEFAULT_FILTER_ACTION;
  isType = isFilterAction;
  typeUpgrade = undefined;
}

export class MLFilterMethodStore extends DatabaseStorage<MLFilterMethod>{
  IndexedDBStoreName = SETTINGS_STORE_NAME;
  key = ML_FILTER_METHOD_KEY;
  defaultValue = DEFAULT_ML_FILTER_METHOD;
  isType = isMLFilterMethod;
  typeUpgrade = undefined;
}


export type ListSettings = {
  disabled?: boolean;
}
export const DEFAULT_LIST_SETTINGS: ListSettings = {
  disabled: false
}

//TODO: this can be deleted i think, settings are included in list object now
export class ListSettingsStore extends DatabaseStorage<ListSettings>{
  key: string;
  IndexedDBStoreName = LIST_SETTINGS_STORE_NAME;
  defaultValue = {disabled: false};
  isType = (data:unknown): data is ListSettings => data !== null;//TODO: implement a funciton, but is it needed since there are null defaults?
  typeUpgrade = undefined;

  constructor(public listName: string) {
    super();
    this.key = listName;
  }

  async get(): Promise<ListSettings> {
    const result = await super.get();
    console.log("ListSettingsStore.get", result);
    return result;
  }
}

/*
export class FullListSettingsStore extends FullDataStore<ListSettings>{
  IndexedDBStoreName = LIST_SETTINGS_STORE_NAME;
  isType = (data:unknown): data is ListSettings => data !== null;//TODO: implement a funciton, but is it needed since there are null defaults?
  defaultValue = DEFAULT_LIST_SETTINGS;
  typeUpgrade = undefined;
}

 */