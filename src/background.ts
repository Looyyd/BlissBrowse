import {DEBUG, DEBUG_MESSAGES, FIRST_INSTALL_DEFAULT_LIST_NAME, ML_MODEL_PATH} from "./constants";
import IndexedDBModule from "./modules/IndexedDBModule";
import {
  ActionType,
  DataChangeMessage,
  Message,
  MessageResponseError,
  MessageResponseGetAllSuccess, MessageResponseGetSuccess,
  MessageResponseSetSuccess
} from "./modules/types";
import {ListNamesDataStore} from "./modules/wordLists";

import { AutoModel, AutoTokenizer, PreTrainedTokenizer, PreTrainedModel, TokenizerModel } from "@xenova/transformers";

let inMemoryModel: PreTrainedModel | null = null;
let inMemoryTokenizer: PreTrainedTokenizer | null = null;

const loadModel = async () => {
  const path = "/jinaai/jina-embeddings-v2-small-en/";
  const model = await AutoModel.from_pretrained(path,
    {local_files_only: true});
  return model;
}
const loadTokenizer = async () => {
  const path = "/jinaai/jina-embeddings-v2-small-en/";
  const tokenizer = await AutoTokenizer.from_pretrained(path,
    {local_files_only: true});
  return tokenizer;
}

const handlePredict = async (value: string, sendResponse: SendResponseFunc): Promise<void> => {
  if (!inMemoryModel) {
    inMemoryModel = await loadModel();
  }
  if (!inMemoryTokenizer) {
    inMemoryTokenizer = await loadTokenizer();
  }
  // Make a prediction
  const inputTokens = await inMemoryTokenizer(value);
  const output = await inMemoryModel(inputTokens);
  console.log("Output: ", output);
  sendResponse({ success: true, data: output as unknown } as MessageResponseGetAllSuccess);
}
  

/*
import { AutoTokenizer, PreTrainedTokenizer, Tensor } from '@xenova/transformers';
import * as tf from '@tensorflow/tfjs';
let inMemoryModel: tf.GraphModel | null = null;
let inMemoryTokenizer: PreTrainedTokenizer | null = null;
async function loadModel() {
  const model = await tf.loadGraphModel(ML_MODEL_PATH);
  return model;
}
async function loadTokenizer() : Promise<PreTrainedTokenizer> {
  let tokenizer = await AutoTokenizer.from_pretrained('jinaai/jina-embeddings-v2-small-en');
  return tokenizer;
}
const handlePredict = async (value: string, sendResponse: SendResponseFunc): Promise<void> => {
  if (!inMemoryModel) {
    inMemoryModel = await loadModel();
  }
  if (!inMemoryTokenizer) {
    inMemoryTokenizer = await loadTokenizer();
  }
  // Tokenize the input text.
  const inputText = value.padEnd(512, ' ');
  let { input_ids }: { input_ids: Tensor } = await inMemoryTokenizer(inputText);
  console.log(input_ids);
  console.log("Data :", input_ids.data)
  //const dataArray = Array.from(input_ids.data, (n) => Number(n));
  // pad to 512
  const dataArray = Array.from(input_ids.data, (n) => Number(n)).concat(Array(512 - input_ids.data.length).fill(0));
  console.log("Converted Data :", dataArray);

  //put to int32

  let inputTensor = tf.tensor(dataArray, undefined, 'int32');

  let reshapedTensor = inputTensor.reshape([1, 512]);

  // Make a prediction
  inMemoryModel.executeAsync(reshapedTensor).then(output => {
    // Handle the output tensor here
    // The output is a tf.Tensor or an array of tf.Tensors
    console.log("Output: ", output);
    sendResponse({ success: true, data: output as unknown } as MessageResponseGetAllSuccess);
  });
}
*/


(async () => {
  await IndexedDBModule.init();
})();


chrome.runtime.onInstalled.addListener(async function(details) {
  if (details.reason === 'install') {
    // This block will run when the extension is first installed

    // create default wordlist
    //TODO: test if this works, because it doesn't with load unpacked extension
    const dataStore = new ListNamesDataStore();
    await dataStore.createNewList(FIRST_INSTALL_DEFAULT_LIST_NAME);
    if(DEBUG){
      console.log('default list created');
    }
  } else if (details.reason === 'update') {
    // This block will run when the extension is updated
    // You can also set or update storage values here
  }
});


