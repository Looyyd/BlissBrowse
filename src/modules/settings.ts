import {
  COLOR_THEME_KEY,
  DEFAULT_COLOR_THEME,
  DEFAULT_FILTER_ACTION,
  FILTER_ACTION_KEY, LIST_SETTINGS_STORE_NAME,
  SETTINGS_STORE_NAME
} from "../constants";
import {ColorTheme, FilterAction, isColorTheme, isFilterAction} from "./types";
import {DatabaseStorage, FullDataStore, LocalStorageStore} from "./datastore";


export class FilterActionStore extends DatabaseStorage<FilterAction>{
  IndexedDBStoreName = SETTINGS_STORE_NAME;
  key = FILTER_ACTION_KEY;
  defaultValue = DEFAULT_FILTER_ACTION;
  isType = isFilterAction;
}

export class ColorThemeStore extends LocalStorageStore<ColorTheme>{
  IndexedDBStoreName = SETTINGS_STORE_NAME;
  key = COLOR_THEME_KEY;
  defaultValue = DEFAULT_COLOR_THEME;
  isType = isColorTheme;
}


export type ListSettings = {
  disabled?: boolean;
}
export const DEFAULT_LIST_SETTINGS: ListSettings = {
  disabled: false
}

export class ListSettingsStore extends DatabaseStorage<ListSettings>{
  key: string;
  IndexedDBStoreName = LIST_SETTINGS_STORE_NAME;
  defaultValue = {disabled: false};
  isType = (data:unknown): data is ListSettings => data !== null;//TODO: implement a funciton, but is it needed since there are null defaults?

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

export class FullListSettingsStore extends FullDataStore<ListSettings>{
  IndexedDBStoreName = LIST_SETTINGS_STORE_NAME;
  isType = (data:unknown): data is ListSettings => data !== null;//TODO: implement a funciton, but is it needed since there are null defaults?
}