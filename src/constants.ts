
export const devWords: string[] = ["c++", "requiem", "elon musk"];

export const scriptName= "mindguard"

export const DEBUG = process.env.NODE_ENV === 'development'


export const BATCH_STAT_UPDATE_INTERVAL = 60000; // 60 seconds

//Database default values
export const  DEFAULT_WORD_STATISTICS = 0;
export const DEFAULT_LISTNAMES_ARRAY = [];
export const DEFAULT_WORDLIST = [];
export const DEFAULT_HOSTNAME_BLACKLIST = [];


//TODO: cleaner way to represent all lists
export const ALL_LISTS = 'All_LISTS_3213546516541';

//storage keys
export const wordStatisticsKeyPrefix = 'statistics-word-';

