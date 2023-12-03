import {ListNamesDataStore} from "../modules/wordLists";
import React, {useContext} from "react";

import {InferenseServerSettingsStore, SubjectsStore} from "../modules/ml/mlTypes";


const DataStoreContext = React.createContext({
  listNamesDataStore: new ListNamesDataStore(), // providing a default value
  subjectsDataStore: new SubjectsStore(),
  inferenceSettingsDataStore: new InferenseServerSettingsStore(),
});

type DataStoreProviderProps = {
  children: React.ReactNode;
}

export const DataStoreProvider: React.FC<DataStoreProviderProps> = ({ children }) => {
  const listNamesDataStore = new ListNamesDataStore();
  const subjectsDataStore = new SubjectsStore();
  const inferenceSettingsDataStore = new InferenseServerSettingsStore();

  return (
    <DataStoreContext.Provider value={{listNamesDataStore, subjectsDataStore, inferenceSettingsDataStore }}>
      {children}
    </DataStoreContext.Provider>
  );
}

export const useDataStore = () => useContext(DataStoreContext);