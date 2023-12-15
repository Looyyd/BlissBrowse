import {ColorTheme, FilterAction} from "./modules/types";
import {MLFilterMethod} from "./modules/ml/mlTypes";


//GENERAL CONSTANTS
export const EXTENSION_NAME= "BlissBrowse"
export const FIRST_INSTALL_DEFAULT_LIST_NAME = "default"
export const ML_FEATURES = true;
export const ML_MODEL_PATH = "js_model/model.json"

// DEBUG
export const DEBUG = process.env.NODE_ENV === 'development'
export const DEBUG_MESSAGES = DEBUG && false;
export const DEBUG_PERFORMANCE = DEBUG && false;
export const DEBUG_TOKEN_COST = DEBUG && true;
export const DEBUG_FILTERING = DEBUG && false;
export const DEBUG_EMBEDDING = DEBUG && false;
export const DEBUG_PROMPTS = DEBUG && false;
export const DEBUG_CACHE = DEBUG && false;

//CONTENT AND COMPONENTS RELATED CONSTANTS
export const FILTER_IGNORE_ATTRIBUTE = `data-${EXTENSION_NAME}-ignore`.toLowerCase();
export const BATCH_STAT_UPDATE_INTERVAL = 10000; // 60 seconds
// This symbol is used to represent all lists in selectors
export const ALL_LISTS_SYMBOL = 'All_LISTS_3213546516541';

//INDEXEDDB RELATED CONSTANTS
//Database default values
export const DEFAULT_WORD_STATISTICS = { count: 0 };
export const DEFAULT_LISTNAMES_ARRAY = [];
export const DEFAULT_WORDLIST = [];
export const DEFAULT_HOSTNAME_BLACKLIST = [];
export const DEFAULT_FILTER_ACTION = FilterAction.BLUR;
export const DEFAULT_ML_FILTER_METHOD = MLFilterMethod.EMBEDDING_AND_LLM;
export const DEFAULT_COLOR_THEME = ColorTheme.LIGHT;
//settings keys
export const BLACKLISTED_WEBSITES_KEY = 'blacklist';
export const FILTER_ACTION_KEY = 'actionToApplyOnFilter';
export const COLOR_THEME_KEY = 'colorTheme';
export const INFERENCE_SETTINGS_KEY = "inferenseServerSettings";
export const ML_FILTER_METHOD_KEY = "mlFilterMethod";

//hack store name, it's not a real storage but it's used by listeners
export const LOCAL_STORAGE_STORE_NAME = 'localStorage';

//INDEXEDDB store names
export const SETTINGS_STORE_NAME = 'settings';
export const WORD_STATISTICS_STORE_NAME = 'statistics';
export const FILTER_LIST_STORE_NAME = 'lists';
export const TRIE_STORE_NAME = 'tries';
export const LIST_OF_LIST_NAMES_DATASTORE = "listNames"
export const LIST_SETTINGS_STORE_NAME = "listSettings"
export const DEBUG_STORE_NAME = 'debug';
export const SUBJECTS_STORE_NAME = 'subjects';

export const STORE_NAMES =
  [SETTINGS_STORE_NAME,
    WORD_STATISTICS_STORE_NAME,
    FILTER_LIST_STORE_NAME,
    TRIE_STORE_NAME,
    LIST_OF_LIST_NAMES_DATASTORE,
    LIST_SETTINGS_STORE_NAME,
    DEBUG_STORE_NAME,
    SUBJECTS_STORE_NAME];
