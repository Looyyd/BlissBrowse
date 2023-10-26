import {getStorageKey, setStorageKey} from "./storage";
import {isAction} from "./typeguards";
import {DEFAULT_FILTER_ACTION} from "../constants";
import {Action} from "./types";


const actionToApplyOnFilterKey = 'actionToApplyOnFilter';

export async function getFilterAction(): Promise<Action> {
  const action = await getStorageKey<Action>(actionToApplyOnFilterKey);
  if(!isAction(action)){
    if(action === null){
      return DEFAULT_FILTER_ACTION;
    }
    throw new Error('action is not a string array');
  }
  return action;
}

export async function setFilterAction(action: Action) {
  await setStorageKey(actionToApplyOnFilterKey, action);
}