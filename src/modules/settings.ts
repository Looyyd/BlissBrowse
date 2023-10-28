import {DEFAULT_COLOR_THEME, DEFAULT_FILTER_ACTION} from "../constants";
import {Action, ColorTheme, isAction, isColorTheme} from "./types";
import {DatabaseStorage, LocalStorageStore} from "./datastore";


const actionToApplyOnFilterKey = 'actionToApplyOnFilter';

export class FilterActionStore extends DatabaseStorage<Action>{
  key = actionToApplyOnFilterKey;
  defaultValue = DEFAULT_FILTER_ACTION;
  isType = isAction;
}

export class ColorThemeStore extends LocalStorageStore<ColorTheme>{
  key = 'colorTheme';
  defaultValue = DEFAULT_COLOR_THEME;
  isType = isColorTheme;
}
