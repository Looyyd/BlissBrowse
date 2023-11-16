import {WordStatistic} from "./wordLists";

export enum FilterAction {
  BLUR = "blur",
  HIDE = "hide"
}
export function isFilterAction(value: unknown): value is FilterAction {
  return typeof value === 'string' && Object.values(FilterAction).includes(value as FilterAction);
}

export enum ColorTheme {
  LIGHT = "light",
  DARK = "dark"
}

export function isColorTheme(value: unknown): value is ColorTheme {
  return typeof value === 'string' && Object.values(ColorTheme).includes(value as ColorTheme);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}


export type StatisticsEntry = {
  key: string;
  value: WordStatistic;
};

export type StatisticsArray = StatisticsEntry[];

interface BaseMessage {
  action: ActionType;
  storeName: string;
  destination?: string;
  source?: string;
}

interface KeyedMessage extends BaseMessage {
  key: string;
}

export enum ActionType {
  Get = 'get',
  GetAll = 'getAll',
  Set = 'set',
  LocalStorageSet = 'localStorageSet',
  Remove = 'remove',
  DataChanged = 'dataChanged',
  ModelPredict = 'modelPredict',
}

// Message sent when data changes, to keep datastores in sync with background, sent from background
export interface DataChangeMessage<T> extends KeyedMessage {
  action: ActionType.DataChanged;
  value: T;
}

// Message sent to set IndexedDB data from the content,options, or popup script to the background script
export interface IndexedDBSetDataMessage<T> extends KeyedMessage {
  action: ActionType.Set;
  value: T;
}

// Message sent to inform that localstorage has been set from the content,options,
// or popup script to the background script.
// The background script will then sent a dataChanged message
export interface LocalStorageSetMessage<T> extends KeyedMessage {
  action: ActionType.LocalStorageSet;
  value: T;
}

// Message sent to get IndexedDB data from the background script to the content, options, or popup script
export interface GetDataMessage extends KeyedMessage {
  action: ActionType.Get;
}

// Message sent to remove IndexedDB data from the content,options, or popup script to the background script
export interface RemoveDataMessage extends KeyedMessage {
  action: ActionType.Remove;
}

// Message sent to get all IndexedDB data from a table, sent from the content,options, or popup script to the background script
export interface GetAllMessage extends BaseMessage {
  action: ActionType.GetAll;
}

export interface ModelPredictMessage{
  action: ActionType.ModelPredict;
  value: string;
}

// Union type for all possible messages
export type Message<T> = DataChangeMessage<T>
  | IndexedDBSetDataMessage<T>
  | LocalStorageSetMessage<T>
  | RemoveDataMessage
  | GetDataMessage
  | GetAllMessage
  | ModelPredictMessage;


export interface MessageResponseSetSuccess {
  success: true;
}

export interface MessageResponseError {
  success: false;
  error: Error;
}

export interface MessageResponseGetSuccess{
  success: true;
  data: unknown;
}

export interface MessageResponseGetAllSuccess {
  success: true;
  data: unknown;
}

export type MessageResponseSet = MessageResponseSetSuccess | MessageResponseError;
export type MessageResponseGet = MessageResponseGetSuccess | MessageResponseError;
export type MessageResponseGetAll = MessageResponseGetAllSuccess | MessageResponseError;


export type IndexedDBKeyValueStore<T> = {
  [key: string]: {key:string, value: T};
};

export function KeyValue(key: string, value: any): {key:string, value: any}{
  return {key: key, value: value};
}

export function changeValueIndexedDB<T>(currentData: IndexedDBKeyValueStore<T>, key: string, newValue: T): void {
  currentData[key] = { key, value: newValue };
}