import React, {useEffect, useState} from 'react';
import {getWordStatistics, ListNamesDataStore, WordListDataStore} from "../modules/wordLists";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  FormControl,
  SelectChangeEvent,
} from '@mui/material';
import TableCell from '@mui/material/TableCell';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ListSelector from "./ListSelector";
import {ALL_LISTS} from "../constants";



const StatisticsContent = () => {
  const listNamesDataStore = new ListNamesDataStore();
  //fetched lists are not showed
  const [syncedLists,] = listNamesDataStore.useData([]);
  //lists are showed
  const [lists, setLists] = useState<string[] | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: null | number, direction: string }>({ key: null, direction: 'asc' });
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<{ [word: string]: number }>({});
  const columnNames = ["Word", "Times Seen"];

  useEffect(() => {
    //add "ALL LISTS" to the shown lists
    if(syncedLists !==null && syncedLists.length > 0 ){
      const newLists = [ALL_LISTS].concat(syncedLists);
      setLists(newLists);
    }
  }, [syncedLists]);

  //set the first list as selectedList by default
  useEffect(() => {
    if (selectedList === null && lists !== null && lists.includes(ALL_LISTS)) {
      setSelectedList(ALL_LISTS);
    }
  }, [lists]);

  useEffect(() => {
    console.log('selectedList changed:', selectedList);
    if (lists !== null && lists.length > 0 && selectedList !== null) {
      console.log('fetching statistics');
      fetchStatistics(selectedList);
    }
  }, [selectedList]);

  const sortedStatistics = React.useMemo(() => {
    const sortableItems = Object.entries(statistics);
    const key = sortConfig.key;
    if (key !== null) {
      sortableItems.sort((a, b) => {
        // Convert to lowercase if sorting by word (index 0)
        const aValue = key === 0 ? a[key].toLowerCase() : a[key];
        const bValue = key === 0 ? b[key].toLowerCase() : b[key];

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
  }, [statistics, sortConfig]);


  const fetchStatistics = async (list: string | null) => {
    if (!list) return;
    let lists_to_show: string[];
    console.log('fetching statistics for list:', list);
    if (list === ALL_LISTS) {
      if (lists === null) return;
      lists_to_show = lists;
    }
    else {
      lists_to_show = [list];
    }

    let words_to_show: string[] = [];
    for (const list_to_show of lists_to_show) {
      const dataStore = new WordListDataStore(list_to_show);
      const words = await dataStore.get();
      words_to_show = words_to_show.concat(words);
    }
    words_to_show = [...new Set(words_to_show)];

    const statisticsDiv: { [word: string]: number } = {};
    for (const word of words_to_show) {
      statisticsDiv[word] = await getWordStatistics(word);
    }

    setStatistics(statisticsDiv);
  };

  const handleListChange = async (e: SelectChangeEvent<string>) => {
    const newList = e.target.value;
    setSelectedList(newList);
  };

  const handleSort = (key: number) => {
    if (sortConfig.key === key) {
      setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  };
  // Function to return sort indicator
  const getSortIndicator = (key: number) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ?
        <ArrowUpward fontSize="small" style={{ verticalAlign: '2px' }} /> :
        <ArrowDownward fontSize="small" style={{ verticalAlign: '2px' }} />;
    }
    return <span style={{ width: '24px', display: 'inline-block' }}></span>;
  };


  return (
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
              {columnNames.map((name, index) => (
                <TableCell key={index} onClick={() => handleSort(index)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <span>{name}</span>
                    <span style={{ marginLeft: '8px', width: '24px', display: 'inline-block' }}>{getSortIndicator(index)}</span>
                  </div>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedStatistics.map(([word, stat]) => (
              <TableRow key={word}>
                <TableCell>{word}</TableCell>
                <TableCell>{stat}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};


export default StatisticsContent;