type SendResponseFunc = (response: unknown) => void;

const handleGet = (storeName: string, key: string, sendResponse: SendResponseFunc): void => {
  IndexedDBModule.getIndexedDBKey(storeName, key)
    .then((data: unknown) => {
      if (DEBUG_MESSAGES) {
        console.log('Sending data from background listener data:', data);
      }
      sendResponse({ success: true, data } as MessageResponseGetSuccess);
    })
    .catch((error: unknown) => {
      if (error instanceof Error) {
        sendResponse({ success: false, error: error } as MessageResponseError);
      } else {
        sendResponse({ success: false, error: new Error('An unknown error occurred.') } as MessageResponseError);
      }
    });
};

const handleGetAll = (storeName: string, sendResponse: SendResponseFunc): void => {
  IndexedDBModule.getAllIndexedDBKeys(storeName)
    .then((data: unknown) => {
      if (DEBUG_MESSAGES) {
        console.log('Sending data from background listener data:', data);
      }
      sendResponse({ success: true, data } as MessageResponseGetAllSuccess);
    })
    .catch((error: unknown) => {
      if (error instanceof Error) {
        sendResponse({ success: false, error: error } as MessageResponseError);
      } else {
        sendResponse({ success: false, error: new Error('An unknown error occurred.') } as MessageResponseError);
      }
    });
}


function sendDataChangedMessage(storeName: string, key: string, value: unknown) {
  const message : DataChangeMessage<unknown>= { action: ActionType.DataChanged, key: key, value: value, storeName: storeName };
  if(DEBUG_MESSAGES){
    console.log('message sent from sendDataChangedMessage', message);
  }
  message.source = 'background';
  message.destination = 'runtime';
  chrome.runtime.sendMessage(message, () => {
  });
  message.destination = 'tabs';
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id!,message, () => {

      });
    }
  });
}

const handleSet = (storeName: string, key: string, value: unknown, sendResponse: SendResponseFunc): void => {
  IndexedDBModule.setIndexedDBKey(storeName, key, value)
    .then(() => {
      sendDataChangedMessage(storeName, key, value);
      sendResponse({ success: true } as MessageResponseSetSuccess);
    })
    .catch((error: unknown) => {
      if (error instanceof Error) {
        sendResponse({ success: false, error: error } as MessageResponseError);
      } else {
        sendResponse({ success: false, error: new Error('An unknown error occurred.') } as MessageResponseError);
      }
    });
};


const handleRemove = (storeName: string, key: string, sendResponse: SendResponseFunc): void => {
  IndexedDBModule.removeIndexedDBKey(storeName, key)
    .then(() => {
      sendDataChangedMessage(storeName, key, null);//TODO: what should be sent here? default value?
      sendResponse({ success: true } as MessageResponseSetSuccess);
    })
    .catch((error: unknown) => {
      if (error instanceof Error) {
        sendResponse({ success: false, error: error } as MessageResponseError);
      } else {
        sendResponse({ success: false, error: new Error('An unknown error occurred.') } as MessageResponseError);
      }
    });
}

chrome.runtime.onMessage.addListener((request: Message<unknown>, sender, sendResponse) => {
  if (DEBUG_MESSAGES) {
    console.log('request in background listener:', request);
  }

  switch(request.action) {
    case ActionType.Get:
      handleGet(request.storeName, request.key, sendResponse);
      break;
    case ActionType.GetAll:
      handleGetAll(request.storeName, sendResponse);
      break;
    case ActionType.Set:
      handleSet(request.storeName, request.key, request.value,sendResponse);
      break;
    case ActionType.LocalStorageSet:
      //only inform of change, can't set local storage from background so must be done from content script
      sendDataChangedMessage(request.storeName, request.key, request.value);
      sendResponse({ success: true } as MessageResponseSetSuccess);
      break;
    case ActionType.Remove:
      handleRemove(request.storeName, request.key, sendResponse);
      break;
    case ActionType.DataChanged:
      sendResponse({ success: true } as MessageResponseSetSuccess);
      break;
    case ActionType.ModelPredict:
      handlePredict(request.value, sendResponse);
      break;
    default:
      if(DEBUG_MESSAGES){
        console.log("Unknown action in background listener: ", request);
      }
      sendResponse({ success: false, error: new Error('Unknown action in message.') } as MessageResponseError);
  }

  return true;  // This is necessary to handle the asynchronous response
});



