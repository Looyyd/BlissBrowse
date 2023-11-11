import {ListNamesDataStore} from "../modules/wordLists";
import React, {useContext} from "react";


const DataStoreContext = React.createContext({
    listNamesDataStore: new ListNamesDataStore(), // providing a default value
});

type DataStoreProviderProps = {
  children: React.ReactNode;
}

export const DataStoreProvider: React.FC<DataStoreProviderProps> = ({ children }) => {
  const listNamesDataStore = new ListNamesDataStore();

  return (
    <DataStoreContext.Provider value={{listNamesDataStore}}>
      {children}
    </DataStoreContext.Provider>
  );
}

export const useDataStore = () => useContext(DataStoreContext);