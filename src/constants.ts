import {Action, ColorTheme} from "./modules/types";


export const EXTENSION_NAME= "mindguard"

export const DEBUG = process.env.NODE_ENV === 'development'
export const DEBUG_MESSAGES = false;

export const BATCH_STAT_UPDATE_INTERVAL = 60000; // 60 seconds

//Database default values
export const  DEFAULT_WORD_STATISTICS = 0;
export const DEFAULT_LISTNAMES_ARRAY = [];
export const DEFAULT_WORDLIST = [];
export const DEFAULT_HOSTNAME_BLACKLIST = [];
export const  DEFAULT_FILTER_ACTION = Action.BLUR;
export const DEFAULT_COLOR_THEME = ColorTheme.LIGHT;

//TODO: cleaner way to represent all lists
export const ALL_LISTS_SYMBOL = 'All_LISTS_3213546516541';

//storage keys
export const WORD_STATISTICS_KEY_PREFIX = 'statistics-word-';
export const FILTER_LIST_KEY_PREFIX = 'list-';
export const LIST_OF_LIST_NAMES_KEY_PREFIX = "listNames"
export const BLACKLISTED_WEBSITES_KEY_PREFIX = 'blacklist';

