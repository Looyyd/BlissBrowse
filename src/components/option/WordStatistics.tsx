import React, {useEffect, useMemo, useState} from 'react';
import {getFilterWordStatistics, ListNamesDataStore, FilterListDataStore} from "../../modules/wordLists";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  FormControl,
  SelectChangeEvent,
  Container
} from '@mui/material';
import TableCell from '@mui/material/TableCell';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ListSelector from "../ListSelector";
import {ALL_LISTS_SYMBOL, WORD_STATISTICS_STORE_NAME} from "../../constants";
import {getAllDataStore} from "../../modules/storage";
import {StatisticsArray, StatisticsEntry} from "../../modules/types";


type sortKey = 'key' | 'value'; // 'key' for word, 'value' for statistic

// Assuming this is the type for your sortConfig
export type SortConfig = {
  key: sortKey;
  direction: 'asc' | 'desc';
};

const WordStatistics = () => {
  const listNamesDataStore = new ListNamesDataStore();
  //fetched lists are not showed
  const [syncedLists,] = listNamesDataStore.useData([]);
  //lists are showed
  const [lists, setLists] = useState<string[] | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "key", direction: 'asc' });
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<StatisticsArray>([]);
  const [shownStatistics, setShownStatistics] = useState<StatisticsArray>([]);

  //TODO: into statistics type
  const columnNames = ["Word", "Times Seen"];

  useEffect(() => {
    //add "ALL LISTS" to the shown lists
    if(syncedLists !==null && syncedLists.length > 0 ){
      const newLists = [ALL_LISTS_SYMBOL].concat(syncedLists);
      setLists(newLists);
    }
  }, [syncedLists]);

  useEffect(() => {
    async function getStatistics(){
      //TODO: make the statistics refresh on change, create a datastore?
      const Statistics = await getAllDataStore<StatisticsEntry>(WORD_STATISTICS_STORE_NAME);
      console.log(Statistics);
      setStatistics(Statistics);
    }
    getStatistics();
  }, []);

  //set the first list as selectedList by default
  useEffect(() => {
    if (selectedList === null && lists !== null && lists.includes(ALL_LISTS_SYMBOL)) {
      setSelectedList(ALL_LISTS_SYMBOL);
    }
  }, [lists]);

  useEffect(() => {
    async function showListStatistics() {
      console.log('selectedList changed:', selectedList);
      if (lists !== null && lists.length > 0 && selectedList !== null) {
        if(selectedList === ALL_LISTS_SYMBOL){
          setShownStatistics(statistics);
        }else{
          const dataStore = new FilterListDataStore(selectedList);
          const words = await dataStore.get(); // Assuming this returns an array of strings
          const statisticsToShow = statistics.filter(entry => words.includes(entry.key));
          setShownStatistics(statisticsToShow);
        }
      }
    }
    showListStatistics();
  }, [selectedList]);

  const sortedStatistics = useMemo(() => {
    // Clone the array before sorting to avoid mutating state directly
    const sortableItems = [...shownStatistics];

    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        // Directly access the properties of the object
        const aValue = sortConfig.key === 'key' ? a[sortConfig.key].toLowerCase() : a[sortConfig.key];
        const bValue = sortConfig.key === 'key' ? b[sortConfig.key].toLowerCase() : b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableItems;
  }, [shownStatistics, sortConfig]);


  const handleListChange = async (e: SelectChangeEvent<string>) => {
    const newList = e.target.value;
    setSelectedList(newList);
  };

  const handleSort = (key: sortKey) => {
    if (sortConfig.key === key) {
      setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  };
  // Function to return sort indicator
  const getSortIndicator = (key: sortKey) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ?
        <ArrowUpward fontSize="small" style={{ verticalAlign: '2px' }} /> :
        <ArrowDownward fontSize="small" style={{ verticalAlign: '2px' }} />;
    }
    return <span style={{ width: '24px', display: 'inline-block' }}></span>;
  };


  return (
    <Container>
    <div>
      <FormControl variant="outlined" fullWidth>
        <ListSelector
          lists={lists}
          onListChange={handleListChange}
          value={selectedList || ''}
        />
      </FormControl>
      <div id="ListStatistics">
        <Table>
          <TableHead>
            <TableRow>
              {columnNames.map((name, index) => {
                // Determine the sortKey based on the index or column name
                const sortKey = index === 0 ? 'key' : 'value';
                return (
                  <TableCell key={name} onClick={() => handleSort(sortKey)}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                      <span>{name}</span>
                      <span style={{ marginLeft: '8px', width: '24px', display: 'inline-block' }}>
                      {getSortIndicator(sortKey)}
                    </span>
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedStatistics.map((entry) => (
              <TableRow key={entry.key}>
                <TableCell>{entry.key}</TableCell>
                <TableCell>{entry.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
    </Container>
  );
};


export default WordStatistics;
