import {ListNamesDataStore} from "../modules/wordLists";
import React, {useContext} from "react";
import {SubjectsStore} from "../modules/ml";


const DataStoreContext = React.createContext({
  listNamesDataStore: new ListNamesDataStore(), // providing a default value
  subjectsDataStore: new SubjectsStore(),
});

type DataStoreProviderProps = {
  children: React.ReactNode;
}

export const DataStoreProvider: React.FC<DataStoreProviderProps> = ({ children }) => {
  const listNamesDataStore = new ListNamesDataStore();
  const subjectsDataStore = new SubjectsStore();

  return (
    <DataStoreContext.Provider value={{listNamesDataStore, subjectsDataStore }}>
      {children}
    </DataStoreContext.Provider>
  );
}

export const useDataStore = () => useContext(DataStoreContext);