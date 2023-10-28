import {COLOR_THEME_KEY, DEFAULT_COLOR_THEME, DEFAULT_FILTER_ACTION, FILTER_ACTION_KEY} from "../constants";
import {ColorTheme, FilterAction, isColorTheme, isFilterAction} from "./types";
import {DatabaseStorage, LocalStorageStore} from "./datastore";


export class FilterActionStore extends DatabaseStorage<FilterAction>{
  key = FILTER_ACTION_KEY;
  defaultValue = DEFAULT_FILTER_ACTION;
  isType = isFilterAction;
}

export class ColorThemeStore extends LocalStorageStore<ColorTheme>{
  key = COLOR_THEME_KEY;
  defaultValue = DEFAULT_COLOR_THEME;
  isType = isColorTheme;
}
