import {getStorageKey, setStorageKey} from "./storage";
import {isAction, isColorTheme} from "./typeguards";
import {DEFAULT_COLOR_THEME, DEFAULT_FILTER_ACTION} from "../constants";
import {Action, ColorTheme} from "./types";


const actionToApplyOnFilterKey = 'actionToApplyOnFilter';
const colorThemeKey = 'colorTheme';

export async function getFilterAction(): Promise<Action> {
  const action = await getStorageKey<Action>(actionToApplyOnFilterKey);
  if(!isAction(action)){
    if(action === null){
      return DEFAULT_FILTER_ACTION;
    }
    throw new Error('action is of type Action');
  }
  return action;
}

export async function setFilterAction(action: Action) {
  await setStorageKey(actionToApplyOnFilterKey, action);
}


export async function setColorTheme(theme: ColorTheme){
  await setStorageKey(colorThemeKey, theme);
}

export async function getColorTheme(): Promise<ColorTheme> {
  const theme = await getStorageKey<ColorTheme>(colorThemeKey);
  if(!isColorTheme(theme)){
    if(theme === null){
      return DEFAULT_COLOR_THEME;
    }
    throw new Error('theme is not of type ColorTheme');
  }
  return theme;
}