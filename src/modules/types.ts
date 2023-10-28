export enum Action {
  BLUR = "blur",
  HIDE = "hide"
}
export function isAction(value: unknown): value is Action {
  return typeof value === 'string' && Object.values(Action).includes(value as Action);
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

