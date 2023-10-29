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


interface BaseMessage {
  action: string;
  key: string;
  destination?: string;
  source?: string;
}

// Generic DataChangeMessage type
export interface DataChangeMessage<T> extends BaseMessage {
  action: 'dataChanged';
  value: T;
}

// setData message type
export interface SetDataMessage<T> extends BaseMessage {
  action: 'set';
  value: T;
}

// getData message type
export interface GetDataMessage extends BaseMessage {
  action: 'get';
}

// Union type for all possible messages
export type Message<T> = DataChangeMessage<T> | SetDataMessage<T> | GetDataMessage;
