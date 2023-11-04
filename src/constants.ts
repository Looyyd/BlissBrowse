import {ColorTheme, FilterAction} from "./modules/types";


export const EXTENSION_NAME= "mindguard"

export const DEBUG = process.env.NODE_ENV === 'development'
export const DEBUG_MESSAGES = false;
export const DEBUG_PERFORMANCE = false;

export const BATCH_STAT_UPDATE_INTERVAL = 10000; // 60 seconds

//Database default values
export const  DEFAULT_WORD_STATISTICS = 0;
export const DEFAULT_LISTNAMES_ARRAY = [];
export const DEFAULT_WORDLIST = [];
export const DEFAULT_HOSTNAME_BLACKLIST = [];
export const  DEFAULT_FILTER_ACTION = FilterAction.BLUR;
export const DEFAULT_COLOR_THEME = ColorTheme.LIGHT;

export const ALL_LISTS_SYMBOL = 'All_LISTS_3213546516541';

//storage keys
export const WORD_STATISTICS_KEY_PREFIX = 'statistics-word-';
export const FILTER_LIST_KEY_PREFIX = 'list-';
export const TRIE_KEY_PREFIX = 'trie-';
export const LIST_OF_LIST_NAMES_KEY_PREFIX = "listNames"
export const BLACKLISTED_WEBSITES_KEY_PREFIX = 'blacklist';
export const FILTER_ACTION_KEY = 'actionToApplyOnFilter';
export const COLOR_THEME_KEY = 'colorTheme';