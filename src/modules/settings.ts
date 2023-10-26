import {getStorageKey, setStorageKey} from "./storage";
import {isAction, isColorTheme} from "./typeguards";
import {DEFAULT_COLOR_THEME, DEFAULT_FILTER_ACTION} from "../constants";
import {Action, ColorTheme} from "./types";


const actionToApplyOnFilterKey = 'actionToApplyOnFilter';

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


export function setColorTheme(theme: ColorTheme){
  localStorage.setItem('colorTheme', JSON.stringify(theme));
}

export function getColorTheme(): ColorTheme {
  //not async to avoid flash when loading dark theme
  const themeString = localStorage.getItem('colorTheme');
  if(themeString === null){
    return DEFAULT_COLOR_THEME;
  }
  const theme = JSON.parse(themeString);
  if(!isColorTheme(theme)){
    if(theme === null){
      return DEFAULT_COLOR_THEME;
    }
    throw new Error('theme is not of type ColorTheme');
  }
  return theme;
}