import {ColorTheme, FilterAction} from "./modules/types";


export const EXTENSION_NAME= "BlissBrowse"
export const DEFAULT_LIST_NAME = "default"

//content

export const FILTER_IGNORE_ATTRIBUTE = `data-${EXTENSION_NAME}-ignore`;

// DEBUG
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

//settings keys
export const BLACKLISTED_WEBSITES_KEY = 'blacklist';
export const FILTER_ACTION_KEY = 'actionToApplyOnFilter';
export const COLOR_THEME_KEY = 'colorTheme';

//hack store name
export const LOCAL_STORAGE_STORE_NAME = 'localStorage';

//INDEXEDDB store names
export const SETTINGS_STORE_NAME = 'settings';
export const WORD_STATISTICS_STORE_NAME = 'statistics';
export const FILTER_LIST_STORE_NAME = 'lists';
export const TRIE_STORE_NAME = 'tries';
export const LIST_OF_LIST_NAMES_KEY = "listNames"
//TODO: merge with lists into a single class?
export const LIST_SETTINGS_STORE_NAME = "listSettings"

export const STORE_NAMES =
  [SETTINGS_STORE_NAME,
    WORD_STATISTICS_STORE_NAME,
    FILTER_LIST_STORE_NAME,
    TRIE_STORE_NAME,
    LIST_OF_LIST_NAMES_KEY,
    LIST_SETTINGS_STORE_NAME];
